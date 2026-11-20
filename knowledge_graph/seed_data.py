"""Small, hand-verified sample dataset for the Civilization Knowledge Graph.

Every entity and relationship here is a well-documented historical fact
suitable as initial sample/testing data. This is intentionally small — it
is a seed for demonstration, not a comprehensive historical database.
"""
from __future__ import annotations

ENTITIES: list[dict] = [
    {"id": "caliph-abu-bakr", "type": "Caliph", "name": "Abu Bakr", "period": "632-634 CE"},
    {"id": "caliph-umar", "type": "Caliph", "name": "'Umar ibn al-Khattab", "period": "634-644 CE"},
    {"id": "caliph-uthman", "type": "Caliph", "name": "'Uthman ibn 'Affan", "period": "644-656 CE"},
    {"id": "caliph-ali", "type": "Caliph", "name": "'Ali ibn Abi Talib", "period": "656-661 CE"},
    {"id": "caliph-harun", "type": "Caliph", "name": "Harun al-Rashid", "period": "786-809 CE"},
    {"id": "dynasty-umayyad", "type": "Dynasty", "name": "Umayyad Caliphate", "period": "661-750 CE"},
    {"id": "dynasty-abbasid", "type": "Dynasty", "name": "Abbasid Caliphate", "period": "750-1258 CE"},
    {"id": "city-damascus", "type": "City", "name": "Damascus", "period": None},
    {"id": "city-baghdad", "type": "City", "name": "Baghdad", "period": None},
    {"id": "city-cordoba", "type": "City", "name": "Cordoba", "period": None},
    {"id": "scholar-khwarizmi", "type": "Scholar", "name": "Al-Khwarizmi", "period": "c. 780-850 CE"},
    {"id": "scholar-ibn-sina", "type": "Scholar", "name": "Ibn Sina (Avicenna)", "period": "c. 980-1037 CE"},
    {"id": "scholar-ibn-khaldun", "type": "Scholar", "name": "Ibn Khaldun", "period": "1332-1406 CE"},
    {"id": "institution-bayt-al-hikma", "type": "Institution", "name": "Bayt al-Hikma (House of Wisdom)", "period": "8th-13th century CE"},
    {"id": "discovery-algebra", "type": "ScientificDiscovery", "name": "Systematic treatment of algebra (al-jabr)", "period": "c. 820 CE"},
    {"id": "book-muqaddimah", "type": "Book", "name": "Muqaddimah", "period": "1377 CE"},
    {"id": "book-qanun", "type": "Book", "name": "The Canon of Medicine (al-Qanun fi al-Tibb)", "period": "1025 CE"},
]

RELATIONSHIPS: list[dict] = [
    # The historical founding of Bayt al-Hikma as a formal institution is most
    # strongly associated with Harun al-Rashid and his son al-Ma'mun in the
    # early Abbasid period; exact founding details are debated among
    # historians, so this is labeled as an association rather than a precise
    # "founded" claim. See docs/EVAL_REPORT.md "Known limitations".
    {"source": "caliph-harun", "type": "ASSOCIATED_WITH_FOUNDING", "target": "institution-bayt-al-hikma"},
    {"source": "caliph-harun", "type": "RULED", "target": "dynasty-abbasid"},
    {"source": "dynasty-umayyad", "type": "FOUNDED", "target": "city-cordoba"},
    {"source": "dynasty-abbasid", "type": "FOUNDED", "target": "city-baghdad"},
    {"source": "scholar-khwarizmi", "type": "LIVED_IN", "target": "city-baghdad"},
    {"source": "scholar-khwarizmi", "type": "WORKED_AT", "target": "institution-bayt-al-hikma"},
    {"source": "scholar-khwarizmi", "type": "PUBLISHED", "target": "discovery-algebra"},
    {"source": "scholar-ibn-sina", "type": "PUBLISHED", "target": "book-qanun"},
    {"source": "scholar-ibn-khaldun", "type": "PUBLISHED", "target": "book-muqaddimah"},
    {"source": "scholar-ibn-khaldun", "type": "INFLUENCED_BY", "target": "dynasty-abbasid"},
    {"source": "institution-bayt-al-hikma", "type": "LOCATED_IN", "target": "city-baghdad"},
]
