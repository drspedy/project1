# Ember Studio — responsive website

A polished, single-page responsive website built with plain HTML, CSS and vanilla JavaScript. It includes a live local date and time that updates every second, an orange colour palette with a light/dark theme, and fully working interactive elements (mobile menu, case-study dialog, testimonial carousel, FAQ accordion, validated forms, share button and back-to-top).

## Files

- `index.html` — semantic page structure and content
- `style.css` — responsive layout, orange design system and dark theme
- `script.js` — clock and all interactive behaviour

## Run locally

No build step or dependencies are required.

**Option 1 — open the file directly**

Double-click `index.html`, or open it in your browser:

```
index.html
```

**Option 2 — use a local web server (recommended)**

From this folder, run one of the following and then visit the printed address (usually `http://localhost:8000` or `http://localhost:3000`):

```
python -m http.server 8000
```

or

```
npx serve .
```

The contact and newsletter forms validate input and confirm success in the browser; they do not send data to a server.
