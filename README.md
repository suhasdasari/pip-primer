# 🦉 Pip's Primer

An adaptive, patient "private tutor" that teaches children ages 4–8 to **read, write and do arithmetic**. It was built as an MVP for Y Combinator's Fall 2026 Request for Startups, *The Primer*.

It is a 100% static site: no server, no accounts, no API keys. Progress stays in the browser's `localStorage`.

## What it teaches (3 levels per skill)
| Skill | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| 🔤 Letter sounds | first sound of a keyword (10 common letters) | starting letter of a word (24 letters) | blend CVC words to match a picture |
| 👀 Sight words | Dolch pre-primer | Dolch primer | Dolch first grade |
| 📖 Reading stories | 3-sentence decodable texts | short stories with "why" questions | longer passages with inference questions |
| ➕ Adding | sums to 5 with pictures | sums to 10 | sums to 20 |
| ➖ Taking away | within 5 with pictures | within 10 | within 20 |
| 🔢 Number sense | counting 1–10 | which number is bigger (0–20) | what comes next, tens & ones to 99 |
| ✏️ Writing | trace capitals | trace easy lowercase letters | trace tricky lowercase letters (b/d/p/q…) |

All content is original and was written for this project.

## How it adapts
* **Bayesian Knowledge Tracing per skill (and level)** (`js/mastery.js`): p(init)=0.2, p(learn)=0.15, p(slip)=0.1. p(guess) is 1/number of choices, capped at 0.5, and 0.1 for tracing. When P(learned) ≥ 0.95 after at least 3 tries, the child moves up a level. The estimate is kept between 0.01 and 0.99 so new evidence can always move it. The child moves down a level when it drops below 0.3, or when 3 of the last 4 answers at the current level are wrong (both after at least 3 tries at that level).
* **Leitner spaced repetition per item**: a correct answer moves the item up a box (1 min → 5 min → 30 min → 1 day → 3 days). A miss sends it back to box 0. Items that are due come back for review.
* **Skill selection** gives more weight to weaker skills and never repeats the same skill twice in a row.
* **Tracing** is graded on the canvas by how much of the letter shape the child covers (≥45%) and how much of their ink stays near the letter (≥70%).

## Voice
Every prompt is read aloud with `speechSynthesis`, and the 🔊 button repeats it. In the Grown-ups tab, a parent can turn on the microphone. Where `SpeechRecognition` is available (Chrome, Edge, Safari), the child can then *say* sight words and CVC words out loud.

## Parent dashboard
The **Grown-ups** tab shows, for each skill: the level, a progress bar, the BKT mastery estimate, number of tries, overall accuracy and last-10 accuracy, which levels are mastered, and a status ("Needs support", "Almost there", and so on). It also shows days practiced and how many items are due for review. Parents can export progress as JSON or reset it.

## Run locally
```
python3 -m http.server 8000   # then open http://localhost:8000
```
## Deploy to GitHub Pages
Push this folder to a repo, then go to Settings → Pages → Deploy from branch (root). The `.nojekyll` file is included.

## Tests
`test/e2e.js` drives headless Chrome with puppeteer-core:
```
npm i puppeteer-core && node test/e2e.js
```

## Limitations
This is an MVP. It does not use an LLM, so there are no open-ended conversations. Tracing checks letter shape, not stroke order. Speech recognition quality depends on the browser and needs a network connection in Chrome. Progress is stored on one device only.

---
Built by Satoshi Drops 🪂 [@SatoshiDropsHQ](https://x.com/SatoshiDropsHQ)
