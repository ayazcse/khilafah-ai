"""Learning Academy — structured paths, lessons, quizzes, progress tracking."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.academy_content import get_lesson, get_path, lessons_for_path, list_paths
from backend.app.deps import get_current_user, get_db
from backend.app.models import AcademyProgress, User
from backend.app.schemas import LearningPathOut, LessonOut, ProgressOut, QuizResult, QuizSubmission

router = APIRouter(prefix="/academy", tags=["academy"])


@router.get("/paths", response_model=list[LearningPathOut])
def paths() -> list[dict]:
    return list_paths()


@router.get("/paths/{path_id}", response_model=list[LessonOut])
def path_lessons(path_id: str) -> list[dict]:
    path = get_path(path_id)
    if path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning path not found")
    return lessons_for_path(path_id)


@router.get("/lessons/{lesson_id}", response_model=LessonOut)
def lesson_detail(lesson_id: str) -> dict:
    lesson = get_lesson(lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return lesson


@router.post("/quiz/{lesson_id}/submit", response_model=QuizResult)
def submit_quiz(
    lesson_id: str,
    payload: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    lesson = get_lesson(lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    quiz = lesson.get("quiz")
    if not quiz:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This lesson has no quiz")

    correct = 0
    for question in quiz:
        selected = payload.answers.get(question["id"])
        if selected is not None and selected == question["correct_index"]:
            correct += 1
    total = len(quiz)
    score = round((correct / total) * 100, 2) if total else 0.0

    progress = (
        db.query(AcademyProgress)
        .filter(
            AcademyProgress.user_id == current_user.id,
            AcademyProgress.path_id == lesson["path_id"],
            AcademyProgress.lesson_id == lesson_id,
        )
        .first()
    )
    if progress is None:
        progress = AcademyProgress(
            user_id=current_user.id,
            path_id=lesson["path_id"],
            lesson_id=lesson_id,
        )
    progress.completed = score >= 50.0
    progress.score = score
    db.add(progress)
    db.commit()

    return {"score": score, "correct": correct, "total": total}


@router.get("/progress", response_model=list[ProgressOut])
def progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    rows = db.query(AcademyProgress).filter(AcademyProgress.user_id == current_user.id).all()
    by_path: dict[str, list[AcademyProgress]] = {}
    for row in rows:
        by_path.setdefault(row.path_id, []).append(row)

    out = []
    for path in list_paths():
        path_rows = by_path.get(path["id"], [])
        completed = sum(1 for r in path_rows if r.completed)
        total = len(path["lesson_ids"])
        out.append(
            {
                "path_id": path["id"],
                "completed_lessons": completed,
                "total_lessons": total,
                "percent": round((completed / total) * 100, 2) if total else 0.0,
            }
        )
    return out
