"""Compare the docket's posted comments against the ones already in the site.

Used by .github/workflows/check-new-comments.yml. Known comments are stored as
SHA-256 hashes of their IDs in pipeline/known_comments.txt, so the repo does not
list every comment ID in plain text. Prints new comment IDs, one per line.
Run with --update to record the current docket as known.
"""
import hashlib, json, os, sys, time, urllib.parse, urllib.request

DOCKET = "FDA-2026-N-7874"
KEY = os.environ.get("REGULATIONS_GOV_API_KEY") or sys.exit("Set REGULATIONS_GOV_API_KEY")
KNOWN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "known_comments.txt")
h = lambda s: hashlib.sha256(s.encode()).hexdigest()

def get(url):
    for attempt in range(5):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.loads(r.read())
        except Exception as e:
            print("retry:", e, file=sys.stderr); time.sleep(5 * (attempt + 1))
    sys.exit("Regulations.gov API did not respond")

ids, page = [], 1
while True:
    q = urllib.parse.urlencode({"filter[docketId]": DOCKET, "page[size]": 250, "page[number]": page, "api_key": KEY})
    d = get(f"https://api.regulations.gov/v4/comments?{q}")
    ids += [x["id"] for x in d["data"]]
    if not d["meta"]["hasNextPage"]:
        break
    page += 1

if "--update" in sys.argv:
    open(KNOWN, "w").write("\n".join(sorted(h(i) for i in ids)) + "\n")
    print(f"Recorded {len(ids)} comments as known", file=sys.stderr)
    sys.exit(0)

known = set(open(KNOWN).read().split()) if os.path.exists(KNOWN) else set()
new = sorted(i for i in ids if h(i) not in known)
print(f"{len(ids)} posted, {len(new)} new", file=sys.stderr)
print("\n".join(new))
