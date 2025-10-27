# QuizApp React (OpenTDB)
This is a minimal React + Vite quiz app that fetches questions from OpenTDB (https://opentdb.com/). Features:
- Simple login (name only)
- Fetch questions from OpenTDB API
- Global timer
- Single question per page; selecting an option moves to the next question
- Resume quiz after closing the browser using localStorage
- Result screen showing total, answered, correct, incorrect

## How to run
1. Install dependencies:
```
npm install
```
2. Run dev server:
```
npm run dev
```
3. Open the URL shown by Vite (usually http://localhost:5173).

No custom backend or API is required — the app uses the public OpenTDB API directly.
