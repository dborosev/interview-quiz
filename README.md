# Interview Quiz

A small mobile-friendly static web app for practicing interview questions.

## Editing questions

Edit `questions.json` using this format:

```json
[
  {
    "id": 1,
    "question": "Question text",
    "answer": "Answer text",
    "note": "Optional starting note"
  }
]
```

Keep each `id` unique. The app shuffles questions on load.

## Notes and export workflow

GitHub Pages cannot directly save changes back into a repo file without a GitHub auth/token flow. This app keeps notes in the phone browser while you use it, then lets you:

- **Download updated JSON**: saves a new `questions-with-notes.json` containing your current notes.
- **Copy notes report**: copies a plain-text report you can paste into Telegram for Hermes.

## Local preview

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
