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
  let view = "findings", prop = null;

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

    const A = META.aria.pos || {};
    const cmp = META.proposals.filter(p => A[p.key]).map(p => { const n = counts(rows, p.key); const mode = ["support", "conditional", "oppose"].sort((a, b) => n[b] - n[a])[0]; return { p, a: A[p.key], mode, n }; });
    const same = cmp.filter(x => x.a === x.mode), diff = cmp.filter(x => x.a !== x.mode);
    const word = { support: "support", conditional: "support with conditions", oppose: "oppose" };

    document.getElementById("view-findings").innerHTML = `<div class="af">
      <section><h2>Points of consensus</h2>${legend}<div class="cards">
        <div class="card"><h3>Largely endorsed as written in the docket</h3>${endorsed.map(x => row(x, x.n.support, x.p.key + ":support", pc(x.n.support, x.n.total))).join("") || '<p class="note">None at this threshold.</p>'}
          <p class="note">Share of comments that took a position and supported the proposal without conditions. Listed when it is at least ${T.endorse * 100}%.</p></div>
        <div class="card"><h3>Accepted with added conditions</h3>${condd.map(x => row(x, x.n.conditional, x.p.key + ":conditional", pc(x.n.conditional, x.n.total))).join("") || '<p class="note">None at this threshold.</p>'}
          <p class="note">Select a bar to see added conditions. Listed when at least ${T.cond * 100}% supported with conditions.</p></div>
      </div></section>
      <section><h2>Points of contention</h2><p class="note">Proposals where at least ${T.contest * 100}% of comments that took a position opposed it.</p><div class="cards">
        ${split || '<p class="note">None at this threshold.</p>'}
      </div></section>
      <section><h2>Most common added condition</h2><div class="cards"><div class="card" style="grid-column:1/-1">
        ${top.map(t => `<div class="row click" data-go="${esc(t.p.key)}:conditional:${esc(t.g)}" tabindex="0" role="button" style="grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) minmax(70px,.6fr) 70px"><span class="lab">${esc(t.p.label)}</span><span>${esc(condLabel(t.p.key, t.g))}</span>${lbar(t.n, topMax)}<span class="num">${t.n} of ${t.of}</span></div>`).join("")}
        <p class="note">For each proposal, the condition named most often by comments that supported it with conditions. Shown when at least 3 comments named it. Select a row to read them.</p></div></div></section>
      <section><h2>Beyond FDA's questions</h2><div class="cards">
        <div class="card"><h3>Themes commenters raised that none of the 26 questions asked about</h3>${themes.map(t => `<div class="row click" data-theme="${esc(t.key)}" tabindex="0" role="button"><span class="lab">${esc(t.key)}</span>${lbar(t.n, thMax)}<span class="num">${t.n}</span></div>`).join("")}<p class="note">Number of comments raising each theme.</p></div>
        <div class="card"><h3>Questions the fewest comments addressed</h3>${qs.map(x => `<div class="row click" data-q="${x.q.n}" tabindex="0" role="button"><span class="lab">Q${x.q.n} ${esc(x.q.label)}</span>${lbar(x.n, rows.length)}<span class="num">${pc(x.n, rows.length)}</span></div>`).join("")}<p class="note">Share of all comments that substantively addressed the question.</p></div>
      </div></section>
      <section><h2>Where ARIA stands</h2><div class="cards"><div class="card" style="grid-column:1/-1">
        <p style="margin:0">ARIA took a position on ${cmp.length} of ${META.proposals.length} proposals. On ${same.length} of them its position matches the most common view among commenters.</p>
        ${diff.length ? `<p class="note">Where ARIA differs from the most common view</p>${diff.map(x => `<div class="row click" data-go="${esc(x.p.key)}:${x.a}" tabindex="0" role="button" style="grid-template-columns:minmax(0,1fr) minmax(0,1.2fr) minmax(90px,.8fr)"><span class="lab">${esc(x.p.label)}</span><span>ARIA: ${word[x.a]}. Most commenters: ${word[x.mode]}.</span>${sbar(x.n)}</div>`).join("")}` : ""}
      </div></div></section>
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
        <div class="block"><h3>How commenters responded</h3>${legend}
          <div class="row"><span class="lab">All commenters</span>${sbar(n)}<span class="num">${n.total}</span></div>
          <p class="note">${n.total} of ${rows.length} comments took a position. ${n.support} supported, ${n.conditional} supported with conditions, and ${n.oppose} opposed.</p>
          <div style="display:flex;gap:16px;flex-wrap:wrap">${["support", "conditional", "oppose"].filter(s => n[s]).map(s => `<button class="go" data-go="${esc(p.key)}:${s}">${n[s]} ${s === "conditional" ? "with conditions" : s === "support" ? "supporting" : "opposing"}</button>`).join("")}</div></div>
        <div class="block"><h3>By commenter group</h3>${groups}<p class="note">The number is how many comments in each group took a position.</p></div>
        ${cg.length ? `<div class="block"><h3>Added conditions</h3>${cg.map(x => `<div class="row click" data-go="${esc(p.key)}:conditional:${esc(x.g.key)}" tabindex="0" role="button"><span class="lab">${esc(x.g.label)}</span>${lbar(x.n, cmax)}<span class="num">${x.n}</span></div>`).join("")}<p class="note">Named by the ${cond.length} comments that supported it with conditions. A comment can name more than one. Select a row to read them.</p></div>` : ""}
        <div class="block"><h3>ARIA</h3><p style="margin:0">${av ? word[av] : "ARIA took no position on this proposal."}</p>${aq.map(q => `<p class="quote">“${esc(q)}”</p>`).join("")}</div>
      </article></div>${footer()}`;
    const el = document.getElementById("view-proposals");
    el.querySelectorAll(".plist button").forEach(b => b.onclick = () => { prop = b.dataset.p; proposals(); setHash(); el.scrollIntoView({ block: "start" }); });
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
