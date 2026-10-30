/* Key findings and By proposal views. Everything is computed from the same data the Explore view reads,
   so the numbers stay current as comments are added. Proposals are ranked rather than sorted into lists by
   cutoffs, so a few changed codes cannot move a proposal on or off a list. Where the leaders are within a few
   points of the next proposal, the summary names them together as a close group. */
(function () {
  const COL = { support: "#00848a", conditional: "#bbbbbb", oppose: "#111111" };
  const GROUPS = [
    ["Industry", ["Device industry", "Private industry (non-device)", "Drug industry", "International industry"]],
    ["Clinicians and health care groups", ["Health professional", "Health care association"]],
    ["Individuals", ["Individual"]],
    ["Academia, government, and other", ["Academia", "Government", "Other"]],
  ];
  const T = {
    close: 0.05,    // shares within this many points of each other are named together
    closeN: 2,      // condition counts within this many comments of the top one are shown as close
    minN: 15,       // minimum comments with a position for the consensus and contention lists
    minGroup: 5,    // minimum comments with a position before a group split is shown
    minCond: 5,     // minimum comments naming a condition before it is listed as the top condition
  };
  let view = "findings", prop = null, showAria = false;

  const pool = () => readable().filter(c => !c.hidden || true);
  const people = () => readable();
  const counts = (rows, k) => { const n = { support: 0, conditional: 0, oppose: 0 }; rows.forEach(c => { const v = (c.pos || {})[k]; if (v) n[v]++; }); n.total = n.support + n.conditional + n.oppose; return n; };
  const groupOf = c => (GROUPS.find(g => g[1].includes(c.commenter_type)) || GROUPS[3])[0];
  const pc = (a, b) => b ? Math.round(100 * a / b) + "%" : "0%";
  const sbar = n => n.total ? `<div class="sbar" aria-hidden="true">${["support", "conditional", "oppose"].map(s => n[s] ? `<i style="width:${100 * n[s] / n.total}%;background:${COL[s]}"></i>` : "").join("")}</div>` : `<div class="sbar"></div>`;
  const lbar = (v, max) => `<div class="sbar" aria-hidden="true"><i style="width:${max ? 100 * v / max : 0}%;background:${COL.conditional}"></i></div>`;
  const legend = `<div class="legend2" style="margin-bottom:-4px"><span><i style="background:${COL.support}"></i>Support</span><span><i style="background:${COL.conditional}"></i>Support with conditions</span><span><i style="background:${COL.oppose}"></i>Oppose</span></div>`;
  const defn = `<p class="note">Support with conditions means the comment accepts the proposal only if specific requirements are met. Select it to see the requirements.</p>`;
  const Q = p => { const m = p.desc.match(/\((Q[^)]*)\)\s*$/); return m ? m[1] : ""; };
  const pl = p => `<span data-tip="pos:${esc(p.key)}">${esc(Q(p))} ${esc(p.label)}</span>`;
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
    const row = (x, val, key, num) => `<div class="row click" data-go="${esc(key)}" tabindex="0" role="button"><span class="lab">${pl(x.p)}</span>${sbar(x.n)}<span class="num">${num}</span></div>`;
    const sh = st => x => x.n[st] / x.n.total;
    const ranked = st => [...P].sort((a, b) => sh(st)(b) - sh(st)(a));
    // The top k, plus any proposal within T.close of the k-th, so near-ties are named together.
    const lead = (st, k) => { const r = ranked(st).filter(x => x.n[st]); if (!r.length) return []; const cut = sh(st)(r[Math.min(k, r.length) - 1]) - T.close; return r.filter((x, i) => i < k || sh(st)(x) >= cut); };
    const bySupport = ranked("support");
    const opposed = ranked("oppose").filter(x => x.n.oppose);
    const small = META.proposals.map(p => ({ p, n: counts(rows, p.key) })).filter(x => x.n.total < T.minN);


    const top = META.proposals.map(p => {
      const cond = rows.filter(c => (c.pos || {})[p.key] === "conditional");
      const tally = {}; cond.forEach(c => ((c.conds || {})[p.key] || []).forEach(g => { if (g !== "other") tally[g] = (tally[g] || 0) + 1; }));
      const ord = Object.entries(tally).sort((a, b) => b[1] - a[1]), best = ord[0];
      const near = ord.slice(1).filter(([, n]) => best && n >= best[1] - T.closeN).map(([g, n]) => ({ g, n }));
      return best && best[1] >= T.minCond ? { p, g: best[0], n: best[1], of: cond.length, near } : null;
    }).filter(Boolean);
    const topMax = Math.max(1, ...top.map(t => t.of));

    const qs = META.questions.map(q => ({ q, n: rows.filter(c => c.q_addr.includes(q.n)).length })).sort((a, b) => a.n - b.n).slice(0, 4);


    const tot = { support: 0, conditional: 0, oppose: 0 }; META.proposals.forEach(p => { const n = counts(rows, p.key); tot.support += n.support; tot.conditional += n.conditional; tot.oppose += n.oppose; });
    const T3 = tot.support + tot.conditional + tot.oppose, nm = x => `${esc(Q(x.p))} ${esc(x.p.label.toLowerCase())}`;
    const tc = [...top].sort((a, b) => b.n - a.n), topConds = tc.filter((t, i) => i < 2 || t.n >= tc[1].n - T.closeN);
    const list = (xs, f) => xs.length < 2 ? xs.map(f).join("") : xs.slice(0, -1).map(f).join(", ") + (xs.length > 2 ? "," : "") + " and " + f(xs[xs.length - 1]);
    const sup = lead("support", 2), con = lead("conditional", 2), opp = lead("oppose", 1);
    const sum = [
      `Commenters accepted most of FDA's proposals. Across the 17 proposals, ${pc(tot.support, T3)} of positions were support, ${pc(tot.conditional, T3)} were support with conditions, and ${pc(tot.oppose, T3)} were opposition.`,
      sup.length ? `Support without conditions was highest for ${list(sup, x => `${nm(x)} (${pc(x.n.support, x.n.total)})`)}.` : "",
      con.length ? `Support with conditions was most common for ${list(con, x => `${nm(x)} (${pc(x.n.conditional, x.n.total)})`)}.` : "",
      topConds.length ? `The most requested conditions were ${list(topConds, t => `“${esc(condLabel(t.p.key, t.g))}” for ${esc(Q(t.p))} ${esc(t.p.label.toLowerCase())} (${t.n} comments)`)}.` : "",
      opp.length ? `Opposition was highest for ${list(opp, x => `${nm(x)} (${x.n.oppose} of ${x.n.total})`)}. No other proposal drew opposition from more than ${pc(Math.max(0, ...opposed.filter(x => !opp.includes(x)).map(x => x.n.oppose / x.n.total)) * 100, 100)} of the comments that took a position on it.` : "",
    ].filter(Boolean);
    const isInd = c => groupOf(c) === GROUPS[0][0];
    const share = (rs, k, st) => { const n = counts(rs, k); return n.total ? pc(n[st], n.total) : "none"; };
    const splitLine = (k, st) => `<div class="note sub">Industry ${share(rows.filter(isInd), k, st)} · Everyone else ${share(rows.filter(c => !isInd(c)), k, st)}</div>`;
    const crow = (x, st) => row(x, 0, x.p.key + ":" + st, pc(x.n[st], x.n.total)) + splitLine(x.p.key, st);

    const cats = {}; rows.forEach(c => cats[c.commenter_type] = (cats[c.commenter_type] || 0) + 1);
    const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const gN = GROUPS.map(([g]) => [g, rows.filter(c => groupOf(c) === g).length]);

    const DIS = META.dissent || {}, who = id => { const c = BYID[id]; return c ? `${esc(c.commenter_type)}, <a href="https://www.regulations.gov/comment/${esc(id)}" target="_blank" rel="noopener">read comment</a>` : ""; };
    const reasons = k => (DIS[k] || []).map(r => `<li><span>${esc(r.reason)}</span> <span class="note">(${who(r.id)})</span></li>`).join("");
    const NP = (META.nopos || []).filter(x => x.kind === "outside_framing" || x.kind === "general_objection");
    const npKinds = {}; (META.nopos || []).forEach(x => npKinds[x.kind] = (npKinds[x.kind] || 0) + 1);
    const OQ = META.open_questions || [];

    document.getElementById("view-findings").innerHTML = `<div class="af">
      <section class="intro"><p>This page provides an AI-assisted summary of the public comments on Docket FDA-2026-N-7874. This page is exploratory and is not legal or regulatory advice. Positions and summaries were coded with AI assistance and may contain errors. Read the original comments before relying on any finding.</p></section>
      <section><h2>Summary</h2><div class="card"><ul class="rs sumlist">${sum.map(x => `<li>${x}</li>`).join("")}</ul></div></section>
      <section><h2>Commenters</h2><div class="cards"><div class="card" style="grid-column:1/-1">
        <p style="margin:0">Of the ${rows.length} comments, ${gN.map(([g, n]) => `${n} came from ${esc(g).toLowerCase()}`).join("; ")}. Industry here means device makers, drug makers, other private companies, and international industry.</p>
        <div class="cats">${catRows.map(([t, n]) => `<div class="row"><span class="lab">${esc(t)}</span>${lbar(n, rows.length)}<span class="num">${n}</span></div>`).join("")}</div>
        
      </div></div></section>
      <section><h2>Positions on each proposal</h2>${legend}${defn}<div class="cards"><div class="card" style="grid-column:1/-1">
        ${bySupport.map(x => row(x, 0, x.p.key + ":support", `${pc(x.n.support, x.n.total)} · ${pc(x.n.conditional, x.n.total)}`) + `<div class="note sub">${x.n.total} took a position · Industry ${share(rows.filter(isInd), x.p.key, "support")} · Everyone else ${share(rows.filter(c => !isInd(c)), x.p.key, "support")} without conditions</div>`).join("")}
        <p class="note">Ranked by the share supporting without conditions, followed by the share supporting with conditions. Shares are out of the comments that took a position on each proposal. Proposals close together in this ranking are effectively tied; individual position codes are approximate. Select a bar to read those comments.${small.length ? ` Not shown because fewer than ${T.minN} comments took a position: ${small.map(x => esc(Q(x.p)) + " " + esc(x.p.label)).join("; ")}.` : ""}</p>
      </div></div></section>
      <section><h2>Most requested conditions</h2><div class="cards"><div class="card" style="grid-column:1/-1">
        ${top.map(t => `<div class="row click" data-go="${esc(t.p.key)}:conditional:${esc(t.g)}" tabindex="0" role="button"><span class="lab">${pl(t.p)}</span><span class="lab2">${esc(condLabel(t.p.key, t.g))}${t.near.length ? `<span class="note" style="display:block">Close behind: ${t.near.slice(0, 2).map(x => `${esc(condLabel(t.p.key, x.g))} (${x.n})`).join("; ")}${t.near.length > 2 ? `; ${t.near.length - 2} more` : ""}</span>` : ""}</span>${lbar(t.n, topMax)}<span class="num">${t.n} of ${t.of}</span></div>`).join("")}
        <p class="note">For each proposal, the condition named most often by comments that supported it with conditions. Shown when at least ${T.minCond} comments named it. When another condition was named by nearly as many, it is listed as close behind. Select a row to read them.</p></div></div></section>
      <section><h2>Opposition</h2><p class="note">Every proposal that drew opposition, ranked by the share of comments that took a position and opposed it, with each opposing comment's reason. Opposition was rare overall, so small changes in coding can reorder this list.</p><div class="cards stack">
        ${opposed.length ? `<div class="card" style="grid-column:1/-1">${opposed.map(x => `<div class="oth"><div class="row click" data-go="${esc(x.p.key)}:oppose" tabindex="0" role="button"><span class="lab">${pl(x.p)}</span>${sbar(x.n)}<span class="num">${x.n.oppose} of ${x.n.total}</span></div>${reasons(x.p.key) ? `<ul class="rs">${reasons(x.p.key)}</ul>` : ""}</div>`).join("")}<p class="note">The By proposal tab shows how each commenter group responded.</p></div>` : '<p class="note">No proposal drew opposition.</p>'}
      </div></section>
      <section><h2>Coverage gaps</h2><div class="cards stack">
        <div class="card"><h3>Least addressed questions</h3>${qs.map(x => `<div class="row click" data-q="${x.q.n}" tabindex="0" role="button"><span class="lab">Q${x.q.n} ${esc(x.q.label)}</span>${lbar(x.n, rows.length)}<span class="num">${pc(x.n, rows.length)}</span></div>`).join("")}<p class="note">Share of all comments that substantively addressed the question.</p></div>
        ${(META.nopos || []).length ? `<div class="card" style="grid-column:1/-1"><h3>Comments outside the 17 proposals</h3><p class="note">${rows.filter(c => !Object.values(c.pos || {}).some(Boolean)).length} comments took no position on any proposal. These ${NP.length} raised a concern or objection the proposals do not cover.</p><ul class="rs">${NP.map(x => `<li><span>${esc(x.point)}</span> <span class="note">(${who(x.id)})</span></li>`).join("")}</ul></div>` : ""}
      </div></section>
      ${OQ.length ? `<section><h2>Open questions</h2><p class="note">Questions where commenters gave different answers.</p><div class="cards stack">${OQ.map(q => { const sd = (q.sides || []).map(x => ({ ...x, n: rows.filter(c => posItems(c).includes(x.sel)).length })); const mx = Math.max(1, ...sd.map(x => x.n));
          return `<div class="card"><h3>${esc(q.question)}</h3>${sd.map(x => `<div class="row click" data-go="${esc(x.sel)}" tabindex="0" role="button"><span class="lab">${esc(x.label)}</span>${lbar(x.n, mx)}<span class="num">${x.n}</span></div>${x.sel.endsWith(":oppose") && x.n ? `<button class="go sub" data-prop="${esc(x.sel.split(":")[0])}">See their reasons</button>` : ""}`).join("")}<p class="note">Select a row to read those comments.</p></div>`; }).join("")}</div></section>` : ""}
      <section><details class="methods"><summary><h2>Methods</h2></summary><div class="card"><ul class="rs">
        <li>Comments were read in full, including attachments, and coded by Claude Opus 5.5 against written codebooks. Separate model instances checked uncertain codes, condition groups, opposition reasons, and random samples of comments. No codes have been checked by a person yet.</li>
        <li>Positions were recoded for every comment on October 28 and 29, 2026, under one set of instructions. In a blind recode of 15 random comments, coders agreed on 64% of codes where either took a position, so treat individual position codes as approximate.</li>
        <li>Each comment counts once. Duplicate filings of the same document are counted once.</li>
        <li>"Support with conditions" includes comments that endorsed a proposal while listing requirements they treated as necessary. Where coders disagreed, the code leans toward support with conditions or no position.</li>
        <li>Proposals are ranked, not sorted into lists by cutoffs, so a few changed codes reorder neighbors instead of changing what is listed. The summary names leaders together when they are within ${T.close * 100} points of each other.</li>
        <li>Reasons for opposition and summaries of other comments are short paraphrases. Check a comment's original text before quoting or citing it.</li>
      </ul></div></details></section>
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
    const groups = GROUPS.map(([g]) => { const m = counts(rows.filter(c => groupOf(c) === g), p.key); return !m.total ? "" : m.total < T.minGroup ? `<div class="row"><span class="lab">${esc(g)}</span><span class="note">Fewer than ${T.minGroup} took a position</span><span class="num">${m.total}</span></div>` : `<div class="row"><span class="lab">${esc(g)}</span>${sbar(m)}<span class="num">${m.total}</span></div>`; }).join("");
    document.getElementById("view-proposals").innerHTML = `<div class="bp">
      <label class="psel"><span class="note">Proposal</span><select id="psel" class="select">${P.map(x => `<option value="${esc(x.key)}" ${x.key === prop ? "selected" : ""}>${esc(Q(x))} ${esc(x.label)}</option>`).join("")}</select></label><nav class="plist" aria-label="Proposals">${P.map(x => `<button type="button" data-p="${esc(x.key)}" aria-current="${x.key === prop}"><span class="qn">${esc(Q(x))}</span>${esc(x.label)}</button>`).join("")}</nav>
      <article class="brief af">
        <div class="block"><p class="note">${esc(tip.title || Q(p))}</p><h2>${esc(p.label)}</h2>
          ${tip.quote ? `<p class="quote">“${esc(tip.quote)}”</p>` : ""}${tip.body ? `<p style="margin:0">${esc(tip.body)}</p>` : ""}</div>
        <div class="block"><h3>Commenter positions</h3>${legend}${defn}
          <div class="row"><span class="lab">All commenters</span>${sbar(n)}<span class="num">${n.total}</span></div>
          <p class="note">${n.total} of ${rows.length} comments took a position. ${n.support} supported, ${n.conditional} supported with conditions, and ${n.oppose} opposed.</p>
          <div style="display:flex;gap:16px;flex-wrap:wrap">${["support", "conditional", "oppose"].filter(s => n[s]).map(s => `<button class="go" data-go="${esc(p.key)}:${s}">${n[s]} ${s === "conditional" ? "with conditions" : s === "support" ? "supporting" : "opposing"}</button>`).join("")}</div></div>
        <div class="block"><h3>Responses by commenter group</h3>${groups}<p class="note">The number is how many comments in each group took a position.</p></div>
        ${cg.length ? `<div class="block"><h3>Added conditions</h3>${cg.map(x => `<div class="row click" data-go="${esc(p.key)}:conditional:${esc(x.g.key)}" tabindex="0" role="button"><span class="lab">${esc(x.g.label)}</span>${lbar(x.n, cmax)}<span class="num">${x.n}</span></div>`).join("")}<p class="note">Named by the ${cond.length} comments that supported it with conditions. A comment can name more than one. Select a row to read them.</p></div>` : ""}
        ${((META.dissent || {})[p.key] || []).length ? `<div class="block"><h3>Reasons for opposition</h3><ul class="rs">${META.dissent[p.key].map(r => { const c = BYID[r.id]; return `<li><span>${esc(r.reason)}</span> <span class="note">(${c ? esc(c.commenter_type) : ""}, <a href="https://www.regulations.gov/comment/${esc(r.id)}" target="_blank" rel="noopener">read comment</a>)</span></li>`; }).join("")}</ul></div>` : ""}
        <div class="block"><button type="button" class="pill small" id="ariaTog" style="justify-self:start" aria-pressed="${showAria}">${showAria ? "Hide" : "Show"} ARIA's position</button>
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
      if (el.dataset.prop) { prop = el.dataset.prop; show("proposals"); window.scrollTo({ top: 0 }); }
      else if (el.dataset.go) goPos(el.dataset.go);
      else if (el.dataset.q) go({ lens: "questions", key: el.dataset.q }, "questions");
    };
    root.querySelectorAll("[data-go],[data-q],[data-prop]").forEach(el => {
      el.addEventListener("click", () => act(el));
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(el); } });
    });
    align(root);
  }
  // Rows in one box share a label column as wide as their longest label, capped at 45% of the box.
  function align(root) {
    const boxOf = r => r.parentElement.classList.contains("oth") ? r.parentElement.parentElement : r.parentElement;
    const boxes = new Set([...root.querySelectorAll(".row")].map(boxOf));
    boxes.forEach(b => {
      b.style.removeProperty("--lw"); b.style.removeProperty("--lw2"); b.classList.remove("duo"); const bw = b.clientWidth; b.classList.add("measuring");
      const wid = sel => Math.max(0, ...[...b.querySelectorAll(":scope > .row > " + sel + ", :scope > .oth > .row > " + sel)].map(l => l.getBoundingClientRect().width));
      const w = wid(".lab"), w2 = wid(".lab2");
      b.classList.remove("measuring");
      const cap = Math.round(bw * (w2 ? .3 : .45));
      b.style.setProperty("--lw", Math.ceil(Math.min(w, cap)) + "px");
      if (w2) { b.classList.add("duo"); b.style.setProperty("--lw2", Math.ceil(Math.min(w2, cap)) + "px"); }
    });
  }
  let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (view !== "explore") align(document.getElementById("view-" + view)); }, 150); });
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

  function route() {
    const h = location.hash.slice(1);
    if (h.startsWith("proposal-")) { prop = h.slice(9); show("proposals"); }
    else show(h === "explore" ? "explore" : "findings");
  }
  window.analysisInit = function () {
    document.querySelectorAll(".tabs .tab").forEach(t => t.onclick = () => { show(t.dataset.view); window.scrollTo({ top: 0 }); });
    window.addEventListener("hashchange", () => { route(); window.scrollTo({ top: 0 }); });
    route();
  };
})();
