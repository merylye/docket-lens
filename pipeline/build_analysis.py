"""Build analysis/index.html from index.html.

The analysis page is the main site plus the Key findings tab, in larger type.
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
s = swap(s, '<link rel="stylesheet" href="views.css">\n</head>', '<link rel="stylesheet" href="../views.css">\n<link rel="stylesheet" href="analysis.css">\n</head>')
s = swap(s, '    <button type="button" class="tab" role="tab" data-view="explore" aria-selected="true">Explore</button>\n',
         '    <button type="button" class="tab" role="tab" data-view="explore" aria-selected="false">Explore</button>\n'
         '    <button type="button" class="tab" role="tab" data-view="findings" aria-selected="true">Key findings</button>\n')
s = swap(s, '<div id="view-explore" class="view" role="tabpanel">', '<div id="view-explore" class="view" role="tabpanel" hidden>')
s = swap(s, '<div id="view-proposals" class="view" role="tabpanel" hidden></div>\n',
         '<div id="view-findings" class="view" role="tabpanel"></div>\n<div id="view-proposals" class="view" role="tabpanel" hidden></div>\n')
s = swap(s, 'fetch("data/comments.json")', 'fetch("../data/comments.json")')
s = swap(s, 'fetch("data/meta.json")', 'fetch("../data/meta.json")')
s = swap(s, "D = c; META = m; init(); if (window.analysisInit) analysisInit(); })", "D = c; META = m; document.fonts.ready.then(() => { init(); if (window.analysisInit) analysisInit(); }); })")
s = swap(s, '<script src="views.js"></script>', '<script src="../views.js"></script>')

# The disclaimer sits in the Key findings intro, so the footer drops the coding line.
s = swap(s, "  <p>Coding is approximate and was done with Claude Opus 5.5. Check a comment's original text before quoting or citing it.</p>\n", "")


# Public Sans, with larger text. The smallest HTML text is 14px and the smallest chart text is 13px.
import re
s = swap(s, "family=Fira+Sans:wght@400;500;700", "family=Public+Sans:wght@400;500;700")
s = swap(s, '--sans: "Fira Sans", Arial, sans-serif;', '--sans: "Public Sans", Arial, sans-serif;')
s = swap(s, "c.font = \"500 14px 'Fira Sans', Arial, sans-serif\";", "c.font = \"500 16px 'Public Sans', Arial, sans-serif\";")
s = s.replace("Fira Sans, Arial, sans-serif", "Public Sans, Arial, sans-serif")
s = swap(s, "mc.font = \"14px 'Fira Sans', Arial, sans-serif\";", "mc.font = \"16px 'Public Sans', Arial, sans-serif\";")
s = swap(s, '<tspan x="${labelW}" dy="${k ? 18 : 0}">', '<tspan x="${labelW}" dy="${k ? 20 : 0}">')
s = swap(s, "rowH = Math.max(30, 10 + lines.length * 18)", "rowH = Math.max(32, 12 + lines.length * 20)")
s = swap(s, 'font-size="${cw < 130 ? 11 : 12}"', 'font-size="${cw < 130 ? 13 : 14}"')
s = re.sub(r'font-size="(\d+)"', lambda m: f'font-size="{max(13, int(m.group(1)) + 2)}"', s)

s = swap(s, "many = cols.length > 8, lw = 230,", "many = cols.length > 8, lw = 280,")
s = swap(s, "const W = 560, x0 = 220, barW = W - x0 - 40, rowH = 28,", "const W = 600, x0 = 255, barW = W - x0 - 40, rowH = 30,")

s = swap(s, "lw = Math.min(Math.round(W * .46), labelW(props))", "lw = Math.min(Math.round(W * .55), labelW(props))")

# Phones get a notice in place of the site.
s = swap(s, "<body>\n", '<body>\n<div class="mobile-only"><p>Please view this website on a computer.</p></div>\n')

os.makedirs(os.path.join(ROOT, "analysis"), exist_ok=True)
open(os.path.join(ROOT, "analysis", "index.html"), "w", encoding="utf-8").write(s)
print("wrote analysis/index.html")
