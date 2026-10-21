/* Key findings and By proposal views. Everything is computed from the same data the Explore view reads,
   so the numbers stay current as comments are added. Thresholds are stated next to each list. */
(function () {
  const COL = { support: "#00848a", conditional: "#bbbbbb", oppose: "#111111" };
  const GROUPS = [
    ["Industry", ["Device industry", "Private industry (non-device)", "Drug industry", "International industry"]],
    ["Clinicians and health care groups", ["Health professional", "Health care association"]],
    ["Individuals", ["Individual"]],
    ["Academia, government, and other", ["Academia", "Government", "Other"]],
  ];
  const T = {
    endorse: 0.6,   // share supporting without conditions
    cond: 0.8,      // share supporting with conditions
    contest: 0.2,   // share opposing
    minN: 15,       // minimum comments with a position for the consensus and contention lists
  };
  let view = "findings", prop = null, showAria = false;

  const pool = () => readable().filter(c => !c.hidden || true);
  const people = () => readable();
  const counts = (rows, k) => { const n = { support: 0, conditional: 0, oppose: 0 }; rows.forEach(c => { const v = (c.pos || {})[k]; if (v) n[v]++; }); n.total = n.support + n.conditional + n.oppose; return n; };
  const groupOf = c => (GROUPS.find(g => g[1].includes(c.commenter_type)) || GROUPS[3])[0];
  const pc = (a, b) => b ? Math.round(100 * a / b) + "%" : "0%";
  const sbar = n => n.total ? `<div class="sbar" aria-hidden="true">${["support", "conditional", "oppose"].map(s => n[s] ? `<i style="width:${100 * n[s] / n.total}%;background:${COL[s]}"></i>` : "").join("")}</div>` : `<div class="sbar"></div>`;
  const lbar = (v, max) => `<div class="sbar" aria-hidden="true"><i style="width:${max ? 100 * v / max : 0}%;background:${COL.conditional}"></i></div>`;
  const legend = `<div class="legend2"><span><i style="background:${COL.support}"></i>Support</span><span><i style="background:${COL.conditional}"></i>Support with conditions</span><span><i style="background:${COL.oppose}"></i>Oppose</span></div>`;
  const Q = p => { const m = p.desc.match(/\((Q[^)]*)\)\s*$/); return m ? m[1] : ""; };
  const condLabel = (k, g) => (condsOf(k).find(x => x.key === g) || {}).label || g;

  function go(sel, lens) {
    state.sel = sel; state.cat = null; state.types.clear(); state.all = false; state.posView = "all";
    if (lens) state.lens = lens;
    document.querySelectorAll("#posView .pill").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.v === "all")));
    show("explore");
    const target = sel && sel.lens === "pos" ? document.getElementById("posSection") : document.getElementById("covTitle");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const goPos = key => go({ lens: "pos", key });

  /* Key findings */
  function findings() {
    const rows = people(), P = META.proposals.map(p => ({ p, n: counts(rows, p.key) })).filter(x => x.n.total >= T.minN);
    const row = (x, val, key, num) => `<div class="row click" data-go="${esc(key)}" tabindex="0" role="button"><span class="lab">${esc(x.p.label)}</span>${sbar(x.n)}<span class="num">${num}</span></div>`;
    const endorsed = P.filter(x => x.n.support / x.n.total >= T.endorse).sort((a, b) => b.n.support / b.n.total - a.n.support / a.n.total);
    const condd = P.filter(x => x.n.conditional / x.n.total >= T.cond).sort((a, b) => b.n.conditional / b.n.total - a.n.conditional / a.n.total);
    const contested = P.filter(x => x.n.oppose / x.n.total >= T.contest).sort((a, b) => b.n.oppose / b.n.total - a.n.oppose / a.n.total);

    const split = contested.map(x => {
      const lines = GROUPS.map(([g]) => { const n = counts(rows.filter(c => groupOf(c) === g), x.p.key); return n.total ? `<div class="row"><span class="lab">${esc(g)}</span>${sbar(n)}<span class="num">${n.oppose} of ${n.total}</span></div>` : ""; }).join("");
      return `<div class="card"><h3>${esc(x.p.label)}</h3><div class="row"><span class="lab"><b>All commenters</b></span>${sbar(x.n)}<span class="num">${x.n.oppose} of ${x.n.total}</span></div>${lines}<p class="note">Number of comments opposing, out of those in each group that took a position.</p><button class="go" data-go="${esc(x.p.key)}:oppose">See the ${x.n.oppose} opposing comments</button></div>`;
    }).join("");

    const top = META.proposals.map(p => {
      const cond = rows.filter(c => (c.pos || {})[p.key] === "conditional");
      const tally = {}; cond.forEach(c => ((c.conds || {})[p.key] || []).forEach(g => { if (g !== "other") tally[g] = (tally[g] || 0) + 1; }));
      const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
      return best && best[1] >= 3 ? { p, g: best[0], n: best[1], of: cond.length } : null;
    }).filter(Boolean);
    const topMax = Math.max(1, ...top.map(t => t.of));

    const themes = META.topics.map(t => ({ key: t.key, n: rows.filter(c => (c.topics || []).includes(t.key)).length })).filter(t => t.key !== "Other" && t.n).sort((a, b) => b.n - a.n).slice(0, 6);
    const thMax = Math.max(1, ...themes.map(t => t.n));
    const qs = META.questions.map(q => ({ q, n: rows.filter(c => c.q_addr.includes(q.n)).length })).sort((a, b) => a.n - b.n).slice(0, 4);

    const isInd = c => groupOf(c) === GROUPS[0][0];
    const share = (rs, k, st) => { const n = counts(rs, k); return n.total ? pc(n[st], n.total) : "none"; };
    const splitLine = (k, st) => `<div class="note sub">Industry ${share(rows.filter(isInd), k, st)} · Everyone else ${share(rows.filter(c => !isInd(c)), k, st)}</div>`;
    const crow = (x, st) => row(x, 0, x.p.key + ":" + st, pc(x.n[st], x.n.total)) + splitLine(x.p.key, st);

    const cats = {}; rows.forEach(c => cats[c.commenter_type] = (cats[c.commenter_type] || 0) + 1);
    const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const gN = GROUPS.map(([g]) => [g, rows.filter(c => groupOf(c) === g).length]);

    const DIS = META.dissent || {}, who = id => { const c = BYID[id]; return c ? `${esc(nameOf(c))}, ${esc(c.commenter_type)}` : ""; };
    const reasons = k => (DIS[k] || []).map(r => `<li><span>${esc(r.reason)}</span> <span class="note">(${who(r.id)})</span></li>`).join("");
    const contestedKeys = new Set(contested.map(x => x.p.key));
    const others = META.proposals.map(p => ({ p, n: counts(rows, p.key) })).filter(x => x.n.oppose && !contestedKeys.has(x.p.key)).sort((a, b) => b.n.oppose - a.n.oppose);
    const diverge = [];
    META.proposals.forEach(p => { const all = counts(rows, p.key); if (contestedKeys.has(p.key) || !all.total) return;
      GROUPS.forEach(([g]) => { const n = counts(rows.filter(c => groupOf(c) === g), p.key); if (n.total >= 4 && n.oppose >= 2 && n.oppose / n.total >= 0.3) diverge.push({ p, g, n, all }); }); });

    const NP = (META.nopos || []).filter(x => x.kind === "outside_framing" || x.kind === "general_objection");
    const npKinds = {}; (META.nopos || []).forEach(x => npKinds[x.kind] = (npKinds[x.kind] || 0) + 1);
    const OQ = META.open_questions || [];

    document.getElementById("view-findings").innerHTML = `<div class="af">
      <section><h2>Commenters</h2><div class="cards"><div class="card" style="grid-column:1/-1">
        <p style="margin:0">Of the ${rows.length} comments, ${gN.map(([g, n], i) => `${esc(g).toLowerCase()} filed ${n}`).join(", ").replace(/, ([^,]*)$/, ", and $1")}. Industry here means device makers, drug makers, other private companies, and international industry.</p>
        <div class="cats">${catRows.map(([t, n]) => `<div class="row"><span class="lab">${esc(t)}</span>${lbar(n, rows.length)}<span class="num">${n}</span></div>`).join("")}</div>
        <p class="note">Every count on this page treats each comment as one, whatever its length or who filed it. A view shared by many industry comments can look like consensus, so consensus rows also show industry and everyone else separately.</p>
      </div></div></section>
      <section><h2>Points of consensus</h2>${legend}<div class="cards">
        <div class="card"><h3>Largely endorsed as written in the docket</h3>${endorsed.map(x => crow(x, "support")).join("") || '<p class="note">None at this threshold.</p>'}
          <p class="note">Share of comments that took a position and supported the proposal without conditions. Listed when it is at least ${T.endorse * 100}%.</p></div>
        <div class="card"><h3>Accepted with added conditions</h3>${condd.map(x => crow(x, "conditional")).join("") || '<p class="note">None at this threshold.</p>'}
          <p class="note">Select a bar to see added conditions. Listed when at least ${T.cond * 100}% supported with conditions.</p></div>
      </div></section>
      <section><h2>Points of dissent</h2><p class="note">Proposals where at least ${T.contest * 100}% of comments that took a position opposed it, with each opposing comment's reason.</p><div class="cards">
        ${contested.map(x => { const lines = GROUPS.map(([g]) => { const n = counts(rows.filter(c => groupOf(c) === g), x.p.key); return n.total ? `<div class="row"><span class="lab">${esc(g)}</span>${sbar(n)}<span class="num">${n.oppose} of ${n.total}</span></div>` : ""; }).join("");
          return `<div class="card"><h3>${esc(x.p.label)}</h3><div class="row"><span class="lab"><b>All commenters</b></span>${sbar(x.n)}<span class="num">${x.n.oppose} of ${x.n.total}</span></div>${lines}<p class="note">Comments opposing, out of those in each group that took a position.</p>${reasons(x.p.key) ? `<p class="note">Reasons given</p><ul class="rs">${reasons(x.p.key)}</ul>` : ""}<button class="go" data-go="${esc(x.p.key)}:oppose">Read the ${x.n.oppose} opposing comments</button></div>`; }).join("") || '<p class="note">None at this threshold.</p>'}
        ${diverge.length ? `<div class="card"><h3>Opposition within one group</h3>${diverge.map(d => `<div class="row click" data-go="${esc(d.p.key)}:oppose" tabindex="0" role="button"><span class="lab">${esc(d.p.label)}, ${esc(d.g)}</span>${sbar(d.n)}<span class="num">${d.n.oppose} of ${d.n.total}</span></div>`).join("")}<p class="note">Proposals below the threshold overall where at least 30% of one group opposed, with at least 2 opposing and 4 taking a position.</p></div>` : ""}
        ${others.length ? `<div class="card" style="grid-column:1/-1"><h3>Opposition on other proposals</h3>${others.map(x => `<div class="oth"><button class="go" data-go="${esc(x.p.key)}:oppose">${esc(x.p.label)}, ${x.n.oppose} of ${x.n.total}</button>${reasons(x.p.key) ? `<ul class="rs">${reasons(x.p.key)}</ul>` : ""}</div>`).join("")}</div>` : ""}
      </div></section>
      <section><h2>Top added conditions</h2><div class="cards"><div class="card" style="grid-column:1/-1">
        ${top.map(t => `<div class="row click" data-go="${esc(t.p.key)}:conditional:${esc(t.g)}" tabindex="0" role="button" style="grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) minmax(70px,.6fr) 70px"><span class="lab">${esc(t.p.label)}</span><span>${esc(condLabel(t.p.key, t.g))}</span>${lbar(t.n, topMax)}<span class="num">${t.n} of ${t.of}</span></div>`).join("")}
        <p class="note">For each proposal, the condition named most often by comments that supported it with conditions. Shown when at least 3 comments named it. Select a row to read them.</p></div></div></section>
      <section><h2>Topics outside the docket questions</h2><div class="cards">
        <div class="card"><h3>Additional themes</h3>${themes.map(t => `<div class="row click" data-theme="${esc(t.key)}" tabindex="0" role="button"><span class="lab">${esc(t.key)}</span>${lbar(t.n, thMax)}<span class="num">${t.n}</span></div>`).join("")}<p class="note">Themes none of FDA's 26 questions asked about. Number of comments raising each.</p></div>
        <div class="card"><h3>Least addressed questions</h3>${qs.map(x => `<div class="row click" data-q="${x.q.n}" tabindex="0" role="button"><span class="lab">Q${x.q.n} ${esc(x.q.label)}</span>${lbar(x.n, rows.length)}<span class="num">${pc(x.n, rows.length)}</span></div>`).join("")}<p class="note">Share of all comments that substantively addressed the question.</p></div>
        ${(META.nopos || []).length ? `<div class="card" style="grid-column:1/-1"><h3>Comments outside the 17 proposals</h3><p class="note">${rows.filter(c => !Object.values(c.pos || {}).some(Boolean)).length} comments took no position on any proposal. These ${NP.length} raised a concern or objection the proposals do not cover.</p><ul class="rs">${NP.map(x => `<li><span>${esc(x.point)}</span> <span class="note">(${who(x.id)})</span></li>`).join("")}</ul></div>` : ""}
      </div></section>
      ${OQ.length ? `<section><h2>Open questions</h2><p class="note">Questions where commenters gave different answers. Counts are comments, and a comment can appear on more than one side.</p><div class="cards">${OQ.map(q => { const sd = (q.sides || []).map(x => ({ ...x, n: rows.filter(c => posItems(c).includes(x.sel)).length })); const mx = Math.max(1, ...sd.map(x => x.n));
          return `<div class="card"><h3>${esc(q.question)}</h3>${sd.map(x => `<div class="row click" data-go="${esc(x.sel)}" tabindex="0" role="button"><span class="lab">${esc(x.label)}</span>${lbar(x.n, mx)}<span class="num">${x.n}</span></div>`).join("")}<p class="note">Select a row to read those comments.</p></div>`; }).join("")}</div></section>` : ""}
      <section><h2>Methods</h2><div class="card"><ul class="rs">
        <li>Comments were read in full, including attachments, and coded by Claude Opus 5.5 against written codebooks. Separate model instances checked uncertain codes and the condition groups. No codes have been checked by a person yet.</li>
        <li>Each comment counts once. Duplicate filings of the same document are counted once.</li>
        <li>"Support with conditions" includes comments that endorsed a proposal while listing requirements they treated as necessary. Where coders disagreed, the code leans toward support with conditions or no position.</li>
        <li>Reasons for opposition and summaries of other comments are short paraphrases. Check a comment's original text before quoting or citing it.</li>
      </ul></div></section>
      ${footer()}</div>`;
    bind(document.getElementById("view-findings"));
  }

  /* By proposal */
  function proposals() {
    const rows = people(), P = META.proposals;
    if (!prop || !P.find(p => p.key === prop)) prop = P[0].key;
    const p = P.find(x => x.key === prop), n = counts(rows, p.key), tip = (META.tips.pos || {})[p.key] || {};
    const cond = rows.filter(c => (c.pos || {})[p.key] === "conditional");
    const cg = condsOf(p.key).map(g => ({ g, n: cond.filter(c => ((c.conds || {})[p.key] || []).includes(g.key)).length })).filter(x => x.n);
    const cmax = Math.max(1, ...cg.map(x => x.n));
    const A = META.aria, av = (A.pos || {})[p.key], aq = (A.position_quotes || {})[p.key] || [];
    const word = { support: "Support", conditional: "Support with conditions", oppose: "Oppose" };
    const groups = GROUPS.map(([g]) => { const m = counts(rows.filter(c => groupOf(c) === g), p.key); return m.total ? `<div class="row"><span class="lab">${esc(g)}</span>${sbar(m)}<span class="num">${m.total}</span></div>` : ""; }).join("");
    document.getElementById("view-proposals").innerHTML = `<div class="bp">
      <label class="psel"><span class="note">Proposal</span><select id="psel" class="select">${P.map(x => `<option value="${esc(x.key)}" ${x.key === prop ? "selected" : ""}>${esc(Q(x))} ${esc(x.label)}</option>`).join("")}</select></label><nav class="plist" aria-label="Proposals">${P.map(x => `<button type="button" data-p="${esc(x.key)}" aria-current="${x.key === prop}"><span class="qn">${esc(Q(x))}</span>${esc(x.label)}</button>`).join("")}</nav>
      <article class="brief af">
        <div class="block"><p class="note">${esc(tip.title || Q(p))}</p><h2>${esc(p.label)}</h2>
          ${tip.quote ? `<p class="quote">“${esc(tip.quote)}”</p>` : ""}${tip.body ? `<p style="margin:0">${esc(tip.body)}</p>` : ""}</div>
        <div class="block"><h3>Commenter positions</h3>${legend}
          <div class="row"><span class="lab">All commenters</span>${sbar(n)}<span class="num">${n.total}</span></div>
          <p class="note">${n.total} of ${rows.length} comments took a position. ${n.support} supported, ${n.conditional} supported with conditions, and ${n.oppose} opposed.</p>
          <div style="display:flex;gap:16px;flex-wrap:wrap">${["support", "conditional", "oppose"].filter(s => n[s]).map(s => `<button class="go" data-go="${esc(p.key)}:${s}">${n[s]} ${s === "conditional" ? "with conditions" : s === "support" ? "supporting" : "opposing"}</button>`).join("")}</div></div>
        <div class="block"><h3>Responses by commenter group</h3>${groups}<p class="note">The number is how many comments in each group took a position.</p></div>
        ${cg.length ? `<div class="block"><h3>Added conditions</h3>${cg.map(x => `<div class="row click" data-go="${esc(p.key)}:conditional:${esc(x.g.key)}" tabindex="0" role="button"><span class="lab">${esc(x.g.label)}</span>${lbar(x.n, cmax)}<span class="num">${x.n}</span></div>`).join("")}<p class="note">Named by the ${cond.length} comments that supported it with conditions. A comment can name more than one. Select a row to read them.</p></div>` : ""}
        <div class="block"><button type="button" class="pill small" id="ariaTog" aria-pressed="${showAria}">${showAria ? "Hide" : "Show"} ARIA's position</button>
          ${showAria ? `<p style="margin:0">${av ? word[av] : "ARIA took no position on this proposal."}</p>${aq.map(q => `<p class="quote">“${esc(q)}”</p>`).join("")}` : ""}</div>
      </article></div>${footer()}`;
    const el = document.getElementById("view-proposals");
    el.querySelectorAll(".plist button").forEach(b => b.onclick = () => { prop = b.dataset.p; proposals(); setHash(); el.scrollIntoView({ block: "start" }); });
    el.querySelector("#ariaTog").onclick = () => { showAria = !showAria; proposals(); };
    el.querySelector("#psel").onchange = e => { prop = e.target.value; proposals(); setHash(); };
    bind(el);
  }

  function footer() { const f = document.querySelector("#view-explore footer"); return f ? `<footer style="margin-top:24px">${f.innerHTML}</footer>` : ""; }
  function bind(root) {
    const act = el => {
      if (el.dataset.go) goPos(el.dataset.go);
      else if (el.dataset.theme) go({ lens: "topics", key: el.dataset.theme }, "topics");
      else if (el.dataset.q) go({ lens: "questions", key: el.dataset.q }, "questions");
    };
    root.querySelectorAll("[data-go],[data-theme],[data-q]").forEach(el => {
      el.addEventListener("click", () => act(el));
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(el); } });
    });
  }
  function setHash() { const h = view === "proposals" ? "proposal-" + prop : view; try { history.replaceState(null, "", "#" + h); } catch (e) {} }
  function show(v) {
    view = v;
    document.querySelectorAll(".tabs .tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.view === v)));
    ["explore", "findings", "proposals"].forEach(k => { document.getElementById("view-" + k).hidden = k !== v; });
    if (v === "explore") { render(); fitTitle(); window.dispatchEvent(new Event("resize")); }
    if (v === "findings") findings();
    if (v === "proposals") proposals();
    setHash();
  }

  window.analysisInit = function () {
    document.querySelectorAll(".tabs .tab").forEach(t => t.onclick = () => { show(t.dataset.view); window.scrollTo({ top: 0 }); });
    const h = location.hash.slice(1);
    if (h.startsWith("proposal-")) { prop = h.slice(9); show("proposals"); }
    else show(h === "explore" ? "explore" : "findings");
  };
})();
