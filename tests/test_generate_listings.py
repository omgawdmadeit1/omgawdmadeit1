import csv
import json
from pathlib import Path

import pytest

from src.cli import approve_lead
from src.generate_listings import (
    DEFAULT_PRICING_CONFIG,
    Item,
    build_follow_up_messages,
    build_quote_range,
    generate_listing,
    load_job_config,
    load_pricing_config,
    write_etsy_csv,
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
        assert "exact price" not in lowered


def test_approve_lead_moves_files(tmp_path, monkeypatch):
    pending_dir = tmp_path / "pending"
    approved_dir = tmp_path / "approved"
    pending_dir.mkdir(parents=True)
    approved_dir.mkdir(parents=True)

    monkeypatch.setattr("src.cli.PENDING_QUEUE_DIR", pending_dir)
    monkeypatch.setattr("src.cli.APPROVED_QUEUE_DIR", approved_dir)

    lead_id = "LEAD123"
    quote_path = pending_dir / f"{lead_id}.json"
    message_path = pending_dir / f"{lead_id}.txt"
    quote_path.write_text(json.dumps({"lead_id": lead_id, "approval_timestamp": None}), encoding="utf-8")
    message_path.write_text("Pending approval\n", encoding="utf-8")

    approved_json = approve_lead(lead_id)

    assert approved_json.exists()
    assert not quote_path.exists()
    assert not message_path.exists()
    approved_data = json.loads(approved_json.read_text(encoding="utf-8"))
    assert approved_data["approval_timestamp"]


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
