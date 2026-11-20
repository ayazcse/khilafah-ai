"""LangGraph orchestration wiring the six agents into one workflow.

Flow: Query Router -> (History | Economics | Governance | Education) -> Source
Verification -> final response. Shared state flows through `WorkflowState`.
Every node is wrapped so a single agent's failure produces an honest,
non-fabricated fallback answer instead of crashing the whole request.
"""
from __future__ import annotations

import logging

from langgraph.graph import END, StateGraph

from ai_engine.agents import (
    economics_agent,
    education_agent,
    governance_agent,
    history_agent,
    router_agent,
    verification_agent,
)
from ai_engine.agents.state import WorkflowState
from ai_engine.llm_client import LLMNotConfiguredError, is_configured
from ai_engine.rag import answer_from_documents

logger = logging.getLogger("khilafah_ai.ai_engine.agents")

# Re-exported so backend/app/routers/chat.py can import it from this module
# per the integration contract: `from ai_engine.agents.graph import LLMNotConfiguredError, run_query`
__all__ = ["LLMNotConfiguredError", "run_query"]


def _node_route(state: WorkflowState) -> WorkflowState:
    result = router_agent.classify(state["message"])
    trace = state.get("agent_trace", [])
    trace.append({"agent": "query_router", "summary": result["trace_summary"]})
    return {**state, "category": result["category"], "agent_trace": trace}


def _run_domain_agent(state: WorkflowState) -> WorkflowState:
    category = state.get("category", "history")
    message = state["message"]
    language = state.get("language", "en")
    db = state.get("_db")
    trace = state.get("agent_trace", [])

    try:
        if category == "economics":
            agent_name, result = "economics_research_agent", economics_agent.run(message, language, db)
        elif category == "governance":
            agent_name, result = "governance_research_agent", governance_agent.run(message, language, db)
        elif category == "education":
            agent_name, result = "education_agent", education_agent.run(message, language, db)
        else:
            # history + general both go through the historical research agent,
            # which first tries RAG over the user's own uploaded documents.
            agent_name = "historical_research_agent"
            rag_result = None
            if db is not None:
                try:
                    rag_result = answer_from_documents(db, message)
                except LLMNotConfiguredError:
                    raise
                except Exception:  # noqa: BLE001
                    rag_result = None
            if rag_result and rag_result.get("citations"):
                result = {
                    "answer": rag_result["answer"],
                    "citations": rag_result["citations"],
                    "uncertainty_note": "Answer grounded in your uploaded documents.",
                    "token_usage": None,
                }
            else:
                result = history_agent.run(message, language, db)
    except LLMNotConfiguredError:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Domain agent '%s' failed", category)
        agent_name = f"{category}_agent"
        result = {
            "answer": "I was unable to research this question due to an internal error. Please try again.",
            "citations": [],
            "uncertainty_note": "This response reflects a system error, not a researched answer.",
            "token_usage": None,
        }

    trace.append({"agent": agent_name, "summary": f"Produced a draft answer for category '{category}'."})

    return {
        **state,
        "draft_answer": result["answer"],
        "citations": result.get("citations", []),
        "uncertainty_note": result.get("uncertainty_note"),
        "agent_trace": trace,
    }


def _node_verify(state: WorkflowState) -> WorkflowState:
    trace = state.get("agent_trace", [])
    verification = verification_agent.run(state["draft_answer"], state.get("category", "history"))
    trace.append({"agent": "source_verification_agent", "summary": verification["trace_summary"]})
    return {**state, "final_answer": verification["final_answer"], "agent_trace": trace}


_graph = StateGraph(WorkflowState)
_graph.add_node("route", _node_route)
_graph.add_node("research", _run_domain_agent)
_graph.add_node("verify", _node_verify)
_graph.set_entry_point("route")
_graph.add_edge("route", "research")
_graph.add_edge("research", "verify")
_graph.add_edge("verify", END)
_compiled_graph = _graph.compile()


def run_query(message: str, language: str, user_id: str, db=None) -> dict:
    """Entry point used by backend/app/routers/chat.py.

    Returns {"answer", "citations", "agent_trace", "uncertainty_note"}.
    Raises LLMNotConfiguredError if no OpenAI API key is set, so the router
    can return a clean 503 rather than a confusing failure deep in the graph.
    """
    if not is_configured():
        raise LLMNotConfiguredError("OPENAI_API_KEY is not configured.")

    initial_state: WorkflowState = {
        "message": message,
        "language": language,
        "user_id": user_id,
        "agent_trace": [],
        "_db": db,  # not part of WorkflowState's typed contract; passed through for DB-backed RAG lookups
    }

    final_state = _compiled_graph.invoke(initial_state)

    return {
        "answer": final_state.get("final_answer") or final_state.get("draft_answer", ""),
        "citations": final_state.get("citations", []),
        "agent_trace": final_state.get("agent_trace", []),
        "uncertainty_note": final_state.get("uncertainty_note"),
    }
