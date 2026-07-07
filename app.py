import gradio as gr

from ui.renderer import render_game_iframe


def myco_reply(message: str, history: list[dict[str, str]] | None = None) -> str:
    prompt = message.strip() or "Keep walking"
    return f"🍄 Myco listens, then whispers: '{prompt}' may be a clue."


with gr.Blocks(title="Myco 2.0") as demo:
    gr.HTML(render_game_iframe())
    gr.ChatInterface(fn=myco_reply, title="Gemma-powered Myco Companion")


if __name__ == "__main__":
    demo.launch()
