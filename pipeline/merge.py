"""Merge raw comments with coded results and write the site's data files.

Usage: python pipeline/merge.py
Reads pipeline/raw/comments.json and pipeline/codes/*.json; writes data/comments.json and data/meta.json.
"""
import datetime, glob, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# Emergent topic tags (free text from coding) grouped into display topics. First match wins.
TOPICS = [
    ("Reliance, sycophancy, and affective harms", r"sycophan|distress|persuasion|persistent memory|patient trust|dependence|relian|relational"),
    ("Hallucination and output reliability", r"hallucinat|nondetermin|fabricat|abstention|instruction adherence|degradation|reproducib|null input|protocol fidelity|confidence calibration|output bounding"),
    ("Runtime controls and kill switches", r"kill switch|stop control|fail-closed|deterministic|runtime|execution authority|architectural safety|layered safety|verification gate|scope control|authorization control|agent identity|human authorization|instruction-layer|graduated autonomy|staged deployment|configuration registration|execution-time|hard-gate|competency floors|override|design controls|architectural safeguards|autonomous function|prompt change control"),
    ("Audit trails, provenance, and records", r"audit|trace|provenance|record|log\b|logs|reconstruct|hash commit|dataset documentation|soup|registries|failure logging|incident response|sbom|identity|validation as code|monitoring records|competency profile"),
    ("Cybersecurity", r"cyber|security|adversarial|prompt injection|input integrity|data integrity"),
    ("Privacy and consent", r"privacy|consent|minimization|hipaa|biometric|surveillance|cross-border"),
    ("Liability and accountability", r"liabil|accountab|insurab|licensure|practice of medicine|legal authority|enforcement|suspension|personhood|conflicts of interest"),
    ("Equity, access, and disability", r"equity|rural|underserved|access|neurodiverg|assistive|disab|pediatric|bias(?!.*automation)|algorithmic|demographic|latent clinical need|non-english|veteran"),
    ("Human oversight and automation bias", r"automation bias|human factors|oversight|deskill|workload|in-the-loop|competency gating|clinical judgment|workflow|inter-rater|clinician accountability|caregiver|meaningful human review|literacy|clinician feedback"),
    ("Small developer burden", r"small|burden"),
    ("Coverage and reimbursement", r"insurance|payer|reimburse|coverage|utilization"),
    ("Deployment settings and infrastructure", r"deployer|institutional|operational resilience|interoperab|on-device|offline|serviceab|obsolescence|multi-version|multi-site|common-mode|case-mix|drift|retrain|physical output|point-of-care|manufactur|local site|home and community|health workers|staffing|compression|fine-tuning|connectivity|local validation|execution locality|discontinuation|research settings|wearables|workforce"),
    ("Transparency and public participation", r"transparen|disclosure|disclaimer|promotion|public|stakeholder|human rights|labeling|patient autonomy|informed|patient engagement"),
    ("Regulatory process and harmonization", r"harmoni|\beu\b|iso|international|interagency|pathway|510\(k\)|terminology|qms|mdr|cross-center|combination|laboratory|multiple function|modular|pccp|clearance|state ai|deregulation|boundary|scope definition|regulatory|guidelines|clinical association|evidence|endpoint|surrogate|validity|measurement|temporal fidelity|out-of-domain|psychometric|system-level|criticality|gene therapy|retrieval|causal|simulation|technology-neutral|decision support|clinical-adjacent|counterfactual|specialist|exposure therapy|self-detection|therapy regulation|consensus definitions|fda-cms|general wellness|substantial equivalence|synthetic benchmarks|foreseeable|ethics review"),
    ("Opposition to AI use", r"opposition"),
]
NONTOPIC = r"off-topic|no original content"

def topic_for(tag):
    if re.search(NONTOPIC, tag, re.I):
        return None
    for name, pat in TOPICS:
        if re.search(pat, tag, re.I):
            return name
    return "Other"

SECTIONS = [
    ("IV", "Assessment of risk", range(1, 7)),
    ("V", "Competency-based premarket evaluation", range(7, 18)),
    ("VI", "Postmarket monitoring", range(18, 25)),
    ("VII", "Other topics", range(25, 27)),
]
QUESTIONS = {}
for line in open(os.path.join(HERE, "codebook.md")):
    m = re.match(r"Q(\d+) (.+)", line.strip())
    if m:
        QUESTIONS[int(m.group(1))] = m.group(2)

raw = {r["id"]: r for r in json.load(open(os.path.join(HERE, "raw", "comments.json")))}
codes = {r["id"]: r for f in sorted(glob.glob(os.path.join(HERE, "codes", "*.json"))) for r in json.load(open(f))}
aria = json.load(open(os.path.join(HERE, "aria.json")))

out, unmapped = [], set()
for cid, r in sorted(raw.items()):
    c = codes.get(cid)
    if not c:
        print("not yet coded:", cid)
        continue
    tags = c.get("emergent_topics") or []
    topics = sorted({t for t in map(topic_for, tags) if t})
    unmapped |= {t for t in tags if topic_for(t) == "Other"}
    out.append({
        "id": cid, "title": r["title"], "category_raw": r["category"],
        "commenter_type": c["commenter_type"], "type_inferred": bool(c.get("type_inferred")),
        "org": c.get("org") or "", "domain": c.get("domain"),
        "q_cited": sorted(set(c.get("questions_cited") or [])), "q_addr": sorted(set(c.get("questions_addressed") or [])),
        "topics": topics, "tags": tags, "summary": c.get("summary") or "",
        "words": c.get("words"), "pages": c.get("pages") or None,
        "posted": r["posted"], "received": r["received"], "unreadable": bool(c.get("unreadable")),
    })

aria["topics"] = sorted({t for t in map(topic_for, aria.get("tags", [])) if t})
used = {t for row in out for t in row["topics"]} | set(aria["topics"])
meta = {
    "updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "questions": [{"n": n, "section": s, "label": QUESTIONS[n]} for s, _, rng in SECTIONS for n in rng],
    "sections": [{"key": s, "label": label} for s, label, _ in SECTIONS],
    "topics": [{"key": name} for name, _ in TOPICS if name in used] + ([{"key": "Other"}] if "Other" in used else []),
    "aria": aria,
    "method": f"{len(out)} posted comments read in full, including attachments, and coded against the codebook. "
              "A question counts as addressed when a comment discusses it substantively, cited or not. "
              "Comment types come from Regulations.gov; those with no category were assigned from content and are marked inferred.",
}
os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "data", "comments.json"), "w"), indent=1)
json.dump(meta, open(os.path.join(ROOT, "data", "meta.json"), "w"), indent=1)
print(f"wrote {len(out)} comments; tags mapped to Other: {sorted(unmapped)}")
