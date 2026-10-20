"""Download all posted comments on an FDA docket from the Regulations.gov API.

Usage:  REGULATIONS_GOV_API_KEY=... python pipeline/pull.py
Writes pipeline/raw/comments.json (comment text, metadata, attachment links).
Attachments are not downloaded here; downloads.regulations.gov blocks many
cloud IPs, so they are read separately (see README).
"""
import json, os, sys, time, urllib.parse, urllib.request

DOCKET = "FDA-2026-N-7874"
BASE = "https://api.regulations.gov/v4"
KEY = os.environ.get("REGULATIONS_GOV_API_KEY") or sys.exit("Set REGULATIONS_GOV_API_KEY (free at api.data.gov/signup)")
OUT = os.path.join(os.path.dirname(__file__), "raw")
os.makedirs(OUT, exist_ok=True)

def get(url):
    for attempt in range(5):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.loads(r.read())
        except Exception as e:
            print("retry", e, file=sys.stderr)
            time.sleep(3 * (attempt + 1))
    sys.exit("failed: " + url.split("api_key")[0])

ids, page = [], 1
while True:
    q = urllib.parse.urlencode({"filter[docketId]": DOCKET, "page[size]": 250, "page[number]": page, "api_key": KEY})
    d = get(f"{BASE}/comments?{q}")
    ids += [x["id"] for x in d["data"]]
    if not d["meta"]["hasNextPage"]:
        break
    page += 1

rows = []
for cid in ids:
    d = get(f"{BASE}/comments/{cid}?include=attachments&api_key={KEY}")
    a = d["data"]["attributes"]
    files = [{"url": f["fileUrl"], "format": f.get("format"), "size": f.get("size")}
             for inc in d.get("included", []) for f in (inc["attributes"].get("fileFormats") or [])]
    rows.append({"id": cid, "title": a.get("title"), "category": a.get("category"),
                 "posted": a.get("postedDate"), "received": a.get("receiveDate"),
                 "comment": a.get("comment"), "files": files})
json.dump(rows, open(os.path.join(OUT, "comments.json"), "w"), indent=1)
print(f"{len(rows)} comments, {sum(len(r['files']) for r in rows)} attachments")
