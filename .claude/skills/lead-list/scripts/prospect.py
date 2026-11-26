"""Prospect finder for Son and Truong: US F&B businesses with WhatsApp and no real website.

Stage 1 (find):  OpenStreetMap Overpass -> independent restaurants, cafes, bakeries in one city.
Stage 2 (check): Scrapling visits every listed website / link-in-bio page:
                 dead, parked, social-only and ordering-only links count as "no site";
                 wa.me / WhatsApp links, emails, Instagram and Facebook get pulled out.
Output: prospects/<city>-<state>-<date>.xlsx (+ .csv), ranked, with tabs.

Usage (from the repo root):
  .claude/skills/lead-list/.venv/Scripts/python -I .claude/skills/lead-list/scripts/prospect.py "Dallas" "Texas"
  options: --cuisine brazilian,latin  --limit 80  --stealth
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

OVERPASS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
UA = "aios-prospect-finder/1.0 (small business research)"

# Links that are NOT a real website. A business whose only link is one of these counts as "no site".
SOCIAL = ("instagram.com", "facebook.com", "fb.com", "fb.me", "tiktok.com", "twitter.com", "x.com",
          "linktr.ee", "linktree", "beacons.ai", "taplink", "bio.link", "lnk.bio", "campsite.bio",
          "wa.me", "whatsapp.com", "youtube.com", "snapchat.com", "yelp.com", "google.com", "goo.gl",
          "g.page", "maps.app.goo.gl", "linkin.bio", "solo.to", "msha.ke", "carrd.co")
ORDER_ONLY = ("doordash.com", "ubereats.com", "grubhub.com", "postmates.com", "seamless.com",
              "toasttab.com", "order.online", "chownow.com", "slicelife.com", "menufy.com",
              "clover.com/online-ordering", "beyondmenu.com", "menupages.com", "allmenus.com",
              "foodbooking.com", "hungerrush", "order.spoton.com", "squareup.com/store")
LINK_IN_BIO = ("linktr.ee", "beacons.ai", "taplink", "bio.link", "lnk.bio", "campsite.bio",
               "linkin.bio", "solo.to", "msha.ke", "carrd.co")
PARKED = ("domain is for sale", "buy this domain", "this domain may be for sale", "parked free",
          "godaddy", "sedoparking", "hugedomains", "dan.com", "afternic", "domain has expired",
          "this site can't be reached", "account suspended", "website coming soon", "under construction")
WA_RE = re.compile(r"(?:wa\.me/|api\.whatsapp\.com/send\?phone=|whatsapp\.com/send\?phone=|wa\.link/)(\+?[0-9A-Za-z]+)", re.I)
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
YEAR_RE = re.compile(r"(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d\d)", re.I)


# ---------------------------------------------------------------- stage 1: OpenStreetMap
def overpass(city: str, state: str) -> list[dict]:
    q = f"""[out:json][timeout:180];
area["name"="{state}"]["admin_level"="4"]["boundary"="administrative"]->.s;
rel(area.s)["name"="{city}"]["boundary"="administrative"]->.r;
.r map_to_area->.c;
(
  nwr(area.c)["amenity"~"^(restaurant|cafe|fast_food|ice_cream|food_court)$"]["name"];
  nwr(area.c)["shop"~"^(bakery|pastry|confectionery|deli)$"]["name"];
);
out center tags;"""
    data = urllib.parse.urlencode({"data": q}).encode()
    last = None
    for url in OVERPASS:
        try:
            req = urllib.request.Request(url, data=data, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=200) as r:
                return json.load(r)["elements"]
        except Exception as e:  # try the mirror
            last = e
    raise SystemExit(f"Overpass failed: {last}")


def to_candidates(elements: list[dict], cuisines: list[str]) -> tuple[list[dict], int]:
    names = Counter(e["tags"].get("name", "").strip().lower() for e in elements)
    out, chains = [], 0
    for e in elements:
        t = e["tags"]
        name = t.get("name", "").strip()
        if t.get("brand") or t.get("brand:wikidata") or names[name.lower()] >= 3:
            chains += 1
            continue
        cuisine = t.get("cuisine", "")
        if cuisines and not any(c in cuisine.lower() or c in name.lower() for c in cuisines):
            continue
        if t.get("disused:amenity") or t.get("opening_hours") == "closed":
            continue
        site = t.get("website") or t.get("contact:website") or t.get("url") or ""
        addr = " ".join(x for x in (t.get("addr:housenumber"), t.get("addr:street"), t.get("addr:city")) if x)
        out.append({
            "name": name,
            "type": t.get("amenity") or t.get("shop"),
            "cuisine": cuisine,
            "address": addr,
            "phone": t.get("phone") or t.get("contact:phone") or "",
            "osm_whatsapp": t.get("contact:whatsapp") or t.get("whatsapp") or "",
            "listed_site": site,
            "instagram": t.get("contact:instagram") or "",
            "facebook": t.get("contact:facebook") or "",
            "email": t.get("email") or t.get("contact:email") or "",
            "hours": t.get("opening_hours", ""),
            "osm": f"https://www.openstreetmap.org/{e['type']}/{e['id']}",
        })
    return out, chains


# ---------------------------------------------------------------- stage 2: Scrapling checks
def host(url: str) -> str:
    try:
        return urllib.parse.urlparse(url if "://" in url else "http://" + url).netloc.lower()
    except Exception:
        return ""


def classify_link(url: str) -> str:
    u = url.lower()
    if not u:
        return "none"
    if any(s in u for s in ORDER_ONLY):
        return "order_page_only"
    if any(s in u for s in SOCIAL):
        return "social_only"
    return "domain"


class Web:
    """Scrapling wrapper: fast HTTP with a real-browser fingerprint, stealth browser fallback."""

    def __init__(self, stealth: bool):
        from scrapling.fetchers import Fetcher
        self.Fetcher = Fetcher
        self.stealth = stealth

    def get(self, url: str):
        if "://" not in url:
            url = "https://" + url
        page, err = None, ""
        try:
            page = self.Fetcher.get(url, impersonate="chrome", stealthy_headers=True, timeout=20,
                                    follow_redirects=True)
        except Exception as e:
            err = type(e).__name__
            if url.startswith("https://"):
                try:
                    page = self.Fetcher.get("http://" + url[8:], impersonate="chrome", stealthy_headers=True,
                                            timeout=20, follow_redirects=True)
                    err = ""
                except Exception as e2:
                    err = type(e2).__name__
        blocked = page is not None and page.status in (403, 429, 503)
        if self.stealth and (blocked or page is None):
            try:  # bot wall (Cloudflare etc.): the installed Chrome, visible, solves the challenge.
                # Headless Chrome gets stuck on "Just a moment..."; Playwright's bundled Chromium
                # doesn't start on this Windows build (side-by-side error), so use real_chrome.
                from scrapling.fetchers import StealthyFetcher
                page = StealthyFetcher.fetch(url, headless=False, real_chrome=True, solve_cloudflare=True,
                                             timeout=60000)
                err = ""
            except Exception as e:
                err = type(e).__name__
        return page, err


def text_of(page) -> str:
    try:
        return str(page.html_content)
    except Exception:
        try:
            return page.body.decode("utf-8", "ignore")
        except Exception:
            return ""


def links_of(page) -> list[str]:
    try:
        return [h for h in page.css("a::attr(href)").getall() if h]
    except Exception:
        return []


def harvest(html: str, links: list[str]) -> dict:
    blob = html + " " + " ".join(links)
    wa = sorted({m.group(0) for m in WA_RE.finditer(blob)})
    emails = sorted({e for e in EMAIL_RE.findall(html)
                     if not e.lower().endswith((".png", ".jpg", ".webp", ".gif", ".svg"))
                     and "sentry" not in e and "example" not in e and "wixpress" not in e})
    ig = sorted({l.split("?")[0] for l in links if "instagram.com/" in l and "/p/" not in l})
    fb = sorted({l.split("?")[0] for l in links if "facebook.com/" in l and "sharer" not in l})
    return {"wa": wa, "emails": emails[:3], "ig": ig[:2], "fb": fb[:2]}


def site_signals(page, html: str, url: str) -> list[str]:
    s = []
    low = html.lower()
    if not url.lower().startswith("https") and not str(getattr(page, "url", "")).startswith("https"):
        s.append("no https")
    if 'name="viewport"' not in low and "name='viewport'" not in low:
        s.append("not mobile-friendly")
    years = [int(y) for y in YEAR_RE.findall(html)]
    if years and max(years) <= dt.date.today().year - 3:
        s.append(f"copyright {max(years)}")
    if re.search(r"menu[^\"']*\.pdf", low):
        s.append("menu is a PDF")
    for b, n in (("wix.com", "Wix"), ("squarespace", "Squarespace"), ("godaddysites", "GoDaddy builder"),
                 ("weebly", "Weebly"), ("wordpress", "WordPress")):
        if b in low:
            s.append(n)
            break
    return s


def check(c: dict, web: Web) -> dict:
    c = dict(c)
    url = c["listed_site"]
    kind = classify_link(url)
    c.update(site_status="", whatsapp="", whatsapp_source="", signals="", notes="")
    wa_found: list[str] = []
    if c["osm_whatsapp"]:
        wa_found.append(c["osm_whatsapp"])
        c["whatsapp_source"] = "OpenStreetMap tag"
    if kind == "none":
        c["site_status"] = "no site listed"
    elif kind in ("social_only", "order_page_only"):
        c["site_status"] = "social link only" if kind == "social_only" else "ordering page only"
        if "wa.me" in url or "whatsapp" in url:
            wa_found.append(url)
            c["whatsapp_source"] = c["whatsapp_source"] or "listed link is WhatsApp"
        if any(b in url.lower() for b in LINK_IN_BIO):  # link-in-bio pages often carry wa.me
            page, err = web.get(url)
            if page is not None and page.status < 400:
                h = harvest(text_of(page), links_of(page))
                if h["wa"]:
                    wa_found += h["wa"]
                    c["whatsapp_source"] = c["whatsapp_source"] or f"link-in-bio page {host(url)}"
                c["instagram"] = c["instagram"] or ", ".join(h["ig"])
        if "instagram.com" in url.lower():
            c["instagram"] = c["instagram"] or url
        if "facebook.com" in url.lower():
            c["facebook"] = c["facebook"] or url
    else:
        page, err = web.get(url)
        if page is None:
            c["site_status"] = f"dead ({err or 'no response'})"
        elif page.status >= 400:
            if page.status in (403, 429, 503):
                c["site_status"] = "bot wall, site exists" + ("" if web.stealth else " (try --stealth)")
            else:
                c["site_status"] = f"error {page.status}"
        else:
            html = text_of(page)
            final = str(getattr(page, "url", url))
            if classify_link(final) != "domain":
                c["site_status"] = f"redirects to {host(final)}"
            elif any(p in html.lower() for p in PARKED) and len(html) < 60000:
                c["site_status"] = "parked / expired"
            else:
                c["site_status"] = "real site"
                c["signals"] = ", ".join(site_signals(page, html, final))
            h = harvest(html, links_of(page))
            if h["wa"]:
                wa_found += h["wa"]
                c["whatsapp_source"] = c["whatsapp_source"] or f"their site {host(final)}"
            c["email"] = c["email"] or ", ".join(h["emails"])
            c["instagram"] = c["instagram"] or ", ".join(h["ig"])
            c["facebook"] = c["facebook"] or ", ".join(h["fb"])
    c["whatsapp"] = ", ".join(dict.fromkeys(wa_found))
    return c


# ---------------------------------------------------------------- ranking and output
NO_SITE = ("no site listed", "social link only", "ordering page only", "dead", "parked", "redirects to",
           "error 404", "error 410")  # a bot wall (403/503) means a site exists, so it is not here


def no_site(c: dict) -> bool:
    return c["site_status"].startswith(NO_SITE)


def tier(c: dict) -> str:
    if no_site(c) and c["whatsapp"]:
        return "A: WhatsApp + no site"
    if no_site(c) and (c["instagram"] or c["facebook"]):
        return "B: no site, check socials for WhatsApp"
    if no_site(c):
        return "C: no site, little info"
    if c["whatsapp"]:
        return "D: has site + WhatsApp (weak site?)"
    return "E: has site"


COLS = ["tier", "name", "type", "cuisine", "address", "phone", "whatsapp", "whatsapp_source", "site_status",
        "listed_site", "signals", "instagram", "facebook", "email", "hours", "osm", "notes"]


def write(rows: list[dict], path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path.with_suffix(".csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLS, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font
    except ImportError:
        return
    wb = Workbook()
    tabs = {"Leads (A)": [r for r in rows if r["tier"].startswith("A")],
            "Check socials (B)": [r for r in rows if r["tier"].startswith("B")],
            "All": rows}
    first = True
    for title, rs in tabs.items():
        ws = wb.active if first else wb.create_sheet()
        first = False
        ws.title = title
        ws.append(COLS)
        for c in ws[1]:
            c.font = Font(bold=True)
        for r in rs:
            ws.append([r.get(k, "") for k in COLS])
        ws.freeze_panes = "A2"
        for col, width in zip("ABCDEFGHIJKLMNOPQ", (26, 30, 12, 16, 30, 16, 26, 24, 26, 30, 30, 30, 30, 26, 20, 40, 24)):
            ws.column_dimensions[col].width = width
    wb.save(path.with_suffix(".xlsx"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("city")
    ap.add_argument("state", help="full state name, e.g. Texas")
    ap.add_argument("--cuisine", default="", help="comma list matched against cuisine tag and name, e.g. brazilian,latin")
    ap.add_argument("--limit", type=int, default=0, help="max candidates to check (0 = all)")
    ap.add_argument("--stealth", action="store_true", help="retry bot-walled sites in Scrapling's stealth browser")
    ap.add_argument("--out", default="prospects")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    t0 = time.time()
    els = overpass(a.city, a.state)
    cands, chains = to_candidates(els, [c.strip().lower() for c in a.cuisine.split(",") if c.strip()])
    print(f"OSM: {len(els)} places, {chains} chains skipped, {len(cands)} independents kept")
    # check places with any link first: they are where Scrapling finds WhatsApp and dead sites
    cands.sort(key=lambda c: (not c["listed_site"], not c["osm_whatsapp"]))
    if a.limit:
        cands = cands[: a.limit]

    web = Web(a.stealth)
    rows = []
    for i, c in enumerate(cands, 1):
        r = check(c, web)
        rows.append(r)
        if r["listed_site"]:
            print(f"  [{i}/{len(cands)}] {r['name'][:32]:32} {r['site_status'][:40]:40} {r['whatsapp'][:30]}")
    for r in rows:
        r["tier"] = tier(r)
    rows.sort(key=lambda r: (r["tier"], r["name"]))

    path = Path(a.out) / f"{a.city.lower().replace(' ', '-')}-{a.state.lower().replace(' ', '-')}-{dt.date.today()}"
    write(rows, path)
    cnt = Counter(r["tier"][0] for r in rows)
    print(f"\nDone in {time.time() - t0:.0f}s. Tiers: " + ", ".join(f"{k}={v}" for k, v in sorted(cnt.items())))
    print(f"Saved {path}.xlsx and .csv")
    for r in [r for r in rows if r["tier"].startswith("A")][:15]:
        print(f"  A  {r['name']} | {r['whatsapp']} ({r['whatsapp_source']}) | {r['site_status']}")


if __name__ == "__main__":
    main()
