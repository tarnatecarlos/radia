"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, GraduationCap, Play, X } from "lucide-react";
import { courses, enrollments as initialEnrollments } from "@/lib/mock-data";
import type { CourseEnrollment } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { RichContent } from "@/components/ui/rich-content";

const demoProfileId = "u6";

export function OnboardingContent() {
  const { toast } = useToast();
  const [enrollmentState, setEnrollmentState] = useState<CourseEnrollment[]>(() =>
    initialEnrollments.filter((e) => e.profile_id === demoProfileId).map((e) => ({ ...e }))
  );
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);

  function getProgress(courseId: string, lessonCount: number) {
    const enrollment = enrollmentState.find((e) => e.course_id === courseId);
    if (!enrollment || lessonCount === 0) return 0;
    return Math.round((enrollment.completed_lessons.length / lessonCount) * 100);
  }

  const coursesWithProgress = courses.map((course) => {
    const lessonCount = course.lessons?.length ?? 0;
    const progress = getProgress(course.id, lessonCount);
    return { ...course, lessonCount, progress, totalMinutes: (course.lessons ?? []).reduce((s, l) => s + l.estimated_minutes, 0) };
  });

  const totalLessons = coursesWithProgress.reduce((s, c) => s + c.lessonCount, 0);
  const completedLessons = coursesWithProgress.reduce((s, c) => s + Math.round((c.progress / 100) * c.lessonCount), 0);
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const activeCourse = activeCourseId ? coursesWithProgress.find((c) => c.id === activeCourseId) : null;
  const activeLesson = activeCourse?.lessons?.[activeLessonIdx];
  const activeEnrollment = activeCourse ? enrollmentState.find((e) => e.course_id === activeCourse.id) : null;

  function handleResume() {
    for (const course of coursesWithProgress) {
      if (course.is_mandatory && course.progress < 100) {
        setActiveCourseId(course.id);
        const enrollment = enrollmentState.find((e) => e.course_id === course.id);
        const firstIncomplete = (course.lessons ?? []).findIndex((_, i) => !enrollment?.completed_lessons.includes(i + 1));
        setActiveLessonIdx(firstIncomplete >= 0 ? firstIncomplete : 0);
        return;
      }
    }
    toast("All mandatory courses completed!", "success");
  }

  function openCourse(courseId: string) {
    setActiveCourseId(courseId);
    setActiveLessonIdx(0);
  }

  function completeLesson(sortOrder: number) {
    if (!activeCourse) return;
    setEnrollmentState((prev) => {
      const existing = prev.find((e) => e.course_id === activeCourse.id);
      if (existing) {
        if (existing.completed_lessons.includes(sortOrder)) return prev;
        return prev.map((e) =>
          e.course_id === activeCourse.id
            ? { ...e, completed_lessons: [...e.completed_lessons, sortOrder] }
            : e
        );
      }
      return [...prev, {
        id: `e${Date.now()}`, profile_id: demoProfileId,
        course_id: activeCourse.id, completed_lessons: [sortOrder],
      }];
    });
    toast("Lesson completed!");
    const lessons = activeCourse.lessons ?? [];
    if (activeLessonIdx < lessons.length - 1) {
      setActiveLessonIdx(activeLessonIdx + 1);
    }
  }

  const isLessonComplete = (sortOrder: number) => activeEnrollment?.completed_lessons.includes(sortOrder) ?? false;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Progress banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="radia-card flex items-center gap-4 border-indigo-100 bg-indigo-50 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/15"
      >
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <GraduationCap className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">You&apos;re {overallProgress}% through onboarding</h1>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-indigo-200 dark:bg-indigo-500/30">
              <motion.div
                className="h-full rounded-full bg-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="font-mono text-sm font-semibold text-indigo-700 dark:text-indigo-300">{overallProgress}%</span>
          </div>
          <p className="mt-1.5 text-sm text-indigo-600/80 dark:text-indigo-300/80">
            {completedLessons} of {totalLessons} lessons completed
          </p>
        </div>
        <button onClick={handleResume} className="flex-shrink-0 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700">
          {overallProgress >= 100 ? "Review" : "Resume"}
        </button>
      </motion.div>

      {/* Course cards — centered grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {coursesWithProgress.map((course, index) => {
          const isCompleted = course.progress >= 100;
          return (
            <motion.button
              key={course.id}
              onClick={() => openCourse(course.id)}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className="radia-card radia-card-hover flex h-full flex-col gap-3 p-5 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{course.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{course.description}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  {course.is_mandatory && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">Required</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{course.lessonCount} lessons</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />~{course.totalMinutes} min</span>
              </div>

              <div className="mt-auto">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{isCompleted ? "Completed" : "Progress"}</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{course.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-emerald-600" : "bg-indigo-600"}`} style={{ width: `${course.progress}%` }} />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Course Viewer — centered overlay */}
      <AnimatePresence>
        {activeCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveCourseId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                <button onClick={() => setActiveCourseId(null)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{activeCourse.title}</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {activeCourse.lessonCount} lessons - ~{activeCourse.totalMinutes} min
                    {activeCourse.progress > 0 && <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">{activeCourse.progress}% complete</span>}
                  </p>
                </div>
                <button onClick={() => setActiveCourseId(null)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Lesson sidebar */}
                <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-950/50">
                  <div className="p-3">
                    <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">Lessons</p>
                    {(activeCourse.lessons ?? []).map((lesson, idx) => {
                      const complete = isLessonComplete(lesson.sort_order);
                      const active = idx === activeLessonIdx;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLessonIdx(idx)}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                            active
                              ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          {complete ? (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                          ) : (
                            <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                              active ? "border-indigo-400 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300" : "border-slate-300 text-slate-400 dark:border-slate-600"
                            }`}>
                              {idx + 1}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="block truncate">{lesson.title}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">~{lesson.estimated_minutes} min</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lesson content — with rich formatting */}
                <div className="flex-1 overflow-y-auto">
                  {activeLesson ? (
                    <div className="mx-auto max-w-2xl px-8 py-6">
                      {/* Lesson meta */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        ~{activeLesson.estimated_minutes} min
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span>Lesson {activeLessonIdx + 1} of {activeCourse.lessonCount}</span>
                        {isLessonComplete(activeLesson.sort_order) && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />Completed
                          </span>
                        )}
                      </div>

                      {/* Rich content */}
                      <div className="mt-4">
                        <RichContent content={activeLesson.content} />
                      </div>

                      {/* Action buttons */}
                      <div className="mt-10 flex items-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
                        {!isLessonComplete(activeLesson.sort_order) ? (
                          <button
                            onClick={() => completeLesson(activeLesson.sort_order)}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                          >
                            <CheckCircle2 className="h-4 w-4" />Mark as Complete
                          </button>
                        ) : activeLessonIdx < (activeCourse.lessons?.length ?? 0) - 1 ? (
                          <button
                            onClick={() => setActiveLessonIdx(activeLessonIdx + 1)}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                          >
                            <Play className="h-4 w-4" />Next Lesson
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />Course Complete
                          </span>
                        )}
                        {activeLessonIdx > 0 && (
                          <button
                            onClick={() => setActiveLessonIdx(activeLessonIdx - 1)}
                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Previous
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">No lesson selected.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
