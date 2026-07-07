from dataclasses import dataclass


@dataclass
class CameraState:
    x: int = 0
    y: int = 0
    width: int = 17
    height: int = 11

    def follow(self, target_x: int, target_y: int, world_width: int, world_height: int) -> None:
        self.x = max(0, min(world_width - self.width, target_x - self.width // 2))
        self.y = max(0, min(world_height - self.height, target_y - self.height // 2))
