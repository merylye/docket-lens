# Docket Lens

An interactive map of the public comments on FDA's discussion paper on generative AI-enabled medical devices, [Docket FDA-2026-N-7874](https://www.regulations.gov/docket/FDA-2026-N-7874/comments).

Site: https://merylye.github.io/docket-lens/

## What the site shows

**Position distribution.** Where commenters stood on 17 proposals from the discussion paper, in docket question order. Bar length shows how many comments gave a view, and the segments show support, support with conditions, and opposition. Selecting a "support with conditions" segment lists the conditions those commenters attached. A category view splits each proposal by commenter category.

**Top recommendations.** The asks that recurred across comments, grouped into 40 recommendations and ranked by how many comments made each.

**Coverage.** The share of comments addressing each of the paper's 26 questions, its four question groups, or themes FDA's questions did not ask about. The Focus buttons switch between these views.

**By category.** Commenter categories against questions or question groups, shaded by the share of each category's comments that addressed each one. Individual comments, including ARIA's, can be added as rows.

**Commenter category.** How many comments came from each category.

**Comments.** Every comment with its commenter, category, date, and coverage. Selecting anything in the charts filters this list.

## Analysis page

https://merylye.github.io/docket-lens/analysis/ adds two tabs to the site. **Key findings** shows who commented, points of consensus (split by industry and everyone else), points of dissent with each opposing comment's reason, the most common added condition for each proposal, coverage gaps including comments that fall outside the 17 proposals, open questions where commenters split, and methods. **By proposal** summarizes each proposal on one page, with ARIA's position behind a toggle. Both are computed from the same data at load time, and each list states its threshold. Rows open the Explore tab with that filter applied. The page is generated from `index.html` by `pipeline/build_analysis.py`, with its own code in `analysis/`. Opposition reasons, comment summaries, and open questions are in `pipeline/dissent.json`.

## How comments were coded

All coding was done with Claude Opus 5.5, and every check was done by a separate instance of the same model. No codes have been checked by a person yet.

- **Coverage and themes.** Each comment was read in full, including attachments, and coded against `pipeline/codebook.md`. A question counts as addressed when a comment discusses it substantively, cited or not. A blind recode of 12 random comments matched 87% of the questions addressed. Theme coding matched only 39%, so treat theme counts as rough.
- **Positions.** Coded against `pipeline/codebook_positions.md`. Codes the first coder was unsure of went to two independent coders. Where they agreed, that code was used. Where they disagreed, the code is "support with conditions" if either said so and "no position" if either said no position. A blind recode of 15 random comments matched 97% of codes, or 92% of codes where either coder gave a stance (Cohen's kappa 0.95). Every mismatch was between support and support with conditions, or between support with conditions and no position. A second blind recode of 12 more random comments matched 98% of codes, or 86% where either coder gave a stance. Its five mismatches were set to no position. Opposition reasons and comment summaries were checked against the passages they came from, and 28 of 54 were tightened. A check of 200 random recommendation assignments found 75% fit their group, 24% fit partly, and 1% did not; the misfits were reassigned.
- **Conditions.** Each condition was extracted with the passage that states it and grouped within its proposal. A separate coder who saw only the passage and the group label rejected 10% of assignments. Rejected assignments, and groups named by fewer than three comments, count under "Other conditions."
- **ARIA.** ARIA's comment was coded the same way, and each of its position markers links to a sentence from the submitted PDF. It appears on the site before it is posted to Regulations.gov.

Coding is approximate. Check a comment's original text before quoting or citing it.

## Counts and categories

The docket has 129 posted comments. The charts count 124, because five documents were each filed twice (0102 and 0117, 0057 and 0058, 0010 and 0013, 0128 and 0129, 0040 and 0041). Each is counted once under the earlier filing, whose card links to the second. Where the two copies had been coded differently, the code follows the disagreement rule above.

One commenter asked that their comment not be used this way. It is counted in the charts but has no card, and its coding is kept in `pipeline/private/`, which is not committed.

Categories come from Regulations.gov. Comments filed without one were assigned a category from their content and are marked "inferred." A few comments are filed under a category that does not match their content, and the site keeps the filed category.

## Repository layout

| Path | What it is |
| --- | --- |
| `index.html` | The site. Static, no build step. |
| `data/` | The data the site reads, generated by `pipeline/merge.py`. |
| `pipeline/codebook.md`, `pipeline/codes/` | Coverage and theme rules, and one coded record per comment. |
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
