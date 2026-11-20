"""Static, factually-grounded reference data for the Governance Research Lab.

This is a small, hand-curated set of well-documented historical administrative
institutions. Each entry is labeled with an evidence_level and a short source
reference. These are real, widely-documented institutions of classical
Islamicate governance (Umayyad/Abbasid-era administration); descriptions are
intentionally general and non-partisan, citing well-known reference works.
Nothing here is a Quranic verse, Hadith, or invented quotation — if a claim
needed a specific primary-source citation we were not confident of, it is
labeled "academic_interpretation" and cites the general scholarly consensus
rather than a specific page we cannot verify.
"""
from __future__ import annotations

GOVERNANCE_TOPICS: list[dict] = [
    {
        "id": "diwan",
        "title": "The Diwan (Administrative Register)",
        "summary": "The central register and bureaucratic office system used to track soldiers' pay, land revenue, and state expenditure.",
        "description": (
            "The diwan was introduced as a formal register during the caliphate of "
            "'Umar ibn al-Khattab to record stipends owed to Muslim soldiers and their "
            "families, funded by the state treasury. Over time 'diwan' came to refer "
            "more broadly to the government bureaus of the Umayyad and Abbasid "
            "administrations, handling taxation, correspondence, and military payroll. "
            "Different diwans specialized in distinct functions (e.g. diwan al-kharaj "
            "for land tax, diwan al-rasa'il for correspondence)."
        ),
        "evidence_level": "established",
        "sources": [
            "Hugh Kennedy, 'The Prophet and the Age of the Caliphates' (general academic reference on early Islamic administration)",
            "Encyclopaedia of Islam, entry: 'Diwan'",
        ],
        "period": "7th-10th century CE (Rashidun through Abbasid)",
    },
    {
        "id": "shura",
        "title": "Shura (Consultation)",
        "summary": "The principle and practice of consultation among senior companions and notables in decision-making.",
        "description": (
            "Shura refers to the practice of consultation, discussed in the Qur'an "
            "(42:38, 3:159) and reflected in historical accounts of how the early "
            "caliphs, particularly after the death of 'Umar, sought counsel from a "
            "council of senior companions on matters such as succession. Historians "
            "note that the precise institutional form of shura (who was consulted, "
            "how binding it was) varied and is debated; it was not a fixed parliamentary "
            "body in the modern sense."
        ),
        "evidence_level": "academic_interpretation",
        "sources": [
            "W. Montgomery Watt, 'Islamic Political Thought' (discussion of shura as a concept, not a fixed institution)",
            "Encyclopaedia of Islam, entry: 'Shura'",
        ],
        "period": "7th century CE onward",
    },
    {
        "id": "wilaya",
        "title": "Provincial Administration (Wali/Amir System)",
        "summary": "The appointment of governors (wulat) to administer conquered provinces on behalf of the caliph.",
        "description": (
            "As the early Islamic polity expanded rapidly in the 7th century, the "
            "caliphate administered distant provinces by appointing a wali (governor) "
            "or amir to each region, responsible for tax collection, military command, "
            "and often leading Friday prayers. Provincial governors reported to the "
            "caliph but in practice held considerable autonomy, which historians "
            "identify as a recurring source of political tension, particularly under "
            "the Umayyads."
        ),
        "evidence_level": "established",
        "sources": [
            "Hugh Kennedy, 'The Prophet and the Age of the Caliphates'",
            "Encyclopaedia of Islam, entry: 'Wali'",
        ],
        "period": "7th-13th century CE",
    },
    {
        "id": "bayt-al-mal",
        "title": "Bayt al-Mal (The Public Treasury)",
        "summary": "The institution responsible for collecting and distributing state revenue, including zakat, kharaj, and jizya.",
        "description": (
            "Bayt al-mal (literally 'house of wealth') was the central treasury "
            "institution through which the early Islamic state collected revenue "
            "(zakat, land tax/kharaj, and jizya from non-Muslim subjects) and "
            "disbursed stipends, military pay, and public works funding. Its "
            "administration became increasingly formalized under the Umayyads and "
            "Abbasids as the territory and revenue base grew."
        ),
        "evidence_level": "established",
        "sources": [
            "Encyclopaedia of Islam, entry: 'Bayt al-Mal'",
            "Hugh Kennedy, 'The Prophet and the Age of the Caliphates'",
        ],
        "period": "7th century CE onward",
    },
    {
        "id": "qadi",
        "title": "The Qadi (Judiciary)",
        "summary": "Judges appointed to adjudicate disputes according to Islamic law, forming an early judicial institution.",
        "description": (
            "The office of qadi (judge) developed as the Islamic polity expanded, "
            "with qadis appointed by the caliph or provincial governor to resolve "
            "civil and criminal disputes, generally applying emerging Islamic legal "
            "norms alongside local custom. The formalization of qadi courts and "
            "legal procedure is closely tied to the broader development of Islamic "
            "jurisprudence (fiqh) in the 8th-9th centuries."
        ),
        "evidence_level": "established",
        "sources": [
            "Encyclopaedia of Islam, entry: 'Kadi (Qadi)'",
            "Wael Hallaq, 'The Origins and Evolution of Islamic Law' (general academic reference)",
        ],
        "period": "7th-9th century CE formalization",
    },
    {
        "id": "barid",
        "title": "The Barid (Postal and Intelligence System)",
        "summary": "A state-run courier network used for official communication and, under the Abbasids, intelligence gathering.",
        "description": (
            "The barid was a relay postal system, inherited in concept from earlier "
            "Byzantine and Sasanian administrative practice, used by the Umayyad and "
            "especially Abbasid caliphs to move official correspondence quickly across "
            "the empire. Under some caliphs it also functioned as a channel for "
            "intelligence-gathering on the conduct of provincial governors."
        ),
        "evidence_level": "academic_interpretation",
        "sources": [
            "Encyclopaedia of Islam, entry: 'Barid'",
            "Hugh Kennedy, 'The Prophet and the Age of the Caliphates'",
        ],
        "period": "Umayyad-Abbasid period, 8th-10th century CE",
    },
]


def list_topics() -> list[dict]:
    return GOVERNANCE_TOPICS


def get_topic(topic_id: str) -> dict | None:
    for topic in GOVERNANCE_TOPICS:
        if topic["id"] == topic_id:
            return topic
    return None
