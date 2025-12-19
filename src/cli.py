import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from src.generate_listings import APPROVED_QUEUE_DIR, PENDING_QUEUE_DIR


def approve_lead(lead_id: str) -> Path:
    pending_json = PENDING_QUEUE_DIR / f"{lead_id}.json"
    pending_message = PENDING_QUEUE_DIR / f"{lead_id}.txt"
    approved_json = APPROVED_QUEUE_DIR / f"{lead_id}.json"
    approved_message = APPROVED_QUEUE_DIR / f"{lead_id}.txt"

    if not pending_json.exists():
        raise FileNotFoundError(f"Pending quote not found for lead_id {lead_id}")
    if not pending_message.exists():
        raise FileNotFoundError(f"Pending message not found for lead_id {lead_id}")

    APPROVED_QUEUE_DIR.mkdir(parents=True, exist_ok=True)

    data = json.loads(pending_json.read_text(encoding="utf-8"))
    data["approval_timestamp"] = datetime.now(timezone.utc).isoformat()
    approved_json.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")
    approved_message.write_text(pending_message.read_text(encoding="utf-8"), encoding="utf-8")

    pending_json.unlink()
    pending_message.unlink()

    return approved_json


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Approval workflow commands.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    approve_parser = subparsers.add_parser("approve", help="Approve a pending lead.")
    approve_parser.add_argument("--lead_id", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.command == "approve":
        approve_lead(args.lead_id)


if __name__ == "__main__":
    main()
