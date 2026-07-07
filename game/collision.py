BLOCKING_TILES = {"T", "w"}


def can_enter(tile: str) -> bool:
    return tile not in BLOCKING_TILES
