import csv
import json
from pathlib import Path

import pytest
from src.cli import approve_lead
from src.generate_listings import (
    DEFAULT_PRICING_CONFIG,
    DASHBOARD_CSV,
    Item,
    append_dashboard_rows,
    build_follow_up_messages,
    build_quote_range,
    generate_listing,
    load_job_config,
    load_pricing_config,
    update_dashboard_status,
    write_etsy_csv,
    write_pending_quotes,
)


def test_generate_listing_fields():
    item = Item(
        sku="TEST-001",
        title_hint="Acme Widget",
        condition="Used",
        notes="Tested working.",
        weight_lbs=2.5,
        images=["photo1.jpg", "photo2.jpg"],
    )

    class DummyLogger:
        def info(self, *_args, **_kwargs):
            return None

    listing = generate_listing(
        item,
        load_job_config(Path("missing.json"), DummyLogger()),
        DEFAULT_PRICING_CONFIG,
        DummyLogger(),
    )

    assert listing.sku == "TEST-001"
    assert listing.title.startswith("Acme Widget")
    assert listing.condition == "Used"
    assert "Condition: Used" in listing.description
    assert listing.shipping_weight_lbs == 2.5
    assert listing.keywords
    assert listing.images == ["photo1.jpg", "photo2.jpg"]
    assert listing.confidence_score == 1.0


def test_write_etsy_csv_includes_tags_and_images(tmp_path):
    item = Item(
        sku="TEST-002",
        title_hint="Vintage Widget",
        condition="Used",
        notes="Tested working.",
        weight_lbs=1.0,
        images=["image-a.jpg"],
    )

    class DummyLogger:
        def info(self, *_args, **_kwargs):
            return None

    listing = generate_listing(
        item,
        load_job_config(Path("missing.json"), DummyLogger()),
        DEFAULT_PRICING_CONFIG,
        DummyLogger(),
    )
    output_path = tmp_path / "etsy.csv"
    write_etsy_csv([listing], output_path)

    with output_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)

    assert reader.fieldnames is not None
    assert "Tags" in reader.fieldnames
    assert "Image1" in reader.fieldnames
    assert rows[0]["Tags"] == listing.keywords
    assert rows[0]["Image1"] == "image-a.jpg"


def test_load_job_config_defaults_when_missing(tmp_path):
    class DummyLogger:
        def info(self, *_args, **_kwargs):
            return None

    config = load_job_config(tmp_path / "missing.json", DummyLogger())

    assert "job_types" in config
    assert "default" in config["job_types"]


def test_follow_up_messages_constraints():
    item = Item(
        sku="TEST-003",
        title_hint="Example Part",
        condition="Used",
        notes="Notes",
        weight_lbs=1.0,
        job_type="default",
        missing_info=["What is the serial number?", "Any visible damage?", "Do you have photos?"],
        time_windows=["Mon 9-11am", "Tue 1-3pm"],
    )

    class DummyLogger:
        def info(self, *_args, **_kwargs):
            return None

    pricing = DEFAULT_PRICING_CONFIG
    messages = build_follow_up_messages(item, 0.5, pricing, DummyLogger())

    for variant in ("friendly", "direct"):
        text = messages[variant]
        assert len(text) <= 700
        lowered = text.lower()
        assert "guarantee" not in lowered
        assert "exact" not in lowered
        assert "final price" not in lowered
        assert "100%" not in lowered
        assert "no matter what" not in lowered

        question_lines = [line for line in text.splitlines() if line.strip().startswith("- ")]
        assert len(question_lines) <= 3


def test_ready_for_approval_includes_time_windows():
    item = Item(
        sku="TEST-003A",
        title_hint="Example Part",
        condition="Used",
        notes="Notes",
        weight_lbs=1.0,
        time_windows=["Tue 2-4pm", "Wed 10am-12pm"],
    )

    class DummyLogger:
        def info(self, *_args, **_kwargs):
            return None

    messages = build_follow_up_messages(item, 0.95, DEFAULT_PRICING_CONFIG, DummyLogger())
    assert "Time windows:" in messages["friendly"]
    assert "or" in messages["friendly"]


def test_approve_lead_moves_files(tmp_path, monkeypatch):
    pending_dir = tmp_path / "pending"
    approved_dir = tmp_path / "approved"
    pending_dir.mkdir(parents=True)
    approved_dir.mkdir(parents=True)
    dashboard_path = tmp_path / "dashboard.csv"

    monkeypatch.setattr("src.cli.PENDING_QUEUE_DIR", pending_dir)
    monkeypatch.setattr("src.cli.APPROVED_QUEUE_DIR", approved_dir)
    monkeypatch.setattr("src.cli.DASHBOARD_CSV", dashboard_path)

    lead_id = "LEAD123"
    quote_path = pending_dir / f"{lead_id}.json"
    friendly_path = pending_dir / f"{lead_id}.friendly.txt"
    direct_path = pending_dir / f"{lead_id}.direct.txt"
    quote_path.write_text(
        json.dumps(
            {
                "lead_id": lead_id,
                "status": "pending",
                "created_at_iso": "2025-01-01T00:00:00+00:00",
                "approved_at_iso": None,
                "message_files": {
                    "friendly": str(friendly_path),
                    "direct": str(direct_path),
                },
            }
        ),
        encoding="utf-8",
    )
    friendly_path.write_text("Friendly message\n", encoding="utf-8")
    direct_path.write_text("Direct message\n", encoding="utf-8")

    success, _message = approve_lead(lead_id)
    approved_json = approved_dir / f"{lead_id}.json"

    assert success is True
    assert approved_json.exists()
    assert not quote_path.exists()
    assert not friendly_path.exists()
    assert not direct_path.exists()
    approved_data = json.loads(approved_json.read_text(encoding="utf-8"))
    assert approved_data["approved_at_iso"]
    assert approved_data["status"] == "approved"


def test_pending_quotes_default_status(tmp_path):
    item = Item(
        sku="TEST-005",
        title_hint="Widget",
        condition="Used",
        notes="Notes",
        weight_lbs=1.0,
    )

    class DummyLogger:
        def info(self, *_args, **_kwargs):
            return None

    listing = generate_listing(
        item,
        load_job_config(Path("missing.json"), DummyLogger()),
        DEFAULT_PRICING_CONFIG,
        DummyLogger(),
    )
    pending_dir = tmp_path / "pending"
    write_pending_quotes([listing], pending_dir, DummyLogger())

    data = json.loads((pending_dir / "TEST-005.json").read_text(encoding="utf-8"))
    assert data["status"] == "pending"
    assert data["created_at_iso"]
    assert data["approved_at_iso"] is None
    assert (pending_dir / "TEST-005.friendly.txt").exists()
    assert (pending_dir / "TEST-005.direct.txt").exists()


def test_approve_missing_lead_is_clean_error(tmp_path, monkeypatch):
    pending_dir = tmp_path / "pending"
    approved_dir = tmp_path / "approved"
    pending_dir.mkdir(parents=True)
    approved_dir.mkdir(parents=True)
    monkeypatch.setattr("src.cli.PENDING_QUEUE_DIR", pending_dir)
    monkeypatch.setattr("src.cli.APPROVED_QUEUE_DIR", approved_dir)
    monkeypatch.setattr("src.cli.DASHBOARD_CSV", tmp_path / "dashboard.csv")

    success, message = approve_lead("MISSING")
    assert not success
    assert "not found" in message


def test_dashboard_status_updates(tmp_path):
    dashboard_path = tmp_path / "dashboard.csv"

    class DummyLogger:
        def info(self, *_args, **_kwargs):
            return None

    item = Item(
        sku="TEST-006",
        title_hint="Widget",
        condition="Used",
        notes="Notes",
        weight_lbs=1.0,
    )
    listing = generate_listing(
        item,
        load_job_config(Path("missing.json"), DummyLogger()),
        DEFAULT_PRICING_CONFIG,
        DummyLogger(),
    )
    append_dashboard_rows([listing], dashboard_path, DummyLogger())
    update_dashboard_status(dashboard_path, "TEST-006", "approved", DummyLogger())

    with dashboard_path.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    assert rows[0]["status"] == "approved"


def test_pricing_config_overrides_applied(tmp_path):
    pytest.importorskip("yaml")
    config_path = tmp_path / "pricing.yaml"
    config_path.write_text(
        "\n".join(
            [
                "labor_rate_range:",
                "  default: [50, 60]",
                "labor_hours_range:",
                "  default: [1, 2]",
                "parts_range:",
                "  default: [5, 10]",
                "trip_fee_range:",
                "  with_zip: [15, 20]",
                "  without_zip: [0, 0]",
            ]
        ),
        encoding="utf-8",
    )

    class DummyLogger:
        def info(self, *_args, **_kwargs):
            return None

    pricing = load_pricing_config(config_path, DummyLogger())
    item = Item(
        sku="TEST-004",
        title_hint="Widget",
        condition="Used",
        notes="Notes",
        weight_lbs=1.0,
        zip_code="12345",
    )
    quote = build_quote_range(item, pricing, DummyLogger())
    assert quote == "$70.00-$150.00"


def test_pricing_config_fallback_on_missing(tmp_path):
    class DummyLogger:
        def info(self, *_args, **_kwargs):
            return None

    pricing = load_pricing_config(tmp_path / "missing.yaml", DummyLogger())
    assert pricing == DEFAULT_PRICING_CONFIG


def test_pricing_config_fallback_on_malformed(tmp_path):
    pytest.importorskip("yaml")

    class DummyLogger:
        def info(self, *_args, **_kwargs):
            return None

    config_path = tmp_path / "pricing.yaml"
    config_path.write_text("labor_rate_range: invalid", encoding="utf-8")
    pricing = load_pricing_config(config_path, DummyLogger())
    assert pricing == DEFAULT_PRICING_CONFIG


def test_dashboard_endpoint_lists_lead(tmp_path, monkeypatch):
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient
    from src.app import app
    dashboard_path = tmp_path / "dashboard.csv"
    dashboard_path.write_text(
        "\n".join(
            [
                "lead_id,job_type,confidence,quote_low,quote_high,next_action,status",
                "LEAD777,repair,0.75,10.00,20.00,review,pending",
            ]
        ),
        encoding="utf-8",
    )
    pending_dir = tmp_path / "pending"
    approved_dir = tmp_path / "approved"
    pending_dir.mkdir()
    approved_dir.mkdir()
    (pending_dir / "LEAD777.friendly.txt").write_text("Friendly", encoding="utf-8")
    (pending_dir / "LEAD777.direct.txt").write_text("Direct", encoding="utf-8")
    (pending_dir / "LEAD777.json").write_text(
        json.dumps(
            {
                "lead_id": "LEAD777",
                "recommended_style": "friendly",
                "message_files": {
                    "friendly": str(pending_dir / "LEAD777.friendly.txt"),
                    "direct": str(pending_dir / "LEAD777.direct.txt"),
                },
            }
        ),
        encoding="utf-8",
    )

    monkeypatch.setattr("src.app.gl.DASHBOARD_CSV", dashboard_path)
    monkeypatch.setattr("src.app.gl.PENDING_QUEUE_DIR", pending_dir)
    monkeypatch.setattr("src.app.gl.APPROVED_QUEUE_DIR", approved_dir)
    monkeypatch.setattr("src.app.gl.DEFAULT_LOG", tmp_path / "run.log")

    client = TestClient(app)
    response = client.get("/dashboard")
    assert response.status_code == 200
    assert "LEAD777" in response.text


def test_approve_endpoint_redirects_and_updates(tmp_path, monkeypatch):
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient
    from src.app import app
    dashboard_path = tmp_path / "dashboard.csv"
    dashboard_path.write_text(
        "\n".join(
            [
                "lead_id,job_type,confidence,quote_low,quote_high,next_action,status",
                "LEAD888,repair,0.50,0.00,0.00,review,pending",
            ]
        ),
        encoding="utf-8",
    )
    pending_dir = tmp_path / "pending"
    approved_dir = tmp_path / "approved"
    pending_dir.mkdir()
    approved_dir.mkdir()
    (pending_dir / "LEAD888.json").write_text(
        json.dumps(
            {
                "lead_id": "LEAD888",
                "status": "pending",
                "created_at_iso": "2025-01-01T00:00:00+00:00",
                "approved_at_iso": None,
            }
        ),
        encoding="utf-8",
    )
    (pending_dir / "LEAD888.friendly.txt").write_text("Friendly", encoding="utf-8")
    (pending_dir / "LEAD888.direct.txt").write_text("Direct", encoding="utf-8")

    monkeypatch.setattr("src.cli.PENDING_QUEUE_DIR", pending_dir)
    monkeypatch.setattr("src.cli.APPROVED_QUEUE_DIR", approved_dir)
    monkeypatch.setattr("src.cli.DASHBOARD_CSV", dashboard_path)
    monkeypatch.setattr("src.cli.DEFAULT_LOG", tmp_path / "run.log")
    monkeypatch.setattr("src.app.gl.PENDING_QUEUE_DIR", pending_dir)
    monkeypatch.setattr("src.app.gl.APPROVED_QUEUE_DIR", approved_dir)
    monkeypatch.setattr("src.app.gl.DASHBOARD_CSV", dashboard_path)
    monkeypatch.setattr("src.app.gl.DEFAULT_LOG", tmp_path / "run.log")

    client = TestClient(app)
    response = client.post("/approve/LEAD888", allow_redirects=False)
    assert response.status_code == 303
    assert "/dashboard" in response.headers["location"]
    approved_json = approved_dir / "LEAD888.json"
    assert approved_json.exists()


def test_message_endpoint_direct_style(tmp_path, monkeypatch):
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient
    from src.app import app

    pending_dir = tmp_path / "pending"
    approved_dir = tmp_path / "approved"
    pending_dir.mkdir()
    approved_dir.mkdir()
    direct_path = pending_dir / "LEAD999.direct.txt"
    friendly_path = pending_dir / "LEAD999.friendly.txt"
    direct_path.write_text("Direct message", encoding="utf-8")
    friendly_path.write_text("Friendly message", encoding="utf-8")
    (pending_dir / "LEAD999.json").write_text(
        json.dumps(
            {
                "lead_id": "LEAD999",
                "recommended_style": "friendly",
                "message_files": {
                    "friendly": str(friendly_path),
                    "direct": str(direct_path),
                },
            }
        ),
        encoding="utf-8",
    )

    monkeypatch.setattr("src.app.gl.PENDING_QUEUE_DIR", pending_dir)
    monkeypatch.setattr("src.app.gl.APPROVED_QUEUE_DIR", approved_dir)
    monkeypatch.setattr("src.app.gl.DEFAULT_LOG", tmp_path / "run.log")

    client = TestClient(app)
    response = client.get("/message/LEAD999?style=direct")
    assert response.status_code == 200
    assert "Direct message" in response.text
