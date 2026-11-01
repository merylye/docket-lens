# Docket Lens

An interactive map of the public comments on FDA's discussion paper on generative AI-enabled medical devices, [Docket FDA-2026-N-7874](https://www.regulations.gov/docket/FDA-2026-N-7874/comments).

Site: https://merylye.github.io/docket-lens/

## What the site shows

**Header.** How many posted comments are coded out of the number posted on Regulations.gov, when the docket was last checked, and when the coded data last changed. An "About this data" note explains where the comments come from, how they were coded, and the limits of the coding.

**Position distribution.** Where commenters stood on 17 proposals from the discussion paper, in docket question order or ranked by support. Bar length shows how many comments gave a view, and the segments show support, support with conditions, and opposition. Selecting an opposition segment lists the reason each opposing comment gave, labeled "AI-written reason," with a link to the comment. Selecting a "support with conditions" segment lists the conditions those commenters attached. A category view splits each proposal by commenter category.

**Positions by proposal.** A tab with one page per proposal: FDA's question, the position counts, how each commenter group responded, the conditions attached, the reasons for opposition, and ARIA's position behind a toggle.

**Top recommendations.** The asks that recurred across comments, grouped into 41 recommendations and ranked by how many comments made each.

**Coverage.** The share of comments addressing each of the paper's 26 questions, or its four question groups. The Focus buttons switch between these views.

**By category.** Commenter categories against questions or question groups, shaded by the share of each category's comments that addressed each one. Individual comments, including ARIA's, can be added as rows.

**Commenter category.** How many comments came from each category.

**Comments.** Every comment with its commenter, category, date, and coverage. Selecting anything in the charts filters this list. Search covers names, categories, and comment numbers. Comments that state they were written by AI are labeled "Disclosed as AI-written."

## Analysis page

https://merylye.github.io/docket-lens/analysis/ adds a **Key findings** tab and uses larger type. **Key findings** shows who commented, every proposal ranked by the share supporting it without conditions (split by industry and everyone else), the most common added condition for each proposal with any close runner-up, every proposal that drew opposition with each opposing comment's reason, coverage gaps including comments that fall outside the 17 proposals, open questions where commenters split, and methods. Opposition reasons are labeled "AI-written reason" and notes on comments that took no position are labeled "AI-written note." Proposals are ranked instead of sorted into lists by cutoffs, so a few changed codes reorder neighbors instead of changing what is listed, and the summary names leaders together when they are within 5 points of each other. It is computed from the same data at load time. Rows open the Explore tab with that filter applied. The page is generated from `index.html` by `pipeline/build_analysis.py`, with its own styles in `analysis/`. Opposition reasons, no-position notes, and open questions are in `pipeline/dissent.json`.

## How comments were coded

All coding was done with Claude Opus 5.5, and every check was done by a separate instance of the same model. No codes have been checked by a person.

- **Coverage.** Each comment was read in full, including attachments, and coded against `pipeline/codebook.md`. A question counts as addressed when a comment discusses it substantively, cited or not. Blind recodes of random samples matched 84% to 97% of the questions addressed. Theme tags were also assigned but matched poorly on recode, so the site does not show them.
- **Positions.** Coded against `pipeline/codebook_positions.md`. A comment is "support with conditions" only when it makes a requirement necessary for accepting the proposal; a comment that endorses a proposal while suggesting additions is "support." The first coder flagged the codes it was unsure of, and two more coders recoded each flagged code without seeing the first. Where they disagreed, the code is "no position" if either said no position, "support with conditions" if either said so, and otherwise "no position." Because this rule leans toward "support with conditions" and "no position," those shares may be somewhat high; the site's "About this data" note says so. Blind recodes of random samples matched 94% to 96% of position codes (Cohen's kappa 0.77 to 0.93), but agreement on codes where either coder gave a stance was lower, 64% to 91%. Treat individual position codes as approximate.
- **Conditions, opposition reasons, and recommendations.** Each condition was assigned to a group within its proposal, with the passage that states it. Groups named by fewer than three comments count under "Other conditions." Each opposition reason and no-position note is a one-sentence paraphrase. A separate coder checked conditions, opposition reasons, no-position notes, and recommendation groups against the comments, and items that did not hold up were corrected or removed. On the site, opposition reasons and no-position notes are labeled as AI-written.
- **Summaries.** Each comment has a one-sentence AI-written summary in `pipeline/codes/`. The site does not show them, because a summary attached to a named organization can misstate its position.
- **ARIA.** ARIA's comment (0370) is coded with the rest. Its markers on the site use those codes, and each quote shown with them is a sentence from the comment that supports the code.

Coding is approximate. Check a comment's original text before quoting or citing it.

## Counts and categories

The docket has 540 posted comments. Two of them (0280 and 0382) list attachments that Regulations.gov has not yet released; they appear in the comment list but are left out of the charts until they can be read and coded. The charts count 531, because those two are left out and seven documents were each filed twice (0102 and 0117, 0057 and 0058, 0010 and 0013, 0128 and 0129, 0040 and 0041, 0174 and 0175, 0522 and 0523). Each is counted once under the earlier filing, whose card links to the second.

Comments known to be filed but not yet posted by FDA can be listed in `pipeline/pending.json`. They appear in the comment list and can be added to the grid, marked "Posting pending," but are not counted in any chart. None are listed now.

One commenter asked that their comment not be used this way. It is counted in the charts but has no card, and its coding is kept in `pipeline/private/`, which is not committed.

Three comments state they were written in whole or part by AI (0227, 0268, and 0313). They are coded like the others and labeled "Disclosed as AI-written" on their cards.

Categories come from Regulations.gov and are mapped to the site's categories; for example, Device Association maps to Device industry, Association to Health care association, Other Government to Government, International Association and Other Organizations to Other, and Consumer Group to Advocacy / nonprofit. Comments filed without a category were assigned one from their content and are marked "inferred." A few comments are filed under a category that does not match their content, and the site keeps the filed category.

## Repository layout

| Path | What it is |
| --- | --- |
| `index.html` | The site. Static, no build step. |
| `views.js`, `views.css` | The Positions by proposal tab on both pages, and the Key findings tab on the analysis page. |
| `data/` | The data the site reads, generated by `pipeline/merge.py`. |
| `pipeline/codebook.md`, `pipeline/codes/` | Coverage rules, and one coded record per comment. |
| `pipeline/codebook_positions.md`, `pipeline/codes2/` | Position and recommendation rules, and each comment's positions and recommendations. |
| `pipeline/recommendations.json`, `pipeline/recommendations_audit.tsv` | The 41 recommendation groups, and every extracted recommendation with its group. |
| `pipeline/conditions.json` | The conditions behind each "support with conditions" code, grouped by proposal. |
| `pipeline/aria.json` | ARIA's comment, coded the same way. |
| `pipeline/tooltips.py` | FDA's question text and the explanations shown in tooltips. |
| `pipeline/merge.py` | Joins the raw comments with the codes and writes `data/`. Duplicate filings are listed in `DUPLICATES`. |
| `pipeline/pull.py` | Downloads comments from the Regulations.gov API. |
| `pipeline/check_new.py`, `pipeline/known_comments.txt` | The daily check for new comments, and hashed IDs of comments already on the site. |

## Updating

FDA posts comments after review, so the docket can keep growing. A GitHub Action checks it daily through December 31, 2026. It writes the posted count and check date to `data/docket_status.json`, which the site shows next to the number of coded comments along with an "About this data" note, and it opens a "New comments to code" issue when it finds new comments. It reads the API key from a repository secret named `REGULATIONS_GOV_API_KEY` (free at [api.data.gov/signup](https://api.data.gov/signup)).

1. Run `REGULATIONS_GOV_API_KEY=... python pipeline/pull.py` to download comments into `pipeline/raw/`, which is not committed.
2. Code new comments against both codebooks and add them to `pipeline/codes/`, `pipeline/codes2/`, `pipeline/recommendations.json`, and `pipeline/conditions.json`. Attachments on `downloads.regulations.gov` block many cloud servers, so read them from a normal browser. Scanned attachments need OCR.
3. Run `python pipeline/merge.py`. Theme tags that match no group print as "Other". Add a pattern to `TOPICS` if they deserve their own group.
4. Run `REGULATIONS_GOV_API_KEY=... python pipeline/check_new.py --update` so the daily check treats them as known.
5. Commit and push. GitHub Pages republishes the site. Close the open issue.
