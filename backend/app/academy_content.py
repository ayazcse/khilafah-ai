"""Static Learning Academy content: paths, lessons, and source-grounded quizzes.

Every quiz question here is written against a specific, named entry in
data/source_registry.json or the governance/economics modules' own cited
sources. Lessons with no verifiable source for a quiz ship with quiz=None
and an honest note, rather than a fabricated question.
"""
from __future__ import annotations

LESSONS: dict[str, dict] = {
    "l-diwan-intro": {
        "id": "l-diwan-intro",
        "path_id": "p-governance-basics",
        "title": "What Was the Diwan?",
        "content": (
            "The diwan began as a register, introduced under the caliph 'Umar ibn "
            "al-Khattab, to track and pay stipends to Muslim soldiers from the public "
            "treasury. As the early Islamic state grew, 'diwan' came to describe "
            "entire government bureaus — separate diwans managed land tax (kharaj), "
            "official correspondence, and military payroll. This is one of the "
            "earliest examples of formal state bureaucracy in the region."
        ),
        "quiz": [
            {
                "id": "q-diwan-1",
                "question": "Under which caliph was the diwan register first introduced?",
                "options": ["Abu Bakr", "'Umar ibn al-Khattab", "'Uthman ibn 'Affan", "'Ali ibn Abi Talib"],
                "correct_index": 1,
                "source": "Encyclopaedia of Islam, entry: 'Diwan'",
            },
            {
                "id": "q-diwan-2",
                "question": "What was the diwan originally used to track?",
                "options": [
                    "Religious rulings (fatwas)",
                    "Soldiers' stipends from the treasury",
                    "Trade routes to China",
                    "Marriage contracts",
                ],
                "correct_index": 1,
                "source": "Hugh Kennedy, 'The Prophet and the Age of the Caliphates'",
            },
        ],
    },
    "l-shura-intro": {
        "id": "l-shura-intro",
        "path_id": "p-governance-basics",
        "title": "The Principle of Shura",
        "content": (
            "Shura, or consultation, is referenced in the Qur'an (42:38, 3:159) and "
            "appears in historical accounts of how senior companions were consulted "
            "on major decisions after the Prophet's death, notably in choosing a "
            "successor after 'Umar's death. Historians debate how formal or binding "
            "this consultation was in practice — it was not a fixed parliamentary "
            "institution with defined membership and procedure."
        ),
        "quiz": [
            {
                "id": "q-shura-1",
                "question": "What does 'shura' mean?",
                "options": ["Taxation", "Consultation", "Pilgrimage", "Jurisprudence"],
                "correct_index": 1,
                "source": "Encyclopaedia of Islam, entry: 'Shura'",
            },
        ],
    },
    "l-bayt-al-mal-intro": {
        "id": "l-bayt-al-mal-intro",
        "path_id": "p-governance-basics",
        "title": "Bayt al-Mal: The Public Treasury",
        "content": (
            "Bayt al-mal was the central treasury institution of the early Islamic "
            "state, collecting zakat, kharaj (land tax), and jizya, and disbursing "
            "stipends and public funds. Its administration grew more formal as the "
            "territory of the caliphate expanded."
        ),
        "quiz": None,  # No additional verified quiz source beyond the summary; left empty rather than fabricated.
    },
    "l-zakat-basics": {
        "id": "l-zakat-basics",
        "path_id": "p-economics-basics",
        "title": "Zakat: Principles and Nisab",
        "content": (
            "Zakat is a mandatory form of almsgiving on qualifying wealth above a "
            "minimum threshold (nisab), commonly cited as the value of 85 grams of "
            "gold or 595 grams of silver, at a standard rate of 2.5% for cash, gold, "
            "silver, and trade goods. Specific rulings on what counts as zakatable "
            "wealth and how liabilities are treated differ between schools of fiqh."
        ),
        "quiz": [
            {
                "id": "q-zakat-1",
                "question": "What is the commonly cited standard zakat rate on qualifying cash wealth?",
                "options": ["1%", "2.5%", "10%", "20%"],
                "correct_index": 1,
                "source": "Economics Lab calculation module (simulations/economics_models.py); widely-cited standard rate",
            },
            {
                "id": "q-zakat-2",
                "question": "What is 'nisab' in the context of zakat?",
                "options": [
                    "A type of charitable trust",
                    "The minimum wealth threshold above which zakat is due",
                    "A prayer performed before giving zakat",
                    "A tax paid only by non-Muslims",
                ],
                "correct_index": 1,
                "source": "Economics Lab calculation module (simulations/economics_models.py)",
            },
        ],
    },
    "l-waqf-intro": {
        "id": "l-waqf-intro",
        "path_id": "p-economics-basics",
        "title": "Waqf: Perpetual Charitable Endowments",
        "content": (
            "A waqf is a permanent charitable endowment — once dedicated, the "
            "underlying asset cannot be sold or inherited, and its revenue must "
            "fund the stated charitable purpose indefinitely. Waqf endowments "
            "historically funded mosques, schools, hospitals, and public "
            "infrastructure across the Islamic world."
        ),
        "quiz": [
            {
                "id": "q-waqf-1",
                "question": "What happens to the underlying asset of a waqf once it is dedicated?",
                "options": [
                    "It can be freely sold by the founder's heirs",
                    "It becomes inalienable — it cannot be sold or inherited",
                    "It reverts to the state treasury after 10 years",
                    "It must be converted to cash annually",
                ],
                "correct_index": 1,
                "source": "Encyclopaedia of Islam, entry: 'Waqf'",
            },
        ],
    },
}

LEARNING_PATHS: dict[str, dict] = {
    "p-governance-basics": {
        "id": "p-governance-basics",
        "title": "Foundations of Early Islamic Governance",
        "description": "An introduction to the core administrative institutions of the early Islamic state: the diwan, shura, and bayt al-mal.",
        "lesson_ids": ["l-diwan-intro", "l-shura-intro", "l-bayt-al-mal-intro"],
    },
    "p-economics-basics": {
        "id": "p-economics-basics",
        "title": "Foundations of Islamic Economic Concepts",
        "description": "Core concepts in Islamic economics: zakat and waqf, and how they functioned as mechanisms of redistribution and public funding.",
        "lesson_ids": ["l-zakat-basics", "l-waqf-intro"],
    },
}


def list_paths() -> list[dict]:
    return list(LEARNING_PATHS.values())


def get_path(path_id: str) -> dict | None:
    return LEARNING_PATHS.get(path_id)


def get_lesson(lesson_id: str) -> dict | None:
    return LESSONS.get(lesson_id)


def lessons_for_path(path_id: str) -> list[dict]:
    path = LEARNING_PATHS.get(path_id)
    if not path:
        return []
    return [LESSONS[lid] for lid in path["lesson_ids"] if lid in LESSONS]
