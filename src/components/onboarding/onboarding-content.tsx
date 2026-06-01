"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, GraduationCap, Minus, Play, Plus, X } from "lucide-react";
import type { Course, CourseEnrollment } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { RichContent } from "@/components/ui/rich-content";
import { DocEditor } from "@/components/ui/doc-editor";
import { useUser } from "@/lib/user-context";
import { api } from "@/lib/api";

export function OnboardingContent() {
  const { toast } = useToast();
  const { profile, preferences, loading: userLoading } = useUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentState, setEnrollmentState] = useState<CourseEnrollment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);

  // Create course
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMandatory, setNewMandatory] = useState(false);
  const [newLessons, setNewLessons] = useState<{ title: string; content: string; estimated_minutes: number }[]>([
    { title: "", content: "", estimated_minutes: 5 },
  ]);
  const isCreator = profile?.role === "creator" || profile?.role === "moderator" || !!preferences?.members_can_create_courses;

  useEffect(() => {
    if (userLoading || !profile) return;

    async function fetchData() {
      const [coursesData, enrollmentsData] = await Promise.all([
        api<Course[]>("/courses"),
        api<CourseEnrollment[]>("/enrollments"),
      ]);

      setCourses(coursesData);
      setEnrollmentState(enrollmentsData);
      setDataLoading(false);
    }

    fetchData();
  }, [userLoading, profile]);

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

  async function completeLesson(sortOrder: number) {
    if (!activeCourse || !profile) return;

    const existing = enrollmentState.find((e) => e.course_id === activeCourse.id);
    if (existing) {
      if (existing.completed_lessons.includes(sortOrder)) return;
      const updatedLessons = [...existing.completed_lessons, sortOrder];
      await api("/enrollments", {
        method: "PATCH",
        body: JSON.stringify({ id: existing.id, completed_lessons: updatedLessons }),
      });
      setEnrollmentState((prev) =>
        prev.map((e) =>
          e.course_id === activeCourse.id
            ? { ...e, completed_lessons: updatedLessons }
            : e
        )
      );
    } else {
      const data = await api<CourseEnrollment>("/enrollments", {
        method: "POST",
        body: JSON.stringify({ course_id: activeCourse.id, completed_lessons: [sortOrder] }),
      });
      setEnrollmentState((prev) => [...prev, data]);
    }

    toast("Lesson completed!");
    const lessons = activeCourse.lessons ?? [];
    if (activeLessonIdx < lessons.length - 1) {
      setActiveLessonIdx(activeLessonIdx + 1);
    }
  }

  const isLessonComplete = (sortOrder: number) => activeEnrollment?.completed_lessons.includes(sortOrder) ?? false;

  async function handleCreateCourse() {
    if (!newTitle.trim()) { toast("Course title is required", "error"); return; }
    const validLessons = newLessons.filter((l) => l.title.trim());
    if (validLessons.length === 0) { toast("Add at least one lesson with a title", "error"); return; }

    try {
      const data = await api<Course>("/courses", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          is_mandatory: newMandatory,
          lessons: validLessons.map((l, i) => ({
            title: l.title.trim(),
            content: l.content.trim() || `# ${l.title.trim()}\n\nLesson content goes here...`,
            sort_order: i + 1,
            estimated_minutes: l.estimated_minutes,
          })),
        }),
      });
      setCourses((prev) => [...prev, data]);
      toast("Course created successfully");
      setShowCreate(false);
      setNewTitle(""); setNewDescription(""); setNewMandatory(false);
      setNewLessons([{ title: "", content: "", estimated_minutes: 5 }]);
    } catch {
      toast("Failed to create course", "error");
    }
  }

  function addLesson() {
    setNewLessons((prev) => [...prev, { title: "", content: "", estimated_minutes: 5 }]);
  }

  function removeLesson(index: number) {
    setNewLessons((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLesson(index: number, field: string, value: string | number) {
    setNewLessons((prev) => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  }

  function renderCreateModal() {
    return (
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }} className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Onboarding Course</h3>
                <button onClick={() => setShowCreate(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Course Title *</span>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Welcome to the Team" className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Description</span>
                  <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} placeholder="Brief description of what this course covers..." className="radia-input w-full resize-none px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                </label>

                <label className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewMandatory(!newMandatory)}
                    className={`relative h-6 w-11 rounded-full transition ${newMandatory ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${newMandatory ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Required for all employees</span>
                </label>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Lessons *</span>
                    <button onClick={addLesson} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10">
                      <Plus className="h-3.5 w-3.5" />Add Lesson
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newLessons.map((lesson, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">{idx + 1}</span>
                          <input
                            value={lesson.title}
                            onChange={(e) => updateLesson(idx, "title", e.target.value)}
                            placeholder={`Lesson ${idx + 1} title...`}
                            className="radia-input flex-1 px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                          />
                          <input
                            type="number"
                            value={lesson.estimated_minutes}
                            onChange={(e) => updateLesson(idx, "estimated_minutes", parseInt(e.target.value) || 5)}
                            className="radia-input w-16 px-2 py-1.5 text-center text-sm text-slate-900 dark:text-slate-100"
                            min={1}
                          />
                          <span className="text-xs text-slate-400">min</span>
                          {newLessons.length > 1 && (
                            <button onClick={() => removeLesson(idx)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <DocEditor
                          value={lesson.content}
                          onChange={(val) => updateLesson(idx, "content", val)}
                          placeholder="Write lesson content here..."
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                  <button onClick={handleCreateCourse} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create Course</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  if (userLoading || dataLoading) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center text-sm text-slate-400">
        Loading onboarding...
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <GraduationCap className="h-7 w-7 text-slate-400 dark:text-slate-500" />
          </span>
          <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-slate-100">No onboarding courses yet</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {isCreator
              ? "Create your first onboarding course to help new team members get started."
              : "Your workspace admin hasn't created any onboarding courses yet. Check back later."}
          </p>
          {isCreator && (
            <button onClick={() => setShowCreate(true)} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700">
              <Plus className="h-4 w-4" />Create First Course
            </button>
          )}
        </div>
        {renderCreateModal()}
      </div>
    );
  }

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
        <div className="flex flex-shrink-0 gap-2">
          {isCreator && (
            <button onClick={() => setShowCreate(true)} className="rounded-lg border border-indigo-300 bg-white px-4 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-500/50 dark:bg-transparent dark:text-indigo-300 dark:hover:bg-indigo-500/10">
              <Plus className="inline h-4 w-4 mr-1" />New Course
            </button>
          )}
          <button onClick={handleResume} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700">
            {overallProgress >= 100 ? "Review" : "Resume"}
          </button>
        </div>
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

      {renderCreateModal()}

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
