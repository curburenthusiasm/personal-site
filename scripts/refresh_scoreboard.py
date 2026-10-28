#!/usr/bin/env python3
"""Refresh the public macro board from no-key market and government data feeds."""

from __future__ import annotations

import concurrent.futures
import json
import math
import os
import re
import tempfile
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
LATEST_PATH = DATA_DIR / "scoreboard.json"
ET_TZ = ZoneInfo("America/New_York")
USER_AGENT = "FieldNotesMacroScoreboard/1.0 (public data reader)"
TREASURY_DEBT_URL = (
    "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/"
    "v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1"
)
TREASURY_YIELD_URL = (
    "https://home.treasury.gov/resource-center/data-chart-center/"
    "interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value={year}"
)
OAT_URL = "https://www.ideal-investisseur.fr/en/markets/oat-bund-spread.html"
GOLD_URL = "https://api.gold-api.com/price/XAU"
SILVER_URL = "https://api.gold-api.com/price/XAG"
BTC_URL = "https://api.coinbase.com/v2/prices/BTC-USD/spot"
STABLE_URL = "https://stablecoins.llama.fi/stablecoins?includePrices=false"
BRENT_PAGE_URL = "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm"
DXY_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB"
GOLD_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F"

BASELINES = [
    {"k": "debt", "label": "US total debt", "v": "$40.07T", "source": "Supplied baseline", "source_url": "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/", "observed_at": "2026-09-28", "status": "baseline", "note": "Supplied snapshot; not current."},
    {"k": "us10y", "label": "10Y Treasury yield", "v": "~4.95%", "source": "Supplied baseline", "source_url": "https://home.treasury.gov/resource-center/data-chart-center/interest-rates", "observed_at": "2026-09-28", "status": "baseline", "note": "Supplied snapshot; not current."},
    {"k": "oat", "label": "OAT–Bund spread", "v": "105bp", "source": "Supplied baseline", "source_url": OAT_URL, "observed_at": "2026-09-28", "status": "baseline", "note": "Supplied snapshot; not current."},
    {"k": "gold", "label": "Gold", "v": "~$4,350", "source": "Supplied baseline", "source_url": GOLD_URL, "observed_at": "2026-09-28", "status": "baseline", "note": "Supplied snapshot; not current."},
    {"k": "silver", "label": "Silver", "v": "+52% YoY", "source": "Supplied baseline", "source_url": SILVER_URL, "observed_at": "2026-09-28", "status": "baseline", "note": "Baseline is year-over-year; refreshed feed reports spot."},
    {"k": "btc", "label": "Bitcoin", "v": "$77K", "source": "Supplied baseline", "source_url": BTC_URL, "observed_at": "2026-09-28", "status": "baseline", "note": "Supplied snapshot; not current."},
    {"k": "stable", "label": "USD-pegged stablecoins", "v": "$308B", "source": "Supplied baseline", "source_url": STABLE_URL, "observed_at": "2026-09-28", "status": "baseline", "note": "Supplied snapshot; not current."},
    {"k": "brent", "label": "Brent crude", "v": "~$90", "source": "Supplied baseline", "source_url": BRENT_PAGE_URL, "observed_at": "2026-09-28", "status": "baseline", "note": "Supplied snapshot; not current."},
    {"k": "dxy", "label": "Dollar index (DXY)", "v": "~99.7", "source": "Supplied baseline", "source_url": "https://finance.yahoo.com/quote/DX-Y.NYB/", "observed_at": "2026-09-28", "status": "baseline", "note": "Supplied snapshot; not current."},
]
TRIGGER_IDS = [
    "genius_final_rules",
    "genius_effective",
    "issuer_approvals",
    "btc_reserve",
    "btc_budget_neutral",
    "clarity_act",
    "hr8957",
    "gold_revaluation",
    "hard_asset_backing",
]
VALID_TRIGGER_STATES = {
    "genius_final_rules": {"RULEMAKING", "LIVE", "WATCH"},
    "genius_effective": {"SCHEDULED", "LIVE", "WATCH"},
    "issuer_approvals": {"WATCH", "LIVE"},
    "btc_reserve": {"LIVE", "WATCH"},
    "btc_budget_neutral": {"DIRECTED", "LIVE", "WATCH"},
    "clarity_act": {"PROPOSED", "STALLED", "LIVE"},
    "hr8957": {"PROPOSED", "LIVE", "WATCH"},
    "gold_revaluation": {"PROPOSED", "LIVE", "ABSENT"},
    "hard_asset_backing": {"LIVE", "ABSENT"},
}
SIGNAL_KEYS = ("g7_auction_fail", "dedollar_official", "recap_policy_advance")


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def fetch_bytes(url: str, timeout: int = 25) -> bytes:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "*/*"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read()


def fetch_json(url: str) -> dict:
    return json.loads(fetch_bytes(url))


def parse_iso_date(value: str | None) -> str | None:
    if not value:
        return None
    match = re.search(r"\d{4}-\d{2}-\d{2}", str(value))
    return match.group(0) if match else None


def parse_et_date(value: str | None) -> str | None:
    if not value:
        return None
    try:
        normalized = str(value).replace("Z", "+00:00")
        stamp = datetime.fromisoformat(normalized)
        if stamp.tzinfo is None:
            stamp = stamp.replace(tzinfo=timezone.utc)
        return stamp.astimezone(ET_TZ).date().isoformat()
    except ValueError:
        return parse_iso_date(value)


def money(value: float, places: int = 2) -> str:
    return "$" + format(value, f",.{places}f")


def amount_short(value: float) -> str:
    if value >= 1_000_000_000_000:
        return "$" + format(value / 1_000_000_000_000, ".2f") + "T"
    if value >= 1_000_000_000:
        return "$" + format(value / 1_000_000_000, ".1f") + "B"
    return money(value)


def make_metric(k: str, label: str, value: str, source: str, source_url: str,
                observed_at: str | None, note: str | None = None) -> dict:
    item = {
        "k": k,
        "label": label,
        "v": value,
        "source": source,
        "source_url": source_url,
        "observed_at": observed_at or utc_now().date().isoformat(),
        "status": "verified",
    }
    if note:
        item["note"] = note
    return item


def read_debt() -> dict:
    payload = fetch_json(TREASURY_DEBT_URL)
    rows = payload.get("data") or []
    if not rows:
        raise ValueError("Treasury debt feed returned no rows")
    row = max(rows, key=lambda x: x.get("record_date", ""))
    total = float(row["tot_pub_debt_out_amt"])
    return make_metric(
        "debt", "US total debt", amount_short(total), "US Treasury Fiscal Data",
        "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/",
        parse_iso_date(row.get("record_date")),
    )


def read_treasury_yield(local_date: date) -> dict:
    xml_data = fetch_bytes(TREASURY_YIELD_URL.format(year=local_date.year))
    root = ET.fromstring(xml_data)
    entries = root.findall("{http://www.w3.org/2005/Atom}entry")
    rows = []
    ns_meta = "{http://schemas.microsoft.com/ado/2007/08/dataservices/metadata}properties"
    for entry in entries:
        properties = entry.find(".//" + ns_meta)
        if properties is None:
            continue
        values = {node.tag.rsplit("}", 1)[-1]: node.text for node in properties}
        day = parse_iso_date(values.get("NEW_DATE"))
        raw = values.get("BC_10YEAR")
        if day and raw not in (None, ""):
            rows.append((day, float(raw)))
    if not rows:
        raise ValueError("Treasury yield feed returned no 10-year observations")
    observed_at, rate = max(rows, key=lambda row: row[0])
    return make_metric(
        "us10y", "10Y Treasury yield", format(rate, ".2f") + "%",
        "US Treasury Daily Par Yield Curve",
        "https://home.treasury.gov/resource-center/data-chart-center/interest-rates",
        observed_at,
    )


def read_oat_spread() -> dict:
    html = fetch_bytes(OAT_URL).decode("utf-8", "replace")
    description = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)',
        html,
        re.IGNORECASE,
    )
    title = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    text = (description.group(1) if description else "") + " " + (title.group(1) if title else "")
    match = re.search(
        r"spread as of\s+([A-Za-z]{3}\s+\d{1,2},\s+\d{4})\s*:\s*([\d.]+)\s*basis points",
        text,
        re.IGNORECASE,
    )
    if not match:
        raise ValueError("OAT/Bund source did not expose a recognized dated spread")
    observed_at = datetime.strptime(match.group(1), "%b %d, %Y").date().isoformat()
    spread = float(match.group(2))
    return make_metric(
        "oat", "OAT–Bund spread", format(spread, ".1f") + "bp",
        "Ideal-Investisseur (Banque de France / Bundesbank data)",
        OAT_URL, observed_at,
    )


def read_metal(symbol: str, key: str, label: str) -> dict:
    payload = fetch_json("https://api.gold-api.com/price/" + symbol)
    price = float(payload["price"])
    updated_at = payload.get("updatedAt")
    return make_metric(
        key, label, money(price) + "/oz", "Gold-API spot quote",
        "https://api.gold-api.com/price/" + symbol,
        parse_et_date(updated_at),
        "Spot quote; provider timestamp: " + str(updated_at or "not supplied"),
    )


def read_btc() -> dict:
    payload = fetch_json(BTC_URL)
    quote = payload["data"]
    price = float(quote["amount"])
    retrieved_at = utc_now()
    return make_metric(
        "btc", "Bitcoin", money(price), "Coinbase spot quote",
        "https://api.coinbase.com/v2/prices/BTC-USD/spot",
        retrieved_at.isoformat().replace("+00:00", "Z"),
        "Spot quote retrieved at " + retrieved_at.isoformat().replace("+00:00", "Z"),
    )


def read_stablecoins() -> dict:
    payload = fetch_json(STABLE_URL)
    assets = payload.get("peggedAssets") or []
    total = 0.0
    for asset in assets:
        circulating = asset.get("circulating") or {}
        try:
            total += float(circulating.get("peggedUSD") or 0)
        except (TypeError, ValueError):
            continue
    if total <= 0:
        raise ValueError("Stablecoin feed returned no USD-pegged circulation")
    return make_metric(
        "stable", "USD-pegged stablecoins", amount_short(total),
        "DefiLlama stablecoin API", STABLE_URL,
        utc_now().astimezone(ET_TZ).date().isoformat(),
        "Sum of reported USD-pegged circulating supply.",
    )


def read_brent(local_date: date) -> dict:
    start = (local_date - timedelta(days=30)).isoformat()
    query = urllib.parse.urlencode(
        [
            ("api_key", "DEMO_KEY"),
            ("frequency", "daily"),
            ("data[0]", "value"),
            ("facets[series][]", "RBRTE"),
            ("sort[0][column]", "period"),
            ("sort[0][direction]", "desc"),
            ("length", "30"),
            ("start", start),
            ("end", local_date.isoformat()),
        ]
    )
    url = "https://api.eia.gov/v2/petroleum/pri/spt/data/?" + query
    payload = fetch_json(url)
    rows = (payload.get("response") or {}).get("data") or []
    if not rows:
        raise ValueError("EIA feed returned no Brent spot observations")
    row = max(rows, key=lambda x: x.get("period", ""))
    value = float(row["value"])
    return make_metric(
        "brent", "Brent crude", money(value) + "/bbl",
        "US Energy Information Administration", BRENT_PAGE_URL,
        parse_iso_date(row.get("period")),
        "Latest published daily spot observation; publication may lag.",
    )


def read_yahoo_chart(url: str, symbol: str) -> list[tuple[str, float]]:
    query = urllib.parse.urlencode({"range": "1mo", "interval": "1d"})
    payload = fetch_json(url + "?" + query)
    error = (payload.get("chart") or {}).get("error")
    result = (payload.get("chart") or {}).get("result") or []
    if error or not result:
        raise ValueError("Yahoo chart did not return " + symbol + " data")
    series = result[0]
    timestamps = series.get("timestamp") or []
    quote = ((series.get("indicators") or {}).get("quote") or [{}])[0]
    closes = quote.get("close") or []
    rows = []
    for stamp, close in zip(timestamps, closes):
        if close is None:
            continue
        day = datetime.fromtimestamp(stamp, timezone.utc).astimezone(ET_TZ).date().isoformat()
        rows.append((day, float(close)))
    if not rows:
        raise ValueError("Yahoo chart contained no closes for " + symbol)
    return rows


def read_dxy(rows: list[tuple[str, float]]) -> dict:
    day, value = rows[-1]
    return make_metric(
        "dxy", "DXY futures proxy", format(value, ".2f"),
        "Yahoo Finance DX-Y.NYB continuous contract",
        "https://finance.yahoo.com/quote/DX-Y.NYB/",
        day,
        "Daily close/latest value for a continuous ICE dollar-index futures proxy, not the cash index.",
    )


def sustained_joint_signal(
    gold_rows: list[tuple[str, float]],
    dxy_rows: list[tuple[str, float]],
) -> tuple[bool | None, dict]:
    gold = dict(gold_rows)
    dxy = dict(dxy_rows)
    days = sorted(set(gold) & set(dxy))
    if len(days) < 13:
        return None, {"status": "unknown", "reason": "Fewer than 13 aligned closes."}
    reference = days[-11]
    recent = days[-3:]
    g_base, d_base = gold[reference], dxy[reference]
    fired = all(gold[day] > g_base and dxy[day] > d_base for day in recent)
    evidence = {
        "status": "verified",
        "reference_date": reference,
        "confirmation_dates": recent,
        "definition": "Both futures proxies closed above their values 10 aligned sessions earlier for 3 consecutive closes.",
        "gold_proxy": "COMEX continuous gold futures (GC=F)",
        "dxy_proxy": "ICE continuous dollar-index contract (DX-Y.NYB)",
        "source_url": "https://finance.yahoo.com/quote/DX-Y.NYB/",
        "source_urls": [
            "https://finance.yahoo.com/quote/GC=F/",
            "https://finance.yahoo.com/quote/DX-Y.NYB/",
        ],
    }
    return fired, evidence


def old_snapshot() -> dict:
    try:
        return json.loads(LATEST_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}


def atomic_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=path.parent, prefix=path.name + ".", delete=False
    ) as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temp_path = Path(handle.name)
    os.replace(temp_path, path)


def refresh() -> dict:
    previous = old_snapshot()
    old_metrics = {item.get("k"): item for item in previous.get("metrics", [])}
    metrics = {item["k"]: dict(old_metrics.get(item["k"]) or item) for item in BASELINES}
    for item in metrics.values():
        item.setdefault("status", "baseline")
        item.setdefault("observed_at", "2026-09-28")
    local_date = datetime.now(ET_TZ).date()

    def store_result(key: str, call) -> tuple[str, str | None]:
        try:
            item = call()
            metrics[key] = item
            return key, None
        except Exception as exc:
            prior = metrics[key]
            if prior.get("status") == "verified":
                prior["status"] = "stale"
                prior["note"] = "Refresh failed; retaining the last verified reading."
            return key, type(exc).__name__

    def chart_call(url: str, symbol: str):
        return read_yahoo_chart(url, symbol)

    tasks = {
        "debt": read_debt,
        "us10y": lambda: read_treasury_yield(local_date),
        "oat": read_oat_spread,
        "gold": lambda: read_metal("XAU", "gold", "Gold"),
        "silver": lambda: read_metal("XAG", "silver", "Silver spot"),
        "btc": read_btc,
        "stable": read_stablecoins,
        "brent": lambda: read_brent(local_date),
        "dxy": lambda: read_dxy(read_yahoo_chart(DXY_CHART_URL, "DX-Y.NYB")),
    }
    errors = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=9) as executor:
        futures = {executor.submit(store_result, key, fn): key for key, fn in tasks.items()}
        for future in concurrent.futures.as_completed(futures):
            key, error = future.result()
            if error:
                errors.append({"k": key, "error": error})

    gold_rows = dxy_rows = None
    signal_errors = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        gold_future = executor.submit(chart_call, GOLD_CHART_URL, "GC=F")
        dxy_future = executor.submit(chart_call, DXY_CHART_URL, "DX-Y.NYB")
        try:
            gold_rows = gold_future.result()
        except Exception as exc:
            signal_errors.append("gold history unavailable (" + type(exc).__name__ + ")")
        try:
            dxy_rows = dxy_future.result()
        except Exception as exc:
            signal_errors.append("dollar history unavailable (" + type(exc).__name__ + ")")

    prior_signals = previous.get("signals") or {}
    prior_meta = previous.get("signal_meta") or {}
    gold_dxy = None
    gold_dxy_meta = {"status": "unknown", "reason": "; ".join(signal_errors) or "History unavailable."}
    if gold_rows and dxy_rows:
        gold_dxy, gold_dxy_meta = sustained_joint_signal(gold_rows, dxy_rows)
    if gold_dxy is None and isinstance(prior_signals.get("gold_dxy_together"), bool):
        gold_dxy = prior_signals["gold_dxy_together"]
        gold_dxy_meta = dict(prior_meta.get("gold_dxy_together") or {})
        gold_dxy_meta["status"] = "stale"

    def carried_bool(key: str):
        value = prior_signals.get(key)
        return value if isinstance(value, bool) else None

    oat_metric = metrics["oat"]
    oat_value_match = re.search(r"-?\d+(?:\.\d+)?", oat_metric.get("v", ""))
    oat_value = float(oat_value_match.group(0)) if oat_value_match and oat_metric.get("status") == "verified" else None
    signals = {
        "oat_bund_bp": oat_value,
        "gold_dxy_together": gold_dxy,
        "g7_auction_fail": carried_bool("g7_auction_fail"),
        "dedollar_official": carried_bool("dedollar_official"),
        "recap_policy_advance": carried_bool("recap_policy_advance"),
    }
    signal_meta = {
        "oat_bund_bp": {"status": "verified" if oat_value is not None else "unknown", "source_url": oat_metric.get("source_url")},
        "gold_dxy_together": gold_dxy_meta,
        "g7_auction_fail": dict(prior_meta.get("g7_auction_fail") or {"status": "unknown", "reason": "Requires verified auction evidence; no automatic source is configured."}),
        "dedollar_official": dict(prior_meta.get("dedollar_official") or {"status": "unknown", "reason": "Requires current WGC or TIC evidence; no automatic source is configured."}),
        "recap_policy_advance": dict(prior_meta.get("recap_policy_advance") or {"status": "unknown", "reason": "Requires current legislative or Treasury evidence; no automatic source is configured."}),
    }
    for key in SIGNAL_KEYS:
        if signals[key] is not None and signal_meta[key].get("status") != "verified":
            signal_meta[key]["status"] = "stale"

    prior_triggers = {item.get("id"): item for item in previous.get("triggers", [])}
    triggers = []
    for trigger_id in TRIGGER_IDS:
        old = prior_triggers.get(trigger_id) or {}
        state = old.get("state")
        if state not in VALID_TRIGGER_STATES[trigger_id]:
            state = "UNKNOWN"
        trigger = {"id": trigger_id, "state": state}
        if old.get("note") and state != "UNKNOWN":
            trigger["note"] = old["note"]
        triggers.append(trigger)

    oat_fired = oat_metric.get("status") == "verified" and oat_value is not None
    weight_rules = [
        {"id": "oat_gt_90", "fired": oat_value > 90 if oat_fired else None},
        {"id": "oat_gt_130", "fired": oat_value > 130 if oat_fired else None},
        {"id": "gold_dxy_together", "fired": gold_dxy if gold_dxy_meta.get("status") == "verified" else None},
        {"id": "g7_auction_fail", "fired": signals["g7_auction_fail"] if signal_meta["g7_auction_fail"].get("status") == "verified" else None},
        {"id": "dedollar_official", "fired": signals["dedollar_official"] if signal_meta["dedollar_official"].get("status") == "verified" else None},
        {"id": "recap_policy_advance", "fired": signals["recap_policy_advance"] if signal_meta["recap_policy_advance"].get("status") == "verified" else None},
    ]

    refreshed_at = utc_now().isoformat().replace("+00:00", "Z")
    ordered_metrics = [metrics[item["k"]] for item in BASELINES]
    sources = sorted({item["source_url"] for item in ordered_metrics if item.get("source_url")})
    if signal_meta["gold_dxy_together"].get("source_url"):
        sources.append(signal_meta["gold_dxy_together"]["source_url"])
    sources.extend(signal_meta["gold_dxy_together"].get("source_urls", []))
    sources = sorted(set(sources))
    snapshot = {
        "as_of": local_date.isoformat(),
        "refreshed_at": refreshed_at,
        "metrics": ordered_metrics,
        "signals": signals,
        "signal_meta": signal_meta,
        "triggers": triggers,
        "weight_rules": weight_rules,
        "scenario_weights": previous.get("scenario_weights"),
        "weight_status": "not_calculated_missing_registered_shift_map",
        "weight_note": "No starting weights or registered shift magnitudes were present in the supplied code excerpt; no shifts are applied.",
        "events": previous.get("events") or [],
        "events_as_of": previous.get("events_as_of"),
        "sources": sources,
        "source_errors": errors,
    }
    return snapshot


def main() -> None:
    snapshot = refresh()
    atomic_json(LATEST_PATH, snapshot)
    history_path = DATA_DIR / "readings" / (snapshot["as_of"] + ".json")
    atomic_json(history_path, snapshot)
    verified = sum(1 for item in snapshot["metrics"] if item.get("status") == "verified")
    print("Macro feed refreshed for " + snapshot["as_of"] + ": " + str(verified) + "/9 metrics verified.")
    for issue in snapshot.get("source_errors", []):
        print("Source unavailable: " + issue["k"] + " (" + issue["error"] + ").")
    print("Latest feed: data/scoreboard.json")
    print("Daily reading: " + str(history_path.relative_to(ROOT)))


if __name__ == "__main__":
    main()
