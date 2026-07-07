WORLD_MAP = [
    "TTTTTTTTTTTTTTTTTTTTTTTT",
    "T....M....T....w....B...T",
    "T.TTT..T..T..wwwww..T...T",
    "T....R.T.....wwwww..T.M.T",
    "T..M...T..C...www...T...T",
    "T......T.....TTTTT......T",
    "T..TTT....N.....M....TT.T",
    "T....T..TTTTT.......M...T",
    "T.M..T....P....T........T",
    "T....T.........T....G...T",
    "TTTTTTTTTTTTTTTTTTTTTTTT",
]

TILE_LEGEND = {
    "T": "ancient tree",
    ".": "moss path",
    "M": "moon cap",
    "R": "elder root",
    "C": "crystal hollow",
    "N": "Myco companion",
    "P": "player start",
    "G": "elder gate",
    "B": "impossible bloom",
    "w": "moon pool water",
}


def dimensions() -> tuple[int, int]:
    return len(WORLD_MAP[0]), len(WORLD_MAP)
