# Sermon Slides Generation Prompt

You are working in a sermon preparation project.

I have a sermon text file in Markdown format. Your task is to generate a separate Markdown file for Marp sermon slides.

Use this file as a template - lesson-99999-template.slides.md

The slides must include only:

1. The sermon title
2. A list of Bible passages used in the sermon
3. The full Bible quote for each passage

Do **not** create slides for sermon points, introduction, applications, illustrations, conclusion, or any other sermon sections.

## What to do

1. Read the sermon Markdown file carefully.
2. Identify the sermon title from the file.
3. Find all Bible passage references and Bible quotations in the sermon.
4. List the Bible passages in the exact order they are mentioned in the sermon.
5. If the same passage is mentioned more than once, include it only once unless it is used in clearly different parts with different quoted text.
6. If a Bible passage is quoted but the reference is missing, find the most probable Bible reference and include it.
7. If a Bible passage is referenced but not quoted, find and include the full passage text.
8. If the reference is uncertain, still include the best probable passage and mark it clearly as probable.
9. Do not invent Bible passages that are not clearly connected to the sermon.
10. Do not modify the original sermon file.

## Output file

Create a new Markdown file with the same name as the sermon file, but with the suffix:

`.slides.md`

For example:

Input:

`lesson-53-on-valuing-our-neibour.md`

Output:

`lesson-53-on-valuing-our-neibour.slides.md`

## Required Marp format

Use this exact Marp structure and style:

```md
---
marp: true
theme: uncover
paginate: true
style: |
  section {
    background: #000;
    color: #fff;
    font-size: 3em;
  }
---

<!-- class: invert -->

## Sermon Title

---

## Bible Reference

---

Full Bible passage text.

> Bible Reference

---
```

## Slide formatting rules

1. The first slide must contain only the sermon title.
2. For each Bible passage, create two slides:
   - one slide with the Bible reference as a heading
   - one slide with the full Bible text and the reference in a blockquote at the bottom

3. Use `##` for slide titles.
4. Separate every slide with `---`.
5. Keep the Bible text readable and clean.
6. Preserve verse numbers where possible.
7. Do not add sermon commentary.
8. Do not add explanations outside the final Markdown file.
9. Do not include a “Bible passages used” overview slide.
10. Do not include any content that is not sermon title or Bible passages.

## Language

Use the same language as the sermon file.

If the sermon is in Ukrainian, the slides must be in Ukrainian.

## Final requirement

The final generated file must contain only valid Marp Markdown slide content and must be ready to use immediately.
