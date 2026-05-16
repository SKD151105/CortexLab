import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Spinner from "../../components/common/Spinner.jsx";
import progressService from "../../services/progressService.js";
import {
  FileText,
  BookOpen,
  BrainCircuit,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { queryKeys } from "../../lib/queryKeys.js";
import { formatDateTime } from "../../utils/date.js";

const DashboardPage = () => {
  const {
    data: dashboardData,
    isLoading: loading,
  } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: progressService.getDashboardData,
  });

  const recentActivities = useMemo(() => {
    if (!dashboardData?.recentActivity) {
      return [];
    }

    return [
      ...(dashboardData.recentActivity.documents || []).map((doc) => ({
        id: doc._id,
        description: doc.title,
        timestamp: doc.lastAccessed,
        link: `/documents/${doc._id}`,
        type: "document",
      })),
      ...(dashboardData.recentActivity.quizzes || []).map((quiz) => ({
        id: quiz._id,
        description: quiz.title,
        timestamp: quiz.completedAt,
        link: `/quizzes/${quiz._id}/results`,
        type: "quiz",
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [dashboardData]);

  if (loading) {
    return <Spinner />;
  }

  if (!dashboardData || !dashboardData.overview) {
    return (
      <div className="">
        <div className="">
          <div className="">
            <TrendingUp className="" />
          </div>
          <p className="">No dashboard data available</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Documents",
      value: dashboardData.overview.totalDocuments,
      icon: FileText,
      gradient: "from-blue-400 to-cyan-500",
      shadowColor: "shadow-blue-500/25",
      accent: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      label: "Total Flashcards",
      value: dashboardData.overview.totalFlashcards,
      icon: BookOpen,
      gradient: "from-purple-400 to-pink-500",
      shadowColor: "shadow-indigo-500/25",
      accent: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
    },
    {
      label: "Total Quizzes",
      value: dashboardData.overview.totalQuizzes,
      icon: BrainCircuit,
      gradient: "from-indigo-400 to-violet-500",
      shadowColor: "shadow-indigo-500/25",
      accent: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
  ];

  const totalResources =
    dashboardData.overview.totalDocuments +
    dashboardData.overview.totalFlashcards +
    dashboardData.overview.totalQuizzes;

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(#dbe4ff_1px,transparent_1px)] bg-size-[16px_16px] opacity-40 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(238,242,255,0.9),rgba(255,255,255,0))] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-[28px] border border-indigo-100/80 bg-white/80 px-6 py-6 shadow-[0_20px_60px_rgba(99,102,241,0.10)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
                Learning overview
              </div>
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">
                Dashboard
              </h1>
              <p className="max-w-2xl text-sm text-slate-500 sm:text-base">
                Track your learning progress, review your recent activity, and
                keep momentum across documents, flashcards, and quizzes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Total items
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {totalResources}
                </p>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-[linear-gradient(135deg,rgba(238,242,255,0.95),rgba(245,243,255,0.95))] px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-500">
                  Recent updates
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {recentActivities.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-100/60"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(99,102,241,0),rgba(99,102,241,0.35),rgba(168,85,247,0))]" />
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {stat.label}
                  </span>
                  <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                    {stat.value}
                  </div>
                  <span
                    className={`mt-4 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stat.accent}`}
                  >
                    Active now
                  </span>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${stat.gradient} shadow-lg ${stat.shadowColor} transition-transform duration-300 group-hover:scale-110`}
                >
                  <stat.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="rounded-[28px] border border-slate-200/70 bg-white/80 p-8 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(238,242,255,1),rgba(245,243,255,1))]">
              <Clock className="w-5 h-5 text-slate-600" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xl font-medium text-slate-900 tracking-tight">
                  Recent Activity
                </h3>
                <p className="text-sm text-slate-500">
                  Your latest learning actions in one place
                </p>
              </div>
            </div>
            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 sm:block">
              {recentActivities.length} items
            </div>
          </div>

          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 transition-all duration-200 hover:border-indigo-100 hover:bg-white hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          activity.type === "document"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {activity.type === "document" ? "Document" : "Quiz"}
                      </span>
                    </div>
                    <p className="truncate text-sm font-medium text-slate-900 sm:text-[15px]">
                      {activity.type === "document"
                        ? "Accessed "
                        : "Attempted "}
                      <span className="text-slate-700">
                        {activity.description}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                  {activity.link && (
                    <a
                      href={activity.link}
                      className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-700 whitespace-nowrap"
                    >
                      View
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[linear-gradient(135deg,rgba(238,242,255,1),rgba(245,243,255,1))] mb-4">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">No recent activity yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Start learning to see your progress here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

