"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Flag,
  MessageSquare,
  Plus,
  Send,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { api } from "@/lib/api";
import { getInitials, formatShortDate, getErrorMessage } from "@/lib/utils";
import type {
  Objective,
  ObjectiveStatus,
  Profile,
  Review,
  ReviewCycle,
  ReviewStatus,
  Skill,
} from "@/lib/types";
import { useToast } from "@/components/ui/toast";

type Tab = "okrs" | "cycles" | "reviews";

const statusColors: Record<ObjectiveStatus, string> = {
  on_track: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  at_risk: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  behind: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  completed: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
};

const statusLabels: Record<ObjectiveStatus, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  behind: "Behind",
  completed: "Completed",
};

const cycleStatusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  completed: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
};

const reviewStatusColors: Record<ReviewStatus, string> = {
  submitted: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  in_progress: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const ratingStars = [1, 2, 3, 4, 5];

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{pct}%</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex h-full flex-col gap-5" aria-label="Loading">
      <div className="h-8 w-48 rounded-lg bg-slate-100 dark:bg-slate-800" />
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 rounded-xl bg-slate-50 dark:bg-slate-800/50" />
      ))}
    </div>
  );
}

export function PerformanceContent() {
  const { profile, loading: userLoading, loadPerformanceData } = useUser();
  const { toast } = useToast();
  const isPrivileged = profile?.role === "creator" || profile?.role === "moderator";

  const [tab, setTab] = useState<Tab>("okrs");
  const [loading, setLoading] = useState(true);

  // Data
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Modals
  const [showOkrForm, setShowOkrForm] = useState(false);
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // OKR form
  const [okrTitle, setOkrTitle] = useState("");
  const [okrDesc, setOkrDesc] = useState("");
  const [okrMetric, setOkrMetric] = useState("");
  const [okrTarget, setOkrTarget] = useState("");
  const [okrOwner, setOkrOwner] = useState("");
  const [okrCycle, setOkrCycle] = useState("");

  // Cycle form
  const [cycleName, setCycleName] = useState("");
  const [cycleQuarter, setCycleQuarter] = useState("Q1 2026");
  const [cycleStart, setCycleStart] = useState("");
  const [cycleEnd, setCycleEnd] = useState("");

  // Review form
  const [reviewCycle, setReviewCycle] = useState("");
  const [reviewee, setReviewee] = useState("");

  // Feedback form
  const [fbRating, setFbRating] = useState(0);
  const [fbSummary, setFbSummary] = useState("");
  const [fbStrengths, setFbStrengths] = useState("");
  const [fbImprovements, setFbImprovements] = useState("");
  const [fbSkillGaps, setFbSkillGaps] = useState<{ skill_id: string; notes: string }[]>([]);

  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [objRes, revRes, profRes, skillRes] = await Promise.all([
        api<Objective[]>("/objectives"),
        api<{ cycles: ReviewCycle[]; reviews: Review[] }>("/reviews"),
        api<Profile[]>("/profiles"),
        api<{ skills: Skill[] }>("/skills"),
      ]);
      setObjectives(objRes);
      setCycles(revRes.cycles || []);
      setReviews(revRes.reviews || []);
      setProfiles(profRes);
      setSkills(skillRes.skills || []);
    } catch {
      toast("Failed to load performance data", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!userLoading && profile) {
      fetchData();
      loadPerformanceData();
    }
  }, [userLoading, profile, fetchData, loadPerformanceData]);

  // ── OKR creation ──
  async function createObjective() {
    if (!okrTitle.trim()) return;
    try {
      await api("/objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: okrTitle,
          description: okrDesc || undefined,
          metric: okrMetric || undefined,
          target_value: okrTarget ? parseFloat(okrTarget) : undefined,
          profile_id: okrOwner || undefined,
          review_cycle_id: okrCycle || undefined,
        }),
      });
      setShowOkrForm(false);
      setOkrTitle(""); setOkrDesc(""); setOkrMetric(""); setOkrTarget(""); setOkrOwner(""); setOkrCycle("");
      toast("Objective created", "success");
      fetchData();
    } catch (err) {
      toast(getErrorMessage(err, "Failed to create objective"), "error");
    }
  }

  async function updateObjectiveStatus(id: string, status: ObjectiveStatus) {
    try {
      await api("/objectives", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchData();
    } catch (err) {
      toast(getErrorMessage(err, "Update failed"), "error");
    }
  }

  async function updateObjectiveProgress(id: string, current_value: number) {
    try {
      await api("/objectives", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, current_value }),
      });
      fetchData();
    } catch (err) {
      toast(getErrorMessage(err, "Update failed"), "error");
    }
  }

  // ── Cycle creation ──
  async function createCycle() {
    if (!cycleName.trim() || !cycleStart || !cycleEnd) return;
    try {
      await api("/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_cycle",
          name: cycleName,
          quarter: cycleQuarter,
          start_date: cycleStart,
          end_date: cycleEnd,
        }),
      });
      setShowCycleForm(false);
      setCycleName(""); setCycleStart(""); setCycleEnd("");
      toast("Review cycle created", "success");
      fetchData();
    } catch (err) {
      toast(getErrorMessage(err, "Failed to create cycle"), "error");
    }
  }

  async function updateCycleStatus(id: string, status: string) {
    try {
      await api("/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_cycle", id, status }),
      });
      fetchData();
    } catch (err) {
      toast(getErrorMessage(err, "Update failed"), "error");
    }
  }

  // ── Review creation ──
  async function createReview() {
    if (!reviewCycle || !reviewee) return;
    try {
      await api("/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_cycle_id: reviewCycle, reviewee_id: reviewee }),
      });
      setShowReviewForm(false);
      setReviewCycle(""); setReviewee("");
      toast("Review assigned", "success");
      fetchData();
    } catch (err) {
      toast(getErrorMessage(err, "Failed to create review"), "error");
    }
  }

  // ── Submit feedback (with skill gaps → LMS bridge) ──
  async function submitFeedback() {
    if (!editingReview || fbRating === 0) return;
    try {
      await api("/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingReview.id,
          rating: fbRating,
          summary: fbSummary,
          strengths: fbStrengths,
          improvements: fbImprovements,
          skill_gaps: fbSkillGaps.filter(g => g.skill_id),
        }),
      });
      setEditingReview(null);
      setFbRating(0); setFbSummary(""); setFbStrengths(""); setFbImprovements("");
      setFbSkillGaps([]);
      toast("Review submitted — any skill gaps will trigger LMS recommendations", "success");
      fetchData();
    } catch (err) {
      toast(getErrorMessage(err, "Failed to submit review"), "error");
    }
  }

  function openFeedbackForm(review: Review) {
    setEditingReview(review);
    setFbRating(review.rating || 0);
    setFbSummary(review.summary || "");
    setFbStrengths(review.strengths || "");
    setFbImprovements(review.improvements || "");
    setFbSkillGaps([]);
  }

  if (userLoading || loading) return <Skeleton />;

  const tabs: { key: Tab; label: string; icon: typeof Target; count: number }[] = [
    { key: "okrs", label: "OKRs", icon: Target, count: objectives.length },
    { key: "cycles", label: "Review Cycles", icon: BarChart3, count: cycles.length },
    { key: "reviews", label: "Reviews", icon: MessageSquare, count: reviews.length },
  ];

  // Stats
  const onTrack = objectives.filter(o => o.status === "on_track").length;
  const atRisk = objectives.filter(o => o.status === "at_risk").length;
  const completedObj = objectives.filter(o => o.status === "completed").length;
  const activeCycles = cycles.filter(c => c.status === "active").length;

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Performance</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">OKRs, reviews, and skill development</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowOkrForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> New OKR
          </button>
          {isPrivileged && (
            <button onClick={() => setShowCycleForm(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              <Plus className="h-4 w-4" /> New Cycle
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "On Track", value: onTrack, color: "text-emerald-600 dark:text-emerald-400", icon: TrendingUp },
          { label: "At Risk", value: atRisk, color: "text-amber-600 dark:text-amber-400", icon: Flag },
          { label: "Completed", value: completedObj, color: "text-indigo-600 dark:text-indigo-400", icon: Award },
          { label: "Active Cycles", value: activeCycles, color: "text-sky-600 dark:text-sky-400", icon: Users },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</span>
            </div>
            <p className={`mt-1 text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold dark:bg-slate-600">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ═══ OKRs Tab ═══ */}
      {tab === "okrs" && (
        <div className="space-y-3">
          {objectives.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <Target className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">No objectives yet</p>
              <button onClick={() => setShowOkrForm(true)} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                Create your first OKR
              </button>
            </div>
          ) : (
            objectives.map(obj => (
              <motion.div key={obj.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{obj.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[obj.status]}`}>
                        {statusLabels[obj.status]}
                      </span>
                    </div>
                    {obj.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{obj.description}</p>}
                  </div>
                  {obj.owner && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white">
                        {getInitials(obj.owner.first_name ?? "", obj.owner.last_name ?? "")}
                      </div>
                      {obj.owner.first_name}
                    </div>
                  )}
                </div>

                {obj.target_value != null && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{obj.metric || "Progress"}</span>
                      <span>{obj.current_value} / {obj.target_value}</span>
                    </div>
                    <ProgressBar value={obj.current_value} max={obj.target_value} />
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {obj.target_value != null && (
                    <input
                      type="number"
                      min={0}
                      max={obj.target_value}
                      placeholder="Update progress"
                      className="w-28 rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const v = parseFloat((e.target as HTMLInputElement).value);
                          if (!isNaN(v)) { updateObjectiveProgress(obj.id, v); (e.target as HTMLInputElement).value = ""; }
                        }
                      }}
                    />
                  )}
                  <select
                    value={obj.status}
                    onChange={e => updateObjectiveStatus(obj.id, e.target.value as ObjectiveStatus)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ═══ Review Cycles Tab ═══ */}
      {tab === "cycles" && (
        <div className="space-y-3">
          {cycles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <BarChart3 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">No review cycles yet</p>
              {isPrivileged && (
                <button onClick={() => setShowCycleForm(true)} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  Create first cycle
                </button>
              )}
            </div>
          ) : (
            cycles.map(cycle => {
              const cycleReviews = reviews.filter(r => r.review_cycle_id === cycle.id);
              const isExpanded = expandedCycle === cycle.id;
              return (
                <motion.div key={cycle.id} layout className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <button onClick={() => setExpandedCycle(isExpanded ? null : cycle.id)}
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">{cycle.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{cycle.quarter} &middot; {formatShortDate(cycle.start_date)} &ndash; {formatShortDate(cycle.end_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {(cycle.completed_count as number) || 0}/{(cycle.review_count as number) || 0} submitted
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cycleStatusColors[cycle.status]}`}>
                        {cycle.status}
                      </span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
                      >
                        <div className="space-y-2 p-5 pt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Reviews</p>
                            <div className="flex gap-2">
                              {isPrivileged && cycle.status === "draft" && (
                                <button onClick={() => updateCycleStatus(cycle.id, "active")}
                                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">Activate</button>
                              )}
                              {isPrivileged && cycle.status === "active" && (
                                <>
                                  <button onClick={() => { setReviewCycle(cycle.id); setShowReviewForm(true); }}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">+ Assign Review</button>
                                  <button onClick={() => updateCycleStatus(cycle.id, "completed")}
                                    className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400">Complete Cycle</button>
                                </>
                              )}
                            </div>
                          </div>

                          {cycleReviews.length === 0 ? (
                            <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">No reviews assigned to this cycle</p>
                          ) : (
                            cycleReviews.map(rev => (
                              <div key={rev.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                                    {getInitials(
                                      rev.reviewee?.first_name ?? "",
                                      rev.reviewee?.last_name ?? ""
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {rev.reviewee?.first_name} {rev.reviewee?.last_name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Reviewer: {rev.reviewer?.first_name} {rev.reviewer?.last_name}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {rev.rating && (
                                    <div className="flex items-center gap-0.5">
                                      {ratingStars.map(s => (
                                        <Star key={s} className={`h-3 w-3 ${s <= rev.rating! ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                                      ))}
                                    </div>
                                  )}
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${reviewStatusColors[rev.status]}`}>
                                    {rev.status}
                                  </span>
                                  {rev.status !== "submitted" && (
                                    <button onClick={() => openFeedbackForm(rev)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                                      Write Feedback
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ Reviews Tab (flat list) ═══ */}
      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">No reviews yet</p>
            </div>
          ) : (
            reviews.map(rev => (
              <motion.div key={rev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                      {getInitials(
                        rev.reviewee?.first_name ?? "",
                        rev.reviewee?.last_name ?? ""
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {rev.reviewee?.first_name} {rev.reviewee?.last_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Reviewed by {rev.reviewer?.first_name} {rev.reviewer?.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rev.rating && (
                      <div className="flex items-center gap-0.5">
                        {ratingStars.map(s => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= rev.rating! ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {rev.summary && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{rev.summary}</p>}
                {rev.strengths && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Strengths</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{rev.strengths}</p>
                  </div>
                )}
                {rev.improvements && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Areas for Improvement</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{rev.improvements}</p>
                  </div>
                )}
                {rev.status !== "submitted" && (
                  <button onClick={() => openFeedbackForm(rev)} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    <Send className="h-3.5 w-3.5" /> Write Feedback
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ═══ Modal: New OKR ═══ */}
      <AnimatePresence>
        {showOkrForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowOkrForm(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">New Objective</h2>
                <button onClick={() => setShowOkrForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 space-y-3">
                <input value={okrTitle} onChange={e => setOkrTitle(e.target.value)} placeholder="Objective title"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                <textarea value={okrDesc} onChange={e => setOkrDesc(e.target.value)} placeholder="Description (optional)" rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={okrMetric} onChange={e => setOkrMetric(e.target.value)} placeholder="Metric (e.g. Revenue)"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                  <input value={okrTarget} onChange={e => setOkrTarget(e.target.value)} placeholder="Target value" type="number"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
                <select value={okrOwner} onChange={e => setOkrOwner(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">Owner (self)</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
                <select value={okrCycle} onChange={e => setOkrCycle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">Link to cycle (optional)</option>
                  {cycles.map(c => <option key={c.id} value={c.id}>{c.name} — {c.quarter}</option>)}
                </select>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setShowOkrForm(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                <button onClick={createObjective} disabled={!okrTitle.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Modal: New Cycle ═══ */}
      <AnimatePresence>
        {showCycleForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCycleForm(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">New Review Cycle</h2>
                <button onClick={() => setShowCycleForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 space-y-3">
                <input value={cycleName} onChange={e => setCycleName(e.target.value)} placeholder="Cycle name (e.g. Q2 Performance Review)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                <select value={cycleQuarter} onChange={e => setCycleQuarter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"].map(q => <option key={q} value={q}>{q}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Start</label>
                    <input value={cycleStart} onChange={e => setCycleStart(e.target.value)} type="date"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">End</label>
                    <input value={cycleEnd} onChange={e => setCycleEnd(e.target.value)} type="date"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setShowCycleForm(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                <button onClick={createCycle} disabled={!cycleName.trim() || !cycleStart || !cycleEnd} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Modal: Assign Review ═══ */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowReviewForm(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Assign Review</h2>
                <button onClick={() => setShowReviewForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 space-y-3">
                <select value={reviewCycle} onChange={e => setReviewCycle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">Select cycle</option>
                  {cycles.filter(c => c.status === "active").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={reviewee} onChange={e => setReviewee(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">Select employee to review</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setShowReviewForm(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                <button onClick={createReview} disabled={!reviewCycle || !reviewee} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Assign</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Modal: Write Feedback (with skill-gap flagging) ═══ */}
      <AnimatePresence>
        {editingReview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setEditingReview(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Review: {(editingReview.reviewee as unknown as Profile)?.first_name} {(editingReview.reviewee as unknown as Profile)?.last_name}
                </h2>
                <button onClick={() => setEditingReview(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
              </div>

              <div className="mt-4 space-y-4">
                {/* Rating */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Rating</label>
                  <div className="flex gap-1">
                    {ratingStars.map(s => (
                      <button key={s} onClick={() => setFbRating(s)} className="p-0.5">
                        <Star className={`h-6 w-6 transition-colors ${s <= fbRating ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-300 dark:text-slate-600"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea value={fbSummary} onChange={e => setFbSummary(e.target.value)} placeholder="Overall summary" rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                <textarea value={fbStrengths} onChange={e => setFbStrengths(e.target.value)} placeholder="Key strengths" rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                <textarea value={fbImprovements} onChange={e => setFbImprovements(e.target.value)} placeholder="Areas for improvement" rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />

                {/* Skill gap flagging → LMS bridge */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Flag Skill Gaps (auto-assigns LMS courses)</p>
                  {fbSkillGaps.map((gap, i) => (
                    <div key={i} className="mt-2 flex gap-2">
                      <select value={gap.skill_id} onChange={e => {
                        const updated = [...fbSkillGaps];
                        updated[i] = { ...gap, skill_id: e.target.value };
                        setFbSkillGaps(updated);
                      }} className="flex-1 rounded-md border border-amber-200 bg-white px-2 py-1 text-xs dark:border-amber-500/30 dark:bg-slate-800 dark:text-slate-200">
                        <option value="">Select skill</option>
                        {skills.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                      </select>
                      <input value={gap.notes} onChange={e => {
                        const updated = [...fbSkillGaps];
                        updated[i] = { ...gap, notes: e.target.value };
                        setFbSkillGaps(updated);
                      }} placeholder="Notes" className="flex-1 rounded-md border border-amber-200 bg-white px-2 py-1 text-xs dark:border-amber-500/30 dark:bg-slate-800 dark:text-slate-200" />
                      <button onClick={() => setFbSkillGaps(fbSkillGaps.filter((_, j) => j !== i))} className="text-amber-500 hover:text-amber-700 dark:text-amber-400">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setFbSkillGaps([...fbSkillGaps, { skill_id: "", notes: "" }])}
                    className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400">
                    + Add skill gap
                  </button>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setEditingReview(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                <button onClick={submitFeedback} disabled={fbRating === 0} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  <Send className="h-4 w-4" /> Submit Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
