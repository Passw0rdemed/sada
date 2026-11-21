# صدى · SADA

فريق إعلامي ذكي يدير العمل الإعلامي عبر شبكات التواصل لجهات خدمة الزوار في المدينة المنورة: يرصد المصادر الموثوقة، ويصوغ المنشورات بلغات الزوار، ويمرّ كل منشور ببوابة اعتماد بشري قبل النشر.

An AI media team for visitor-services authorities in Al-Madinah Al-Munawwarah: it monitors trusted sources, drafts posts in the visitors' languages, and passes every post through a human approval gate before anything is published.

## What is in this prototype

- 16 agents in 8 stages (coordination, monitoring & data, planning, production, quality, publishing, engagement, analysis), with a five-agent first release.
- Studio: from an update to a post ready for every platform and language, with sensitivity rating and the approval path.
- Approvals with role-based chains and time limits; crisis mode; a calendar with prayer-time quiet windows.
- Engagement inbox with replies drafted in the sender's language (no rulings, no guessing, escalation).
- Performance (pilot indicators, clearly labelled as sample data), archive and governance log, brand book and asset library.
- Arabic and English interface; light, dark and auto modes; five palettes including a feminine collection.

## Imagery policy

Images and video were generated with Google Gemini and contain no living beings (no people or animals) and no women. Religious sites appear only in approved real photographs. See `media/manifest.json`.

## Run locally

It is a static site with no build step:

```
python -m http.server 8641
```

Then open http://localhost:8641.

## Status

A demonstrable prototype with simulated agent runs and sample data. Nothing is posted to any platform: the app runs in preview mode.
