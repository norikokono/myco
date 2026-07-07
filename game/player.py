from dataclasses import dataclass, field


@dataclass
class PlayerState:
    x: int = 8
    y: int = 8
    health: int = 3
    memories: int = 0
    friendship: int = 1
    inventory: dict[str, int] = field(default_factory=lambda: {"Moon Cap": 0})
