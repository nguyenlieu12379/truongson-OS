"""Find independent restaurants and coffee shops we can build a site for, for free.

Source: OpenStreetMap via the public Overpass API (free, no key).
For each place it checks which website inputs are already public
(name, address, phone, hours, cuisine, menu, socials, photo) and whether
there is an email to send to. It ranks places with no website and the
most inputs first.

Usage:
    python scripts/fnb_finder.py "Boston" "Massachusetts"
    python scripts/fnb_finder.py "Austin" "Texas" --limit 50

Output: prospects/<city>-<state>.csv (gitignored: real business data).
"""
import argparse
import csv
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

OVERPASS = "https://overpass-api.de/api/interpreter"
UA = "fnb-finder/0.1 (small-business website prospecting)"

# Big chains: not independent, skip them.
CHAINS = {
    "starbucks", "dunkin", "dunkin'", "dunkin donuts", "mcdonald's", "subway",
    "burger king", "wendy's", "taco bell", "chipotle", "panera bread",
    "domino's", "pizza hut", "papa john's", "kfc", "chick-fil-a", "popeyes",
    "tim hortons", "panda express", "five guys", "jimmy john's", "arby's",
    "sonic", "dairy queen", "little caesars", "jersey mike's", "wingstop",
    "shake shack", "sweetgreen", "qdoba", "potbelly", "au bon pain",
    "peet's coffee", "caribou coffee", "dutch bros", "ihop", "denny's",
    "applebee's", "olive garden", "chili's", "texas roadhouse", "cava",
    "blaze pizza", "noodles & company", "firehouse subs", "jamba",
    "smoothie king", "krispy kreme", "white castle", "carl's jr.", "hardee's",
    "jack in the box", "culver's", "whataburger", "in-n-out burger",
    "el pollo loco", "bojangles", "zaxby's", "raising cane's", "costa coffee",
}

# Inputs a site needs, and their weight in the "buildable" score.
INPUTS = {
    "name": 1, "address": 2, "phone": 2, "hours": 2, "cuisine": 1,
    "menu": 2, "instagram": 1, "facebook": 1, "photo": 1,
}


def overpass_query(city: str, state: str) -> str:
    return f"""
[out:json][timeout:120];
area["name"="{state}"]["admin_level"="4"]->.s;
area["name"="{city}"]["boundary"="administrative"](area.s)->.c;
(
  nwr["amenity"~"^(restaurant|cafe|fast_food|ice_cream)$"]["name"](area.c);
  nwr["shop"~"^(bakery|coffee|deli|pastry)$"]["name"](area.c);
);
out center tags;
"""


def fetch(query: str) -> list[dict]:
    data = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request(OVERPASS, data=data, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.load(r).get("elements", [])
        except Exception as e:  # rate limit or timeout: back off and retry
            if attempt == 3:
                raise
            wait = 10 * (attempt + 1)
            print(f"  Overpass busy ({e}); retrying in {wait}s", file=sys.stderr)
            time.sleep(wait)
    return []


def first(tags: dict, *keys: str) -> str:
    for k in keys:
        if tags.get(k):
            return tags[k].strip()
    return ""


def is_chain(tags: dict) -> bool:
    if tags.get("brand") or tags.get("brand:wikidata"):
        return True
    return tags.get("name", "").strip().lower() in CHAINS


def row_for(el: dict) -> dict:
    t = el.get("tags", {})
    address = " ".join(x for x in (t.get("addr:housenumber"), t.get("addr:street")) if x)
    town = ", ".join(x for x in (t.get("addr:city"), t.get("addr:state")) if x)
    instagram = first(t, "contact:instagram", "instagram")
    facebook = first(t, "contact:facebook", "facebook")
    row = {
        "name": t.get("name", ""),
        "type": first(t, "amenity", "shop"),
        "cuisine": t.get("cuisine", "").replace(";", ", "),
        "address": address,
        "town": town,
        "zip": t.get("addr:postcode", ""),
        "phone": first(t, "phone", "contact:phone"),
        "email": first(t, "email", "contact:email"),
        "website": first(t, "website", "contact:website", "url"),
        "hours": t.get("opening_hours", ""),
        "menu": first(t, "website:menu", "menu:url", "contact:menu"),
        "instagram": instagram,
        "facebook": facebook,
        "photo": first(t, "image", "wikimedia_commons"),
        "osm": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
    }
    have = [k for k in INPUTS if row.get(k)]
    row["inputs_found"] = ", ".join(have)
    row["inputs_missing"] = ", ".join(k for k in INPUTS if k not in have)
    row["build_score"] = sum(INPUTS[k] for k in have)
    row["no_website"] = "yes" if not row["website"] else ""
    row["can_email"] = "yes" if row["email"] else ""
    # Priority: no website first, then reachable by email, then most inputs.
    row["priority"] = (
        (100 if row["no_website"] else 0)
        + (50 if row["can_email"] else 0)
        + row["build_score"]
    )
    return row


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("city")
    ap.add_argument("state", help='Full state name, e.g. "Massachusetts"')
    ap.add_argument("--limit", type=int, default=0, help="Keep only the top N")
    ap.add_argument("--out", default="prospects")
    args = ap.parse_args()

    print(f"Searching OpenStreetMap: {args.city}, {args.state} ...")
    elements = fetch(overpass_query(args.city, args.state))
    rows, chains, seen = [], 0, set()
    for el in elements:
        t = el.get("tags", {})
        if is_chain(t):
            chains += 1
            continue
        key = (t.get("name", "").lower(), t.get("addr:street", "").lower())
        if key in seen:
            continue
        seen.add(key)
        rows.append(row_for(el))

    rows.sort(key=lambda r: r["priority"], reverse=True)
    if args.limit:
        rows = rows[: args.limit]

    out_dir = Path(args.out)
    out_dir.mkdir(exist_ok=True)
    slug = re.sub(r"[^a-z0-9]+", "-", f"{args.city}-{args.state}".lower()).strip("-")
    path = out_dir / f"{slug}.csv"
    if rows:
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)

    total = len(rows)
    no_site = sum(1 for r in rows if r["no_website"])
    emailable = sum(1 for r in rows if r["can_email"])
    both = sum(1 for r in rows if r["no_website"] and r["can_email"])
    print(f"  {len(elements)} places found, {chains} chains skipped, {total} independents kept")
    print(f"  {no_site} have no website, {emailable} list an email, {both} have both")
    print(f"  Saved: {path}")


if __name__ == "__main__":
    main()
