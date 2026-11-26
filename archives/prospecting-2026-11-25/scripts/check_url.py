"""Check one link with Scrapling: is it a real website, and does it carry WhatsApp / email / socials?

Usage: .claude/skills/prospecting/.venv/Scripts/python -I .claude/skills/prospecting/scripts/check_url.py URL [--stealth]
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from prospect import Web, check  # noqa: E402

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        raise SystemExit(__doc__)
    r = check({"name": "", "listed_site": args[0], "osm_whatsapp": "", "instagram": "", "facebook": "",
               "email": ""}, Web("--stealth" in sys.argv))
    for k in ("site_status", "signals", "whatsapp", "whatsapp_source", "email", "instagram", "facebook"):
        print(f"{k:16} {r.get(k, '')}")
