from .npc import MYCO_BARKS


def fallback_myco_reply(turn: int) -> str:
    return MYCO_BARKS[turn % len(MYCO_BARKS)]
