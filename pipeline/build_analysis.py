"""Build analysis/index.html from index.html.

The analysis page is the main site plus two tabs (Key findings, By proposal).
It is generated so that fixes to the main site carry over: edit index.html,
then run `python pipeline/build_analysis.py`.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()


def swap(s, old, new):
    assert s.count(old) == 1, f"expected one match for: {old[:60]}"
    return s.replace(old, new)


s = src
s = swap(s, "<title>Docket Lens</title>", "<title>Docket Lens Analysis</title>")
s = swap(s, "</style>\n</head>", '</style>\n<link rel="stylesheet" href="analysis.css">\n</head>')
s = swap(s, '<div class="facts" id="facts"><span>Loading comments…</span></div>\n</header>',
         '<div class="facts" id="facts"><span>Loading comments…</span></div>\n'
         '  <nav class="tabs" role="tablist" aria-label="Views">\n'
         '    <button type="button" class="tab" role="tab" data-view="explore" aria-selected="false">Explore</button>\n'
         '    <button type="button" class="tab" role="tab" data-view="findings" aria-selected="true">Key findings</button>\n'
         '    <button type="button" class="tab" role="tab" data-view="proposals" aria-selected="false">By proposal</button>\n'
         '  </nav>\n</header>\n<div id="view-explore" class="view" role="tabpanel" hidden>')
s = swap(s, "</main>\n", '</main>\n</div>\n<div id="view-findings" class="view" role="tabpanel"></div>\n'
                         '<div id="view-proposals" class="view" role="tabpanel" hidden></div>\n')
s = swap(s, 'fetch("data/comments.json")', 'fetch("../data/comments.json")')
s = swap(s, 'fetch("data/meta.json")', 'fetch("../data/meta.json")')
s = swap(s, "D = c; META = m; init(); })", "D = c; META = m; init(); if (window.analysisInit) analysisInit(); })")
s = swap(s, "</body>", '<script src="analysis.js"></script>\n</body>')

# Theme coding matched only 39% in a blind check, so the analysis page leaves themes out.
s = swap(s, '      <button type="button" class="pill" data-v="topics" aria-pressed="false">Additional themes</button>\n', '')
s = swap(s, '</div>\n      <div class="facet"><span>Additional themes</span>${themes.length ? `<span>${themes.map(esc).join(" · ")}</span>` : `<span class="none">None</span>`}</div>`;', '</div>`;')

s = swap(s, "[c.id, c.org, c.title, c.commenter_type, ...(c.topics || []), ...(c.tags || [])]", "[c.id, c.org, c.title, c.commenter_type]")

# The disclaimer sits in the Key findings intro, so the footer drops the coding line.
s = swap(s, "  <p>Coding is approximate and was done with Claude Opus 5.5. Check a comment's original text before quoting or citing it.</p>\n", "")

# Recommendation grouping only partly fit its labels in 24% of a checked sample.
s = swap(s, "Number of comments making each recommendation. Select a row to view comments", "Number of comments making each recommendation. Counts are approximate. Select a row to view comments")

os.makedirs(os.path.join(ROOT, "analysis"), exist_ok=True)
open(os.path.join(ROOT, "analysis", "index.html"), "w", encoding="utf-8").write(s)
print("wrote analysis/index.html")
