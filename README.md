# Docket Lens

An interactive map of the public comments on FDA's discussion paper on generative AI-enabled medical devices, [Docket FDA-2026-N-7874](https://www.regulations.gov/docket/FDA-2026-N-7874/comments).

Site: https://merylye.github.io/docket-lens/

## What the site shows

**Position distribution.** Where commenters stood on 17 proposals from the discussion paper, in docket question order. Bar length shows how many comments gave a view, and the segments show support, support with conditions, and opposition. Selecting a "support with conditions" segment lists the conditions those commenters attached. A category view splits each proposal by commenter category.

**Top recommendations.** The asks that recurred across comments, grouped into 41 recommendations and ranked by how many comments made each.

**Coverage.** The share of comments addressing each of the paper's 26 questions, or its four question groups. The Focus buttons switch between these views.

**By category.** Commenter categories against questions or question groups, shaded by the share of each category's comments that addressed each one. Individual comments, including ARIA's, can be added as rows.

**Commenter category.** How many comments came from each category.

**Comments.** Every comment with its commenter, category, date, and coverage. Selecting anything in the charts filters this list.

## Analysis page

https://merylye.github.io/docket-lens/analysis/ adds two tabs to the site. **Key findings** shows who commented, every proposal ranked by the share supporting it without conditions (split by industry and everyone else), the most common added condition for each proposal with any close runner-up, every proposal that drew opposition with each opposing comment's reason, coverage gaps including comments that fall outside the 17 proposals, open questions where commenters split, and methods. Proposals are ranked instead of sorted into lists by cutoffs, so a few changed codes reorder neighbors instead of changing what is listed, and the summary names leaders together when they are within 5 points of each other. **By proposal** summarizes each proposal on one page, with ARIA's position behind a toggle. Both are computed from the same data at load time. Rows open the Explore tab with that filter applied. The page is generated from `index.html` by `pipeline/build_analysis.py`, with its own code in `analysis/`. Opposition reasons, comment summaries, and open questions are in `pipeline/dissent.json`.

## How comments were coded

All coding was done with Claude Opus 5.5, and every check was done by a separate instance of the same model. No codes have been checked by a person yet.

- **Coverage and themes.** Each comment was read in full, including attachments, and coded against `pipeline/codebook.md`. A question counts as addressed when a comment discusses it substantively, cited or not. A blind recode of 12 random comments matched 87% of the questions addressed. Theme tags matched only 39%, so they are no longer shown on the site.
- **Positions.** Coded against `pipeline/codebook_positions.md`. On October 28 and 29, 2026, positions were recoded for every comment under one set of instructions, because a check found that the earlier codes leaned toward "support with conditions." Recoded with the new instructions, 11 of 42 earlier "support" codes became "support with conditions" and 1 moved the other way. The instructions follow the codebook: a comment is "support with conditions" only when it makes a requirement necessary for accepting the proposal, and a comment that endorses a proposal while suggesting additions is "support." Coders worked without seeing earlier codes. The first coder flagged 655 of 3,332 codes as uncertain, and two independent coders recoded each of them. They agreed on 507 (77%). Where they disagreed, the code is "no position" if either said no position, "support with conditions" if either said so, and otherwise "no position." A blind recode of 15 random comments matched 94% of codes, but only 64% of codes where either coder gave a stance (Cohen's kappa 0.77). Ten of its 15 mismatches were between a stance and no position, and five were between support and support with conditions. All 15 were set to no position. Treat individual position codes as approximate. The recode moved the overall split from about one third support and two thirds support with conditions to roughly even.
- **Conditions and opposition reasons.** Each condition was assigned to a group within its proposal, with the passage that states it. Groups named by fewer than three comments count under "Other conditions." A separate coder checked 150 random condition assignments against the comment and rejected 19 (13%); those were removed. Every opposition reason and no-position note was checked against its comment, and 7 of 50 reasons were rewritten.
- **Comments posted October 28.** FDA posted 74 more comments on October 28, 2026. Their coverage, summaries, and recommendations were coded with the same codebook as the earlier comments. A blind recode of 12 random comments matched 84% of the questions addressed. A check of all 73 new comments rewrote 9 summaries. Of 510 recommendation assignments, 85% fit their group, 15% fit partly, and 1% did not; the misfits were reassigned and 3 items the comments did not ask for were removed.- **ARIA and the withheld comment.** ARIA's position codes and the withheld comment's codes were not recoded. ARIA's comment was coded the same way as the others, and each of its position markers links to a sentence from the submitted PDF. It appears on the site before it is posted to Regulations.gov.

Coding is approximate. Check a comment's original text before quoting or citing it.

## Counts and categories

The docket has 203 posted comments. The charts count 197, because six documents were each filed twice (0102 and 0117, 0057 and 0058, 0010 and 0013, 0128 and 0129, 0040 and 0041, 0174 and 0175). Each is counted once under the earlier filing, whose card links to the second. Where the two copies had been coded differently, the code follows the disagreement rule above.

One commenter asked that their comment not be used this way. It is counted in the charts but has no card, and its coding is kept in `pipeline/private/`, which is not committed.

Categories come from Regulations.gov. Comments filed without one were assigned a category from their content and are marked "inferred." A few comments are filed under a category that does not match their content, and the site keeps the filed category.

## Repository layout

| Path | What it is |
| --- | --- |
| `index.html` | The site. Static, no build step. |
| `data/` | The data the site reads, generated by `pipeline/merge.py`. |
| `pipeline/codebook.md`, `pipeline/codes/` | Coverage rules, and one coded record per comment. |
| `pipeline/codebook_positions.md`, `pipeline/codes2/` | Position and recommendation rules, and each comment's positions and recommendations. |
| `pipeline/recommendations.json`, `pipeline/recommendations_audit.tsv` | The 40 recommendation groups, and every extracted recommendation with its group. |
| `pipeline/conditions.json` | The conditions behind each "support with conditions" code, grouped by proposal. |
| `pipeline/aria.json` | ARIA's comment, coded the same way. |
| `pipeline/tooltips.py` | FDA's question text and the explanations shown in tooltips. |
| `pipeline/merge.py` | Joins the raw comments with the codes and writes `data/`. Duplicate filings are listed in `DUPLICATES`. |
| `pipeline/pull.py` | Downloads comments from the Regulations.gov API. |
| `pipeline/check_new.py`, `pipeline/known_comments.txt` | The daily check for new comments, and hashed IDs of comments already on the site. |

## Updating

FDA posts comments after review, so the docket can keep growing. A GitHub Action checks it daily through November 21, 2026, and opens a "New comments to code" issue when it finds any. It reads the API key from a repository secret named `REGULATIONS_GOV_API_KEY` (free at [api.data.gov/signup](https://api.data.gov/signup)).

1. Run `REGULATIONS_GOV_API_KEY=... python pipeline/pull.py` to download comments into `pipeline/raw/`, which is not committed.
2. Code new comments against both codebooks and add them to `pipeline/codes/`, `pipeline/codes2/`, `pipeline/recommendations.json`, and `pipeline/conditions.json`. Attachments on `downloads.regulations.gov` block many cloud servers, so read them from a normal browser. Scanned attachments need OCR.
3. Run `python pipeline/merge.py`. Theme tags that match no group print as "Other". Add a pattern to `TOPICS` if they deserve their own group.
4. Run `REGULATIONS_GOV_API_KEY=... python pipeline/check_new.py --update` so the daily check treats them as known.
5. Commit and push. GitHub Pages republishes the site. Close the open issue.
