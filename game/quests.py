from dataclasses import dataclass


@dataclass
class QuestState:
    title: str = "Find the Elder Roots"
    memories_required: int = 10
    memories_found: int = 0

    @property
    def progress_label(self) -> str:
        return f"{self.memories_found} / {self.memories_required} Memories"
