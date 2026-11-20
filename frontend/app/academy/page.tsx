"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, LearningPath, Lesson } from "@/lib/api";
import { Loading, EmptyState, ErrorBanner } from "@/components/StateViews";

interface Progress {
  path_id: string;
  completed_lessons: number;
  total_lessons: number;
  percent: number;
}

export default function AcademyPage() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<LearningPath[]>("/academy/paths").then((p) => {
      setPaths(p);
      setLoading(false);
    });
    if (user) api.get<Progress[]>("/academy/progress").then(setProgress);
  }, [user]);

  async function openPath(pathId: string) {
    setActivePath(pathId);
    setActiveLesson(null);
    const l = await api.get<Lesson[]>(`/academy/paths/${pathId}`);
    setLessons(l);
  }

  if (loading) return <Loading />;

  if (activeLesson) {
    return (
      <LessonView
        lesson={activeLesson}
        onBack={() => setActiveLesson(null)}
        isAuthenticated={!!user}
        onSubmitted={() => activePath && api.get<Progress[]>("/academy/progress").then(setProgress)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-serif font-semibold text-white mb-1">Learning Academy</h1>
      <p className="text-white/50 text-sm mb-8">Structured lessons with source-grounded quizzes.</p>

      {paths.length === 0 ? (
        <EmptyState title="No learning paths available" description="Learning content has not been loaded." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {paths.map((p) => {
            const prog = progress.find((pr) => pr.path_id === p.id);
            return (
              <button key={p.id} onClick={() => openPath(p.id)} className="card text-left hover:border-gold/40">
                <h3 className="text-white font-medium mb-2">{p.title}</h3>
                <p className="text-white/60 text-sm mb-3">{p.description}</p>
                {prog && (
                  <div className="w-full bg-charcoal rounded-full h-2">
                    <div
                      className="bg-emerald-deep h-2 rounded-full"
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                )}
                {prog && (
                  <p className="text-white/40 text-xs mt-1">
                    {prog.completed_lessons}/{prog.total_lessons} lessons completed
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {activePath && (
        <div>
          <h2 className="text-gold font-medium mb-4">Lessons</h2>
          <div className="space-y-3">
            {lessons.map((l) => (
              <button
                key={l.id}
                onClick={() => setActiveLesson(l)}
                className="card w-full text-left hover:border-gold/40 flex items-center justify-between"
              >
                <span className="text-white">{l.title}</span>
                <span className="text-white/40 text-xs">{l.quiz ? `${l.quiz.length} quiz questions` : "No quiz yet"}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LessonView({
  lesson,
  onBack,
  isAuthenticated,
  onSubmitted,
}: {
  lesson: Lesson;
  onBack: () => void;
  isAuthenticated: boolean;
  onSubmitted: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    try {
      const res = await api.post<typeof result>(`/academy/quiz/${lesson.id}/submit`, { answers });
      setResult(res);
      onSubmitted();
    } catch {
      setError("Please sign in to submit the quiz and track your progress.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <button onClick={onBack} className="text-white/50 hover:text-white text-sm mb-6">
        ← Back to lessons
      </button>
      <h1 className="text-2xl font-serif font-semibold text-white mb-4">{lesson.title}</h1>
      <p className="text-white/70 leading-relaxed mb-8 whitespace-pre-wrap">{lesson.content}</p>

      {!lesson.quiz && (
        <EmptyState title="No quiz available" description="This lesson doesn't have a verified quiz yet." />
      )}

      {lesson.quiz && (
        <div className="card space-y-6">
          <h2 className="text-gold font-medium">Quiz</h2>
          {lesson.quiz.map((q) => (
            <div key={q.id}>
              <p className="text-white mb-2">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 text-white/70 text-sm">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === i}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              <p className="text-white/30 text-xs mt-1">Source: {q.source}</p>
            </div>
          ))}
          {error && <ErrorBanner message={error} />}
          <button onClick={handleSubmit} disabled={!isAuthenticated} className="btn-primary">
            Submit answers
          </button>
          {!isAuthenticated && <p className="text-white/40 text-xs">Sign in to submit and track progress.</p>}
          {result && (
            <p className="text-gold font-medium">
              Score: {result.score}% ({result.correct}/{result.total} correct)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
