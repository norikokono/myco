# myco-pro

## Running on GitHub Pages

You do **not** need Gradio for GitHub Pages. GitHub Pages is a static host, so it serves `index.html`, `ui/game.html`, `ui/game.css`, and `ui/game.js` directly in the browser.

Use the included `.github/workflows/pages.yml` workflow if you want GitHub Actions to publish the static game. In your repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.


## Which deployment should I use?

| Goal | Deploy target | Why |
| --- | --- | --- |
| Play the current game in a browser | GitHub Pages | The movement, canvas rendering, inventory, quest UI, and map interactions are JavaScript, so they run fully in the browser without Python. |
| Use Myco as a Python/AI companion app | Gradio on Hugging Face Spaces or another Python host | Gradio is needed only when you want `app.py`, the chat wrapper, or future Gemma/backend calls to run. |
| Use both | Deploy static GitHub Pages now, then deploy Gradio separately when the AI backend is ready | This keeps the game playable while backend AI work continues. |

Interactivity alone does **not** mean the app needs Gradio. Browser games are interactive because JavaScript runs on the user's device. Use Gradio when you need server-side Python or model inference.

## Running with Gradio

Use Gradio only when you want the optional local/Python companion chat experience:

```bash
pip install -r requirements.txt
python app.py
```

That mode runs `app.py`, embeds the same browser game, and shows the companion chat UI. It requires a Python-capable environment such as your computer, Hugging Face Spaces, Render, Railway, or another server host.

## Deployment notes

- GitHub Pages and most static GitHub Action deployments only serve static files. They do **not** run `app.py`, Gradio, or any Python/Gemma backend.
- The root `index.html` exists so static deployments open the playable browser game directly by embedding `ui/game.html`.
- Run `python app.py` only when you want the Gradio companion chat experience locally or on a Python-capable host.


## Deploying Gradio

For a Gradio deployment, use a Python-capable service such as Hugging Face Spaces. Set the Space SDK to **Gradio**, keep `app.py` at the repository root, and include `requirements.txt` so the host installs Gradio before launch.
