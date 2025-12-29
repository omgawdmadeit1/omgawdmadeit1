import argparse
import json
from datetime import datetime, timezone

from src.generate_listings import (
    APPROVED_QUEUE_DIR,
    DASHBOARD_CSV,
    DEFAULT_LOG,
    PENDING_QUEUE_DIR,
    setup_logger,
    update_dashboard_status,
)


def approve_lead(lead_id: str) -> tuple[bool, str]:
    logger = setup_logger(DEFAULT_LOG, mode="a")
    pending_json = PENDING_QUEUE_DIR / f"{lead_id}.json"
    pending_friendly = PENDING_QUEUE_DIR / f"{lead_id}.friendly.txt"
    pending_direct = PENDING_QUEUE_DIR / f"{lead_id}.direct.txt"
    approved_json = APPROVED_QUEUE_DIR / f"{lead_id}.json"
    approved_friendly = APPROVED_QUEUE_DIR / f"{lead_id}.friendly.txt"
    approved_direct = APPROVED_QUEUE_DIR / f"{lead_id}.direct.txt"

    if not pending_json.exists():
        message = f"Pending quote not found for lead_id {lead_id}"
        logger.info(message)
        return False, message
    if not pending_friendly.exists() or not pending_direct.exists():
        message = f"Pending message files not found for lead_id {lead_id}"
        logger.info(message)
        return False, message

    APPROVED_QUEUE_DIR.mkdir(parents=True, exist_ok=True)

    data = json.loads(pending_json.read_text(encoding="utf-8"))
    data["status"] = "approved"
    data["approved_at_iso"] = datetime.now(timezone.utc).isoformat()
    data["message_files"] = {
        "friendly": str(approved_friendly),
        "direct": str(approved_direct),
    }
    approved_json.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")
    approved_friendly.write_text(pending_friendly.read_text(encoding="utf-8"), encoding="utf-8")
    approved_direct.write_text(pending_direct.read_text(encoding="utf-8"), encoding="utf-8")

    pending_json.unlink()
    pending_friendly.unlink()
    pending_direct.unlink()
    update_dashboard_status(DASHBOARD_CSV, lead_id, "approved", logger)
    logger.info("Approved lead %s and moved files to %s", lead_id, APPROVED_QUEUE_DIR)

    return True, f"Approved lead {lead_id}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Approval workflow commands.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    approve_parser = subparsers.add_parser("approve", help="Approve a pending lead.")
    approve_parser.add_argument("--lead_id", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.command == "approve":
        success, message = approve_lead(args.lead_id)
        if not success:
            raise SystemExit(message)


if __name__ == "__main__":
    main()
