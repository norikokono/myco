from dataclasses import dataclass, field

from .camera import CameraState
from .player import PlayerState
from .quests import QuestState
from .world import WORLD_MAP, dimensions


@dataclass
class GameState:
    player: PlayerState = field(default_factory=PlayerState)
    camera: CameraState = field(default_factory=CameraState)
    quest: QuestState = field(default_factory=QuestState)
    map_rows: list[str] = field(default_factory=lambda: WORLD_MAP.copy())

    def sync_camera(self) -> None:
        width, height = dimensions()
        self.camera.follow(self.player.x, self.player.y, width, height)
