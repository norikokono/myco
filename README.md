# myco-pro

## Running on GitHub Pages

You do **not** need Gradio for GitHub Pages. GitHub Pages is a static host, so it serves `index.html`, `ui/game.html`, `ui/game.css`, and `ui/game.js` directly in the browser.

Use the included `.github/workflows/pages.yml` workflow if you want GitHub Actions to publish the static game. In your repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Running with Gradio

Use Gradio only when you want the optional local/Python companion chat experience:

```bash
python app.py
```

That mode runs `app.py`, embeds the same browser game, and shows the companion chat UI. It requires a Python-capable environment such as your computer, Hugging Face Spaces, Render, Railway, or another server host.

## Deployment notes

- GitHub Pages and most static GitHub Action deployments only serve static files. They do **not** run `app.py`, Gradio, or any Python/Gemma backend.
- The root `index.html` exists so static deployments open the playable browser game directly by embedding `ui/game.html`.
- Run `python app.py` only when you want the Gradio companion chat experience locally or on a Python-capable host.
