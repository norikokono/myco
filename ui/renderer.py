from html import escape
from pathlib import Path

UI_DIR = Path(__file__).resolve().parent


def render_game_document() -> str:
    html = (UI_DIR / "game.html").read_text(encoding="utf-8")
    css = (UI_DIR / "game.css").read_text(encoding="utf-8")
    javascript = (UI_DIR / "game.js").read_text(encoding="utf-8")
    return html.replace('<link rel="stylesheet" href="game.css">', f"<style>{css}</style>").replace('<script src="game.js"></script>', f"<script>{javascript}</script>")


def render_game_iframe() -> str:
    document = escape(render_game_document(), quote=True)
    return f'<iframe title="Myco 2.0 Game" srcdoc="{document}" style="width:100%;height:860px;border:0;border-radius:18px;overflow:hidden;"></iframe>'
