
"""LangGraph orchestration for the KHILAFAH AI research workflow."""
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

__all__ = ["LLMNotConfiguredError", "run_query"]


def _node_route(state: WorkflowState) -> WorkflowState:
    result = router_agent.classify(state["message"])
    trace = state.get("agent_trace", [])
    trace.append({
        "agent": "query_router",
        "summary": result["trace_summary"],
    })

    return {
        **state,
        "category": result["category"],
        "agent_trace": trace,
    }


def _run_domain_agent(state: WorkflowState) -> WorkflowState:
    category = state.get("category", "history")
    message = state["message"]
    language = state.get("language", "en")
    db = state.get("_db")
    user_id = state["user_id"]
    trace = state.get("agent_trace", [])

    try:
        # First, search the current user's uploaded documents
        # regardless of the question category.
        rag_result = None

        if db is not None:
            try:
                rag_result = answer_from_documents(
                    db=db,
                    query=message,
                    user_id=user_id,
                )
            except LLMNotConfiguredError:
                raise
            except Exception:
                logger.exception("Document RAG lookup failed")
                rag_result = None

        # Use the uploaded documents when relevant passages are found.
        if rag_result and rag_result.get("citations"):
            agent_name = "uploaded_document_research"
            result = {
                "answer": rag_result["answer"],
                "citations": rag_result["citations"],
                "uncertainty_note": (
                    "Answer grounded in your uploaded documents."
                ),
                "token_usage": None,
            }

        # Otherwise, use the relevant specialist agent.
        elif category == "economics":
            agent_name = "economics_research_agent"
            result = economics_agent.run(message, language, db)

        elif category == "governance":
            agent_name = "governance_research_agent"
            result = governance_agent.run(message, language, db)

        elif category == "education":
            agent_name = "education_agent"
            result = education_agent.run(message, language, db)

        else:
            agent_name = "historical_research_agent"
            result = history_agent.run(message, language, db)

    except LLMNotConfiguredError:
        raise

    except Exception:
        logger.exception("Research agent '%s' failed", category)
        agent_name = f"{category}_agent"
        result = {
            "answer": (
                "I was unable to research this question due to an "
                "internal error. Please try again."
            ),
            "citations": [],
            "uncertainty_note": (
                "This response reflects a system error, "
                "not a researched answer."
            ),
            "token_usage": None,
        }

    trace.append({
        "agent": agent_name,
        "summary": (
            f"Produced a draft answer for category '{category}'."
        ),
    })

    return {
        **state,
        "draft_answer": result["answer"],
        "citations": result.get("citations", []),
        "uncertainty_note": result.get("uncertainty_note"),
        "agent_trace": trace,
    }


def _node_verify(state: WorkflowState) -> WorkflowState:
    trace = state.get("agent_trace", [])

    verification = verification_agent.run(
        state["draft_answer"],
        state.get("category", "history"),
    )

    trace.append({
        "agent": "source_verification_agent",
        "summary": verification["trace_summary"],
    })

    return {
        **state,
        "final_answer": verification["final_answer"],
        "agent_trace": trace,
    }


_graph = StateGraph(WorkflowState)

_graph.add_node("route", _node_route)
_graph.add_node("research", _run_domain_agent)
_graph.add_node("verify", _node_verify)

_graph.set_entry_point("route")
_graph.add_edge("route", "research")
_graph.add_edge("research", "verify")
_graph.add_edge("verify", END)

_compiled_graph = _graph.compile()


def run_query(
    message: str,
    language: str,
    user_id: str,
    db=None,
) -> dict:
    """Run the research workflow using the configured Gemini client."""

    if not is_configured():
        raise LLMNotConfiguredError(
            "GEMINI_API_KEY is not configured."
        )

    initial_state: WorkflowState = {
        "message": message,
        "language": language,
        "user_id": user_id,
        "agent_trace": [],
        "_db": db,
    }

    final_state = _compiled_graph.invoke(initial_state)

    return {
        "answer": (
            final_state.get("final_answer")
            or final_state.get("draft_answer", "")
        ),
        "citations": final_state.get("citations", []),
        "agent_trace": final_state.get("agent_trace", []),
        "uncertainty_note": final_state.get("uncertainty_note"),
    }
