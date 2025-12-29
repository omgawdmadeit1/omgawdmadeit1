import csv
from html import escape
import json
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import quote_plus

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse

from src.cli import approve_lead
from src import generate_listings as gl

app = FastAPI()


def load_dashboard_rows(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return [row for row in reader]


def lookup_status(lead_id: str, fallback: str, logger) -> str:
    approved_json = gl.APPROVED_QUEUE_DIR / f"{lead_id}.json"
    pending_json = gl.PENDING_QUEUE_DIR / f"{lead_id}.json"
    if approved_json.exists():
        return "approved"
    if pending_json.exists():
        return "pending"
    if fallback:
        return fallback
    logger.info("Lead %s missing queue files; marking status error.", lead_id)
    return "error"


def load_lead_json(lead_id: str) -> Optional[Dict[str, object]]:
    approved_path = gl.APPROVED_QUEUE_DIR / f"{lead_id}.json"
    pending_path = gl.PENDING_QUEUE_DIR / f"{lead_id}.json"
    if approved_path.exists():
        return {
            "status": "approved",
            "payload": approved_path.read_text(encoding="utf-8"),
        }
    if pending_path.exists():
        return {
            "status": "pending",
            "payload": pending_path.read_text(encoding="utf-8"),
        }
    return None


def render_table(rows: List[Dict[str, str]]) -> str:
    header = (
        "<tr>"
        "<th>Lead ID</th>"
        "<th>Job Type</th>"
        "<th>Confidence</th>"
        "<th>Quote Low</th>"
        "<th>Quote High</th>"
        "<th>Next Action</th>"
        "<th>Status</th>"
        "<th>Recommended Style</th>"
        "<th>Actions</th>"
        "</tr>"
    )
    body_rows = []
    logger = gl.setup_logger(gl.DEFAULT_LOG, mode="a")
    for row in rows:
        lead_id = row.get("lead_id", "")
        status = lookup_status(lead_id, row.get("status", ""), logger)
        approve_action = ""
        if status == "pending":
            approve_action = (
                f"<form method=\"post\" action=\"/approve/{escape(lead_id)}\">"
                "<button type=\"submit\">Approve</button>"
                "</form>"
            )
        message_link = (
            f"<a href=\"/message/{escape(lead_id)}?style=friendly\">View Friendly</a>"
            " | "
            f"<a href=\"/message/{escape(lead_id)}?style=direct\">View Direct</a>"
        )
        recommended_style = "unknown"
        lead_data = load_lead_json(lead_id)
        if lead_data:
            try:
                payload = json.loads(lead_data["payload"])
                recommended_style = payload.get("recommended_style", "unknown")
            except json.JSONDecodeError:
                recommended_style = "unknown"
        body_rows.append(
            "<tr>"
            f"<td><a href=\"/lead/{escape(lead_id)}\">{escape(lead_id)}</a></td>"
            f"<td>{escape(row.get('job_type', ''))}</td>"
            f"<td>{escape(row.get('confidence', ''))}</td>"
            f"<td>{escape(row.get('quote_low', ''))}</td>"
            f"<td>{escape(row.get('quote_high', ''))}</td>"
            f"<td>{escape(row.get('next_action', ''))}</td>"
            f"<td>{escape(status)}</td>"
            f"<td>{escape(str(recommended_style))}</td>"
            f"<td>{approve_action} {message_link}</td>"
            "</tr>"
        )
    body = "".join(body_rows)
    return f"<table border=\"1\">{header}{body}</table>"


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request) -> str:
    rows = load_dashboard_rows(gl.DASHBOARD_CSV)
    message = request.query_params.get("message")
    error = request.query_params.get("error")
    status_block = ""
    if message:
        status_block = f"<p style=\"color: green;\">{escape(message)}</p>"
    if error:
        status_block = f"<p style=\"color: red;\">{escape(error)}</p>"
    if not rows:
        return (
            "<h1>Dashboard</h1>"
            f"{status_block}"
            "<p>No leads yet. <a href=\"/intake\">Go to intake</a></p>"
        )
    table_html = render_table(rows)
    return f"<h1>Dashboard</h1>{status_block}{table_html}"


@app.get("/lead/{lead_id}", response_class=HTMLResponse)
def lead_detail(lead_id: str) -> str:
    data = load_lead_json(lead_id)
    if not data:
        raise HTTPException(status_code=404, detail="Lead not found")
    payload = escape(data["payload"])
    return (
        f"<h1>Lead {escape(lead_id)}</h1>"
        f"<p>Status: {escape(data['status'])}</p>"
        f"<pre>{payload}</pre>"
    )


@app.post("/approve/{lead_id}")
def approve(lead_id: str) -> RedirectResponse:
    success, message = approve_lead(lead_id)
    if not success:
        return RedirectResponse(url=f"/dashboard?error={quote_plus(message)}", status_code=303)
    return RedirectResponse(url=f"/dashboard?message={quote_plus(message)}", status_code=303)


@app.get("/message/{lead_id}", response_class=HTMLResponse)
def message(lead_id: str, style: Optional[str] = None) -> str:
    lead_data = load_lead_json(lead_id)
    if not lead_data:
        raise HTTPException(status_code=404, detail="Lead not found")
    payload = json.loads(lead_data["payload"])
    recommended_style = payload.get("recommended_style", "friendly")
    selected_style = style or recommended_style
    if selected_style not in ("friendly", "direct"):
        selected_style = recommended_style
    message_files = payload.get("message_files", {})
    path = message_files.get(selected_style)
    if not path:
        logger = gl.setup_logger(gl.DEFAULT_LOG, mode="a")
        logger.info("Message path missing for lead %s style %s.", lead_id, selected_style)
        raise HTTPException(status_code=404, detail="Message not found")
    message_path = Path(path)
    if not message_path.exists():
        logger = gl.setup_logger(gl.DEFAULT_LOG, mode="a")
        logger.info("Message file missing for lead %s style %s.", lead_id, selected_style)
        raise HTTPException(status_code=404, detail="Message not found")
    text = message_path.read_text(encoding="utf-8")
    return (
        f"<h1>Message {escape(lead_id)} ({escape(selected_style)})</h1>"
        f"<pre>{escape(text)}</pre>"
    )
