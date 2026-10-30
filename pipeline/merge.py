"""Merge raw comments with coded results and write the site's data files.

Usage: python pipeline/merge.py
Reads pipeline/raw/comments.json and pipeline/codes/*.json; writes data/comments.json and data/meta.json.
"""
import datetime, glob, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# Emergent topic tags (free text from coding) grouped into display topics. First match wins.
TOPICS = [
    ("Reliance, sycophancy, and affective harms", r"delusion|sycophan|distress|persuasion|persistent memory|patient trust|dependence|relian|relational"),
    ("Hallucination and output reliability", r"omission errors|scribe accuracy|documentation errors|incomplete ai summaries|extraction errors|hallucinat|nondetermin|fabricat|abstention|instruction adherence|degradation|reproducib|null input|protocol fidelity|confidence calibration|output bounding"),
    ("Runtime controls and kill switches", r"agent containment|boundedness|idempotent|recursive self-improvement|kill switch|stop control|fail-closed|deterministic|runtime|execution authority|architectural safety|layered safety|verification gate|scope control|authorization control|agent identity|human authorization|instruction-layer|graduated autonomy|staged deployment|configuration registration|execution-time|hard-gate|competency floors|override|design controls|architectural safeguards|autonomous function|prompt change control"),
    ("Audit trails, provenance, and records", r"cryptographic|bill of materials|lineage|attestation|attribution|adverse event|incident|reporting infrastructure|audit|trace|provenance|record|log\b|logs|reconstruct|hash commit|dataset documentation|soup|registries|failure logging|incident response|sbom|identity|validation as code|monitoring records|competency profile"),
    ("Cybersecurity", r"cyber|security|adversarial|prompt injection|input integrity|data integrity"),
    ("Privacy and consent", r"privacy|consent|minimization|hipaa|biometric|surveillance|cross-border"),
    ("Liability and accountability", r"liabil|accountab|insurab|licensure|practice of medicine|legal authority|enforcement|suspension|personhood|conflicts of interest"),
    ("Equity, access, and disability", r"sex differences|patient lived experience|population-level|missing population|equity|rural|underserved|access|neurodiverg|assistive|disab|pediatric|bias(?!.*automation)|algorithmic|demographic|latent clinical need|non-english|veteran"),
    ("Human oversight and automation bias", r"\btraining|education|alert fatigue|caseload|work redistribution|clinician trust|automation bias|human factors|oversight|deskill|workload|in-the-loop|competency gating|clinical judgment|workflow|inter-rater|clinician accountability|caregiver|meaningful human review|literacy|clinician feedback"),
    ("Small developer burden", r"small|burden"),
    ("Coverage and reimbursement", r"cost effectiveness|insurance|payer|reimburse|coverage|utilization"),
    ("Deployment settings and infrastructure", r"deployer|institutional|operational resilience|interoperab|on-device|offline|serviceab|obsolescence|multi-version|multi-site|common-mode|case-mix|drift|retrain|physical output|point-of-care|manufactur|local site|home and community|health workers|staffing|compression|fine-tuning|connectivity|local validation|execution locality|discontinuation|research settings|wearables|workforce"),
    ("Transparency and public participation", r"transparen|disclosure|disclaimer|promotion|public|stakeholder|human rights|labeling|patient autonomy|informed|patient engagement"),
    ("Regulatory process and harmonization", r"state law|scope of regulation|technology-agnostic|risk management|chatbot scope|device scope|classification|time-limited authorization|credentialing|target trial|statistical|generalizab|comparator stability|deferral reporting|harmoni|\beu\b|iso|international|interagency|pathway|510\(k\)|terminology|qms|mdr|cross-center|combination|laboratory|multiple function|modular|pccp|clearance|state ai|deregulation|boundary|scope definition|regulatory|guidelines|clinical association|evidence|endpoint|surrogate|validity|measurement|temporal fidelity|out-of-domain|psychometric|system-level|criticality|gene therapy|retrieval|causal|simulation|technology-neutral|decision support|clinical-adjacent|counterfactual|specialist|exposure therapy|self-detection|therapy regulation|consensus definitions|fda-cms|general wellness|substantial equivalence|synthetic benchmarks|foreseeable|ethics review"),
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
codes2 = {r["id"]: r for f in sorted(glob.glob(os.path.join(HERE, "codes2", "*.json"))) for r in json.load(open(f))}
recfile = os.path.join(HERE, "recommendations.json")
RECS = json.load(open(recfile)) if os.path.exists(recfile) else {"groups": [], "map": {}}
# Comments whose authors asked not to be used this way: kept in counts, shown with no card or identifying data.
privfile = os.path.join(HERE, "private", "withheld.json")
PRIV = json.load(open(privfile)) if os.path.exists(privfile) else {"codes": [], "codes2": [], "recs_map": {}, "no_card": []}
for row in PRIV["codes"]: codes[row["id"]] = row
for row in PRIV["codes2"]: codes2[row["id"]] = row
RECS["map"].update(PRIV["recs_map"])
NO_CARD = set(PRIV["no_card"])
# The same document filed twice: count it once, under the earlier filing (lower number when filed the same day).
DUPLICATES = {"FDA-2026-N-7874-0117": "FDA-2026-N-7874-0102", "FDA-2026-N-7874-0058": "FDA-2026-N-7874-0057",
              "FDA-2026-N-7874-0013": "FDA-2026-N-7874-0010", "FDA-2026-N-7874-0129": "FDA-2026-N-7874-0128",
              "FDA-2026-N-7874-0041": "FDA-2026-N-7874-0040",
              "FDA-2026-N-7874-0175": "FDA-2026-N-7874-0174"}
PROPOSALS = [  # in docket question order
    ("risk_framework", "Two-axis risk framework", "FDA's framework rating risk by device activity and the consequence of relying on an incorrect output (Q1)"),
    ("directiveness_continuum", "Directiveness as a continuum", "Treating how directive an output is as a matter of degree, with wording and personalization as risk modifiers (Q2)"),
    ("patient_facing_risk", "Higher risk for patient-facing use", "Treating clinical information delivered to patients, rather than clinicians, as potentially higher risk (Q3)"),
    ("trajectory_risk", "Risk across whole conversations", "Assessing multi-turn devices across realistic conversational trajectories (Q5)"),
    ("escalation_errors", "Counting under- and over-escalation", "Evaluating care escalation for both under-escalation and over-escalation (Q6)"),
    ("competency_eval", "Benchmarks with clinical confirmation", "Competency-based premarket evaluation: device benchmarking followed by clinical confirmation (Q7, Q9)"),
    ("confirmation_flex", "Confirmation without a prospective study", "Clinical confirmation that does not always require a prospective clinical study (Q11)"),
    ("synthetic_data", "Synthetic data in evaluation", "Using synthetic data to supplement real-world data (Q12, Q13)"),
    ("median_clinician_comparator", "Typical clinician as comparator", "Accepting a median clinician's performance in practice, not only the standard of care, as the comparator (Q14)"),
    ("no_care_comparator", "Comparing with no or delayed care", "Assessing performance against what would likely happen without the device (Q15)"),
    ("third_party", "Independent third-party evaluation", "Involving independent third parties in benchmarking or clinical confirmation (Q16)"),
    ("postmarket_tradeoff", "Less premarket, more postmarket", "Accepting more premarket uncertainty in exchange for stronger postmarket monitoring (Q18)"),
    ("postmarket_methods", "Re-benchmarking and clinician review after release", "Periodic re-benchmarking, sample-based clinician review, and degradation monitoring (Q19)"),
    ("supervisory_agents", "Agentic monitoring of devices after release", "Machine-based supervisory agents for postmarket monitoring (Q20)"),
    ("flexible_change_control", "Flexible change control", "Adapting PCCPs or other change control for modifications that cannot be fully prespecified (Q22, Q23)"),
    ("voluntary_model_files", "Voluntary foundation model disclosure", "Relying on voluntary Foundation Model Master Files from model developers (Q25)"),
    ("agentic_oversight", "Stricter oversight for agentic devices", "Stricter acceptance criteria and oversight for devices that act autonomously across steps (Q26)"),
]

CONDS = json.load(open(os.path.join(HERE, "conditions.json"))) if os.path.exists(os.path.join(HERE, "conditions.json")) else {"groups": {}, "map": {}, "aria": {}}

DISSENT = json.load(open(os.path.join(HERE, "dissent.json"))) if os.path.exists(os.path.join(HERE, "dissent.json")) else {}

out, unmapped = [], set()
for cid, r in sorted(raw.items()):
    c = codes.get(cid)
    if not c:
        print("not yet coded:", cid)
        continue
    tags = c.get("emergent_topics") or []
    topics = sorted({t for t in map(topic_for, tags) if t})
    unmapped |= {t for t in tags if topic_for(t) == "Other"}
    if cid in DUPLICATES:
        continue
    if cid in NO_CARD:
        out.append({"id": f"withheld-{len([o for o in out if o.get('hidden')]) + 1}", "hidden": True,
                    "commenter_type": c["commenter_type"], "type_inferred": False,
                    "q_addr": sorted(set(c.get("questions_addressed") or [])), "q_cited": [],
                    "topics": sorted({t for t in map(topic_for, c.get("emergent_topics") or []) if t}),
                    "pos": {k: v for k, v in (codes2.get(cid, {}).get("positions") or {}).items() if v},
                    "recs": RECS["map"].get(cid, []), "unreadable": False})
        continue
    out.append({
        "id": cid, "title": r["title"], "category_raw": r["category"],
        "commenter_type": c["commenter_type"], "type_inferred": bool(c.get("type_inferred")),
        "org": c.get("org") or "", "domain": c.get("domain"),
        "q_cited": sorted(set(c.get("questions_cited") or [])), "q_addr": sorted(set(c.get("questions_addressed") or [])),
        "topics": topics, "tags": tags, "summary": c.get("summary") or "",
        "words": c.get("words"), "pages": c.get("pages") or None,
        "posted": r["posted"], "received": r["received"], "unreadable": bool(c.get("unreadable")),
        "pos": {k: v for k, v in (codes2.get(cid, {}).get("positions") or {}).items() if v},
        "recs": RECS["map"].get(cid, []),
        "also_filed": sorted(d for d, k in DUPLICATES.items() if k == cid),
        "conds": CONDS["map"].get(cid, {}),
    })

aria["topics"] = sorted({t for t in map(topic_for, aria.get("tags", [])) if t})
aria["pos"] = {k: v for k, v in (aria.get("positions") or {}).items() if v}
aria["recs"] = RECS["map"].get("ARIA", [])
used = {t for row in out for t in row["topics"]} | set(aria["topics"])
meta = {
    "updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "questions": [{"n": n, "section": s, "label": QUESTIONS[n]} for s, _, rng in SECTIONS for n in rng],
    "sections": [{"key": s, "label": label} for s, label, _ in SECTIONS],
    "topics": [{"key": name} for name, _ in TOPICS if name in used] + ([{"key": "Other"}] if "Other" in used else []),
    "aria": {**aria, "conds": CONDS["aria"]},
    "tips": json.load(open(os.path.join(HERE, "tooltips.json"))),
    "proposals": [{"key": k, "label": l, "desc": d} for k, l, d in PROPOSALS],
    "conditions": CONDS["groups"],
    "dissent": DISSENT.get("dissent", {}),
    "nopos": DISSENT.get("nopos", []),
    "open_questions": DISSENT.get("open_questions", []),
    "recs": RECS["groups"],
    # Comments filed but not yet posted on Regulations.gov. Shown in the list and grid, not counted in charts.
    # Remove an entry once FDA posts the comment and it is coded from the docket.
    "pending": json.load(open(os.path.join(HERE, "pending.json"))) if os.path.exists(os.path.join(HERE, "pending.json")) else [],
    "method": f"{len(out)} posted comments read in full, including attachments, and coded against the codebook. "
              "A question counts as addressed when a comment discusses it substantively, cited or not. "
              "Comment types come from Regulations.gov; those with no category were assigned from content and are marked inferred.",
}
os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "data", "comments.json"), "w"), indent=1)
json.dump(meta, open(os.path.join(ROOT, "data", "meta.json"), "w"), indent=1)
print(f"wrote {len(out)} comments; tags mapped to Other: {sorted(unmapped)}")
