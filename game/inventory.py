from collections import Counter


class Inventory:
    def __init__(self) -> None:
        self.items: Counter[str] = Counter()

    def add(self, item: str, amount: int = 1) -> None:
        self.items[item] += amount

    def summary(self) -> list[tuple[str, int]]:
        return sorted(self.items.items())
