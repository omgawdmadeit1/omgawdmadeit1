import csv
from html import escape
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException

from src.cli import approve_lead
from src.generate_listings import APPROVED_QUEUE_DIR, PENDING_QUEUE_DIR

BASE_DIR = Path(__file__).resolve().parents[1]
DASHBOARD_CSV = BASE_DIR / "output" / "dashboard.csv"

app = FastAPI()


def load_dashboard_rows(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return [row for row in reader]


def lookup_status(lead_id: str, fallback: str) -> str:
    if (APPROVED_QUEUE_DIR / f"{lead_id}.json").exists():
        return "approved"
    if (PENDING_QUEUE_DIR / f"{lead_id}.json").exists():
        return "pending"
    if fallback:
        return fallback
    return "unknown"


def load_lead_json(lead_id: str) -> Optional[Dict[str, object]]:
    approved_path = APPROVED_QUEUE_DIR / f"{lead_id}.json"
    pending_path = PENDING_QUEUE_DIR / f"{lead_id}.json"
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
        "<th>Quote Range</th>"
        "<th>Next Action</th>"
        "<th>Status</th>"
        "</tr>"
    )
    body_rows = []
    for row in rows:
        lead_id = row.get("lead_id", "")
        status = lookup_status(lead_id, row.get("status", ""))
        body_rows.append(
            "<tr>"
            f"<td><a href=\"/lead/{escape(lead_id)}\">{escape(lead_id)}</a></td>"
            f"<td>{escape(row.get('job_type', ''))}</td>"
            f"<td>{escape(row.get('confidence', ''))}</td>"
            f"<td>{escape(row.get('quote range', ''))}</td>"
            f"<td>{escape(row.get('next_action', ''))}</td>"
            f"<td>{escape(status)}</td>"
            "</tr>"
        )
    body = "".join(body_rows)
    return f"<table border=\"1\">{header}{body}</table>"


@app.get("/dashboard")
def dashboard() -> str:
    rows = load_dashboard_rows(DASHBOARD_CSV)
    if not rows:
        return "<h1>Dashboard</h1><p>No dashboard data found.</p>"
    table_html = render_table(rows)
    return f"<h1>Dashboard</h1>{table_html}"


@app.get("/lead/{lead_id}")
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
def approve(lead_id: str) -> Dict[str, str]:
    success, message = approve_lead(lead_id)
    if not success:
        raise HTTPException(status_code=404, detail=message)
    return {"status": "approved", "message": message}
