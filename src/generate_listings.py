import argparse
import csv
import json
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, List, Tuple

BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = BASE_DIR / "input" / "items.json"
DEFAULT_OUTPUT = BASE_DIR / "output" / "listings.csv"
DEFAULT_ETSY_OUTPUT = BASE_DIR / "output" / "etsy_listings.csv"
DEFAULT_CONFIG = BASE_DIR / "input" / "job_config.json"
DEFAULT_PRICING_CONFIG = BASE_DIR / "config" / "pricing.yaml"
DEFAULT_LOG = BASE_DIR / "logs" / "run.log"
OUTPUT_QUEUE_DIR = BASE_DIR / "output" / "queue"
PENDING_QUEUE_DIR = OUTPUT_QUEUE_DIR / "pending"
APPROVED_QUEUE_DIR = OUTPUT_QUEUE_DIR / "approved"


@dataclass
class Item:
    sku: str
    title_hint: str
    condition: str
    notes: str
    weight_lbs: float
    images: List[str] = field(default_factory=list)
    job_type: str = "default"
    missing_info: List[str] = field(default_factory=list)
    time_windows: List[str] = field(default_factory=list)
    zip_code: str = ""


@dataclass
class ListingDraft:
    sku: str
    title: str
    condition: str
    description: str
    category: str
    shipping_weight_lbs: float
    keywords: str
    images: List[str]
    confidence_score: float
    follow_up_messages: dict


CATEGORY_RULES: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"cash presenter|cash dispenser|cash drawer", re.I),
     "Business & Industrial > Retail & Services > Cash Registers & POS Equipment"),
    (re.compile(r"printer|receipt printer", re.I),
     "Business & Industrial > Retail & Services > POS Printers"),
    (re.compile(r"scanner|barcode", re.I),
     "Business & Industrial > Retail & Services > Barcode Scanners"),
]

STOPWORDS = {
    "the", "and", "for", "with", "a", "an", "of", "to", "in", "on", "by",
    "tested", "working", "minor", "cosmetic", "scuffs",
}

DEFAULT_JOB_CONFIG = {
    "job_types": {
        "default": {
            "labor_rate_per_hour": 0.0,
            "typical_hour_range": [0.0, 0.0],
            "trip_fee": 0.0,
        }
    }
}

DEFAULT_PRICING_CONFIG = {
    "labor_rate_range": {"default": [0.0, 0.0]},
    "labor_hours_range": {"default": [0.0, 0.0]},
    "parts_range": {"default": [0.0, 0.0]},
    "trip_fee_range": {"with_zip": [0.0, 0.0], "without_zip": [0.0, 0.0]},
}


def setup_logger(log_path: Path) -> logging.Logger:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("listing_generator")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()
    handler = logging.FileHandler(log_path, mode="w", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger


def load_items(path: Path) -> List[Item]:
    with path.open("r", encoding="utf-8") as handle:
        raw_items = json.load(handle)
    items = []
    for raw in raw_items:
        raw_images = raw.get("images", [])
        images: List[str]
        if isinstance(raw_images, list):
            images = [str(value).strip() for value in raw_images if str(value).strip()]
        elif raw_images:
            images = [str(raw_images).strip()]
        else:
            images = []
        raw_missing = raw.get("missing_info", [])
        if isinstance(raw_missing, list):
            missing_info = [str(value).strip() for value in raw_missing if str(value).strip()]
        elif raw_missing:
            missing_info = [str(raw_missing).strip()]
        else:
            missing_info = []
        raw_windows = raw.get("time_windows", [])
        if isinstance(raw_windows, list):
            time_windows = [str(value).strip() for value in raw_windows if str(value).strip()]
        elif raw_windows:
            time_windows = [str(raw_windows).strip()]
        else:
            time_windows = []
        items.append(
            Item(
                sku=str(raw.get("sku", "")).strip(),
                title_hint=str(raw.get("title_hint", "")).strip(),
                condition=str(raw.get("condition", "")).strip(),
                notes=str(raw.get("notes", "")).strip(),
                weight_lbs=float(raw.get("weight_lbs", 0)),
                images=images,
                job_type=str(raw.get("job_type", "default")).strip() or "default",
                missing_info=missing_info,
                time_windows=time_windows,
                zip_code=str(raw.get("zip_code", "")).strip(),
            )
        )
    return items


def load_job_config(path: Path, logger: logging.Logger) -> dict:
    if not path.exists():
        logger.info(
            "Job config not found at %s; using defaults.", path
        )
        return DEFAULT_JOB_CONFIG
    with path.open("r", encoding="utf-8") as handle:
        config = json.load(handle)
    if not isinstance(config, dict) or "job_types" not in config:
        logger.info(
            "Job config at %s missing expected structure; using defaults.", path
        )
        return DEFAULT_JOB_CONFIG
    logger.info("Loaded job config from %s", path)
    return config


def load_pricing_config(path: Path, logger: logging.Logger) -> dict:
    try:
        import yaml
    except ImportError:
        logger.info("PyYAML not installed; using default pricing config.")
        return DEFAULT_PRICING_CONFIG
    if not path.exists():
        logger.info("Pricing config not found at %s; using defaults.", path)
        return DEFAULT_PRICING_CONFIG
    try:
        with path.open("r", encoding="utf-8") as handle:
            config = yaml.safe_load(handle)
    except (OSError, ValueError, yaml.YAMLError):
        logger.info("Pricing config at %s invalid; using defaults.", path)
        return DEFAULT_PRICING_CONFIG
    if not validate_pricing_config(config):
        logger.info("Pricing config at %s failed validation; using defaults.", path)
        return DEFAULT_PRICING_CONFIG
    logger.info("Loaded pricing config overrides from %s", path)
    return config


def validate_range(values: object) -> bool:
    if not isinstance(values, list) or len(values) != 2:
        return False
    try:
        low = float(values[0])
        high = float(values[1])
    except (TypeError, ValueError):
        return False
    return low <= high


def validate_pricing_config(config: object) -> bool:
    if not isinstance(config, dict):
        return False
    for key in ("labor_rate_range", "labor_hours_range", "parts_range"):
        ranges = config.get(key)
        if not isinstance(ranges, dict) or "default" not in ranges:
            return False
        if not all(validate_range(value) for value in ranges.values()):
            return False
    trip_fee_range = config.get("trip_fee_range")
    if not isinstance(trip_fee_range, dict):
        return False
    if "with_zip" not in trip_fee_range or "without_zip" not in trip_fee_range:
        return False
    if not validate_range(trip_fee_range.get("with_zip")):
        return False
    if not validate_range(trip_fee_range.get("without_zip")):
        return False
    return True


def guess_category(title_hint: str, notes: str, logger: logging.Logger) -> str:
    haystack = f"{title_hint} {notes}"
    for pattern, category in CATEGORY_RULES:
        if pattern.search(haystack):
            logger.info("Category matched rule '%s' -> %s", pattern.pattern, category)
            return category
    fallback = "Other (unspecified)"
    logger.info(
        "No category match found for '%s'. Using fallback category '%s' (uncertain).",
        title_hint,
        fallback,
    )
    return fallback


def build_title(title_hint: str, condition: str, logger: logging.Logger) -> str:
    base_title = title_hint.strip()
    if condition and condition.lower() not in base_title.lower():
        candidate = f"{base_title} {condition}".strip()
    else:
        candidate = base_title

    if len(candidate) > 80:
        logger.info("Title truncated to 80 chars from '%s'.", candidate)
        candidate = candidate[:80].rstrip()
    return candidate


def extract_keywords(title_hint: str, notes: str, logger: logging.Logger) -> str:
    text = f"{title_hint} {notes}".lower()
    words = re.findall(r"[a-z0-9]+", text)
    unique_words = []
    for word in words:
        if word in STOPWORDS:
            continue
        if word not in unique_words:
            unique_words.append(word)
    keywords = ", ".join(unique_words[:10])
    logger.info("Keywords extracted: %s", keywords)
    return keywords


def build_description(item: Item, logger: logging.Logger) -> str:
    description_lines = [
        f"Item: {item.title_hint}",
        f"Condition: {item.condition}",
        f"Notes: {item.notes}",
        "Assumptions: No additional accessories or certifications included unless noted.",
    ]
    logger.info("Description built for SKU %s.", item.sku)
    return "\n".join(description_lines)


def generate_listing(
    item: Item,
    job_config: dict,
    pricing_config: dict,
    logger: logging.Logger,
) -> ListingDraft:
    title = build_title(item.title_hint, item.condition, logger)
    category = guess_category(item.title_hint, item.notes, logger)
    keywords = extract_keywords(item.title_hint, item.notes, logger)
    description = build_description(item, logger)
    if item.images:
        logger.info("Found %d image(s) for SKU %s.", len(item.images), item.sku)
    else:
        logger.info("No images listed for SKU %s; leaving image columns blank.", item.sku)

    confidence_score = compute_confidence_score(item)
    logger.info("Confidence score for SKU %s: %.2f", item.sku, confidence_score)
    follow_up_messages = build_follow_up_messages(
        item, confidence_score, pricing_config, logger
    )

    return ListingDraft(
        sku=item.sku,
        title=title,
        condition=item.condition,
        description=description,
        category=category,
        shipping_weight_lbs=item.weight_lbs,
        keywords=keywords,
        images=item.images,
        confidence_score=confidence_score,
        follow_up_messages=follow_up_messages,
    )


def compute_confidence_score(item: Item) -> float:
    checks = [
        bool(item.sku),
        bool(item.title_hint),
        bool(item.condition),
        bool(item.notes),
        item.weight_lbs > 0,
        bool(item.images),
    ]
    return round(sum(checks) / len(checks), 2)


def resolve_range(config: dict, key: str, job_type: str) -> List[float]:
    ranges = config.get(key, {})
    if job_type in ranges:
        return [float(ranges[job_type][0]), float(ranges[job_type][1])]
    default_range = ranges.get("default", [0.0, 0.0])
    return [float(default_range[0]), float(default_range[1])]


def build_quote_range(item: Item, pricing_config: dict, logger: logging.Logger) -> str:
    rate_range = resolve_range(pricing_config, "labor_rate_range", item.job_type)
    hours_range = resolve_range(pricing_config, "labor_hours_range", item.job_type)
    parts_range = resolve_range(pricing_config, "parts_range", item.job_type)
    trip_fee_rules = pricing_config.get("trip_fee_range", {})
    trip_range = (
        trip_fee_rules.get("with_zip", [0.0, 0.0])
        if item.zip_code
        else trip_fee_rules.get("without_zip", [0.0, 0.0])
    )
    low = rate_range[0] * hours_range[0] + parts_range[0] + float(trip_range[0])
    high = rate_range[1] * hours_range[1] + parts_range[1] + float(trip_range[1])
    logger.info(
        "Quote range for job_type '%s': rate %s, hours %s, parts %s, trip %s",
        item.job_type,
        rate_range,
        hours_range,
        parts_range,
        trip_range,
    )
    return f"${low:,.2f}-${high:,.2f}"


def build_time_windows(item: Item, logger: logging.Logger) -> List[str]:
    if len(item.time_windows) >= 2:
        return item.time_windows[:2]
    defaults = ["Weekdays 9am-12pm", "Weekdays 1pm-4pm"]
    logger.info("Using default time windows for SKU %s.", item.sku)
    return defaults


def build_missing_info_questions(item: Item) -> List[str]:
    return item.missing_info[:3]


def build_follow_up_messages(
    item: Item,
    confidence_score: float,
    pricing_config: dict,
    logger: logging.Logger,
) -> dict:
    summary = f"Summary: {item.title_hint} ({item.condition})"
    estimate = f"Estimate range: {build_quote_range(item, pricing_config, logger)}"
    windows = build_time_windows(item, logger)
    time_line = f"Time windows: {windows[0]} or {windows[1]}"
    questions = build_missing_info_questions(item)
    questions_block = ""
    if questions:
        question_lines = "\n".join(
            f"- {question} (so we can finalize the estimate)"
            for question in questions
        )
        questions_block = f"\nQuestions:\n{question_lines}"
    friendly = (
        "Hi there! Thanks for reaching out.\n"
        f"{summary}\n"
        f"{estimate}\n"
        f"{time_line}\n"
        "Happy to help whenever you're ready."
        f"{questions_block}"
    )
    direct = (
        "Thanks for the details.\n"
        f"{summary}\n"
        f"{estimate}\n"
        f"{time_line}"
        f"{questions_block}"
    )
    logger.info("Built follow-up messages for SKU %s.", item.sku)
    return {"friendly": friendly, "direct": direct, "confidence_score": confidence_score}


def write_csv(listings: Iterable[ListingDraft], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    listings_list = list(listings)
    max_images = max((len(listing.images) for listing in listings_list), default=0)
    if max_images == 0:
        max_images = 1
    fieldnames = [
        "SKU",
        "Title",
        "Condition",
        "Description",
        "Category",
        "ShippingWeightLbs",
        "Keywords",
        "ConfidenceScore",
    ]
    fieldnames.extend([f"Image{index}" for index in range(1, max_images + 1)])
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for listing in listings_list:
            row = {
                "SKU": listing.sku,
                "Title": listing.title,
                "Condition": listing.condition,
                "Description": listing.description,
                "Category": listing.category,
                "ShippingWeightLbs": listing.shipping_weight_lbs,
                "Keywords": listing.keywords,
                "ConfidenceScore": f"{listing.confidence_score:.2f}",
            }
            for index in range(max_images):
                key = f"Image{index + 1}"
                row[key] = listing.images[index] if index < len(listing.images) else ""
            writer.writerow(row)


def write_etsy_csv(listings: Iterable[ListingDraft], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    listings_list = list(listings)
    max_images = max((len(listing.images) for listing in listings_list), default=0)
    if max_images == 0:
        max_images = 1
    fieldnames = [
        "SKU",
        "Title",
        "Description",
        "Tags",
        "Category",
        "ShippingWeightLbs",
        "Quantity",
        "Price",
        "ConfidenceScore",
    ]
    fieldnames.extend([f"Image{index}" for index in range(1, max_images + 1)])
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for listing in listings_list:
            row = {
                "SKU": listing.sku,
                "Title": listing.title,
                "Description": listing.description,
                "Tags": listing.keywords,
                "Category": listing.category,
                "ShippingWeightLbs": listing.shipping_weight_lbs,
                "Quantity": 1,
                "Price": "",
                "ConfidenceScore": f"{listing.confidence_score:.2f}",
            }
            for index in range(max_images):
                key = f"Image{index + 1}"
                row[key] = listing.images[index] if index < len(listing.images) else ""
            writer.writerow(row)


def write_pending_quotes(
    listings: Iterable[ListingDraft],
    pending_dir: Path,
    logger: logging.Logger,
) -> None:
    pending_dir.mkdir(parents=True, exist_ok=True)
    for listing in listings:
        lead_id = listing.sku
        payload = {
            "lead_id": lead_id,
            "sku": listing.sku,
            "title": listing.title,
            "condition": listing.condition,
            "description": listing.description,
            "category": listing.category,
            "shipping_weight_lbs": listing.shipping_weight_lbs,
            "keywords": listing.keywords,
            "images": listing.images,
            "confidence_score": listing.confidence_score,
            "follow_up_messages": listing.follow_up_messages,
            "approval_timestamp": None,
        }
        quote_path = pending_dir / f"{lead_id}.json"
        message_path = pending_dir / f"{lead_id}.txt"
        with quote_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2, sort_keys=True)
        friendly = listing.follow_up_messages.get("friendly", "")
        direct = listing.follow_up_messages.get("direct", "")
        message_path.write_text(
            f"Friendly version:\n{friendly}\n\nDirect version:\n{direct}\n",
            encoding="utf-8",
        )
        logger.info("Wrote pending quote files for lead %s", lead_id)


def run(
    input_path: Path = DEFAULT_INPUT,
    output_path: Path = DEFAULT_OUTPUT,
    etsy_output_path: Path = DEFAULT_ETSY_OUTPUT,
    config_path: Path = DEFAULT_CONFIG,
    pricing_config_path: Path = DEFAULT_PRICING_CONFIG,
    log_path: Path = DEFAULT_LOG,
    dry_run: bool = False,
) -> None:
    logger = setup_logger(log_path)
    logger.info("Loading items from %s", input_path)
    job_config = load_job_config(config_path, logger)
    pricing_config = load_pricing_config(pricing_config_path, logger)
    items = load_items(input_path)
    listings = []
    for item in items:
        logger.info("Generating listing for SKU %s", item.sku)
        listings.append(generate_listing(item, job_config, pricing_config, logger))
    if dry_run:
        logger.info(
            "Dry run enabled; generated %d listings but did not write CSV.",
            len(listings),
        )
        return
    write_csv(listings, output_path)
    write_etsy_csv(listings, etsy_output_path)
    write_pending_quotes(listings, PENDING_QUEUE_DIR, logger)
    logger.info("Wrote %d listings to %s", len(listings), output_path)
    logger.info("Wrote %d Etsy listings to %s", len(listings), etsy_output_path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate eBay listing drafts from input/items.json."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--etsy-output", type=Path, default=DEFAULT_ETSY_OUTPUT)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--pricing-config", type=Path, default=DEFAULT_PRICING_CONFIG)
    parser.add_argument("--log", type=Path, default=DEFAULT_LOG)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate listings and logs without writing the CSV output.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(
        input_path=args.input,
        output_path=args.output,
        etsy_output_path=args.etsy_output,
        config_path=args.config,
        pricing_config_path=args.pricing_config,
        log_path=args.log,
        dry_run=args.dry_run,
    )
