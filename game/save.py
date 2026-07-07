from dataclasses import asdict
from pathlib import Path
import json

from .player import PlayerState
from .quests import QuestState


SAVE_PATH = Path("models/myco_save.json")


def save_checkpoint(player: PlayerState, quest: QuestState) -> Path:
    SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)
    SAVE_PATH.write_text(json.dumps({"player": asdict(player), "quest": asdict(quest)}, indent=2), encoding="utf-8")
    return SAVE_PATH
