import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getMyProfile, getTodaysPlan, completeTask, getPlanHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowRight,
  RefreshCw,
  Target,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  Clock,
  Check,
  ChevronRight,
  HelpCircle,
  History,
  Zap,
} from 'lucide-react';

export const DashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [recentNotification, setRecentNotification] = useState(null);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, planRes, historyRes] = await Promise.all([
        getMyProfile(),
        getTodaysPlan().catch((err) => {
          setError(err.message || 'Could not load today’s preparation plan.');
          return null;
        }),
        getPlanHistory().catch(() => null),
      ]);

      if (profileRes.success) {
        setProfile(profileRes.profile);
      }
      if (planRes && planRes.success) {
        setPlanData(planRes);
      }
      if (historyRes && historyRes.success) {
        setHistoryTasks(historyRes.tasks || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load placement dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCompleteTask = async (taskId) => {
    setCompletingTaskId(taskId);
    setRecentNotification(null);
    try {
      const data = await completeTask(taskId);
      if (data.success) {
        // Update local tasks state
        setPlanData((prev) => {
          if (!prev) return prev;
          const updatedTasks = prev.tasks.map((t) =>
            t._id === taskId ? { ...t, status: 'completed', completedAt: new Date() } : t
          );
          const completedCount = updatedTasks.filter((t) => t.status === 'completed').length;
          return {
            ...prev,
            tasks: updatedTasks,
            stats: {
              ...prev.stats,
              completedTasks: completedCount,
              percentComplete: Math.round((completedCount / updatedTasks.length) * 100),
            },
          };
        });

        // Update persisted task count; completing practice does not change assessment scores.
        if (data.profile) {
          setProfile(data.profile);
        }

        setRecentNotification({
          message: 'Task completed and saved to your practice history.',
        });

        // Refresh completed history
        const updatedHistory = await getPlanHistory().catch(() => null);
        if (updatedHistory?.success) {
          setHistoryTasks(updatedHistory.tasks || []);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to complete task');
    } finally {
      setCompletingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Synthesizing personal preparation plan...</p>
      </div>
    );
  }

  const hasScore = profile && profile.readinessScore !== null && profile.readinessScore !== undefined;

  // Category Color Map
  const getCategoryStyles = (cat) => {
    const c = (cat || '').toUpperCase();
    if (c === 'DSA') return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    if (c === 'DBMS') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (c === 'OS') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (c === 'NETWORKING') return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    if (c === 'OOP') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  // Score Tier details
  const getScoreTier = (score) => {
    if (score >= 80) {
      return {
        label: 'Placement Ready',
        color: 'text-brand-400',
        bg: 'bg-brand-500/10 border-brand-500/30',
        desc: 'High baseline. Focus on system design and top company tagged questions.',
      };
    }
    if (score >= 60) {
      return {
        label: 'Developing Readiness',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        desc: 'Solid core knowledge. Targeted practice in identified gaps will push you into top placement tiers.',
      };
    }
    return {
      label: 'Foundation Phase',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/30',
      desc: 'Focus on core CS theory and consistent standard DSA problem-solving patterns.',
    };
  };

  const tier = hasScore ? getScoreTier(profile.readinessScore) : null;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[11px] font-mono text-brand-400 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Placement Intelligence Operating System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {user?.name || 'Student'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Targeting{' '}
            <span className="text-slate-200 font-medium">
              {profile?.targetRole || 'Software Development Engineer'}
            </span>{' '}
            • Batch of {profile?.graduationYear || '2026'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            title="Refresh Data"
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync</span>
          </Button>
          <Link to="/assessment">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{hasScore ? 'Retake Test' : 'Diagnostic Test'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Completion Toast Notification */}
      {recentNotification && (
        <div className="p-4 rounded-xl bg-brand-500/15 border border-brand-500/40 text-brand-300 text-xs flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-brand-500 text-slate-950 flex items-center justify-center font-bold">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-medium text-slate-100">{recentNotification.message}</span>
          </div>
          <button
            onClick={() => setRecentNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* If No Assessment Done Callout */}
      {!hasScore && (
        <Card className="border-brand-500/30 bg-brand-500/5 backdrop-blur-md p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/30 flex items-center justify-center mx-auto">
            <Target className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white">Diagnostic Assessment Pending</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete your technical diagnostic test to initialize your real Placement Readiness Score and unlock your personalized daily preparation plan.
            </p>
          </div>
          <div>
            <Link to="/assessment">
              <Button variant="primary" size="md" className="gap-2 font-bold shadow-md">
                <span>Start Diagnostic Assessment</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Stat Row */}
      {hasScore && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">READINESS SCORE</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {profile.readinessScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
              <span className="text-[10px] font-mono text-brand-400 ml-auto">Assessment based</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">TODAY'S PLAN PROGRESS</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {planData?.stats?.completedTasks || 0} / {planData?.stats?.totalTasks || 0}
              </span>
              <span className="text-xs text-slate-400 font-mono">Tasks</span>
              <span className="text-[10px] font-mono text-sky-400 ml-auto">
                {planData?.stats?.percentComplete || 0}%
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">ALL-TIME COMPLETED</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {profile.tasksCompletedCount || 0}
              </span>
              <span className="text-xs text-slate-400">Tasks</span>
              <span className="text-[10px] font-mono text-emerald-400 ml-auto">Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* CORE ENGINE FEATURE: Today's Preparation Plan */}
      {hasScore && planData && (
        <Card className="border-brand-500/30 bg-slate-900/70 shadow-2xl backdrop-blur-md">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center">
                    <Target className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-lg text-white">Today's Preparation Plan</CardTitle>
                </div>
                <CardDescription className="mt-1">
                  Generated by your deterministic preparation engine to answer: "What should I prepare next?"
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-mono text-slate-300">
                    {planData.stats.completedTasks} of {planData.stats.totalTasks} completed
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {planData.stats.totalMinutes} of {(profile.dailyPrepTimeHours || 0) * 60} mins planned
                  </p>
                </div>
                <div className="w-24 sm:w-32 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="bg-brand-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${planData.stats.percentComplete}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-5">
            {planData.tasks?.length === 0 && (
              <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                No new recommendations are available for today. Your completed practice is saved in history.
              </p>
            )}
            {planData.tasks?.map((task, idx) => {
              const isCompleted = task.status === 'completed';
              const isCurrentAction = completingTaskId === task._id;

              return (
                <div
                  key={task._id || idx}
                  className={`p-4 sm:p-5 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left: Task Details */}
                    <div className="space-y-2.5 flex-1">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getCategoryStyles(
                            task.category
                          )}`}
                        >
                          {task.category}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                          {task.difficulty}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                          <Clock className="h-3 w-3" /> {task.estimatedTimeMinutes} mins
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${task.priority === 'High' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {task.priority} priority
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        className={`text-sm sm:text-base font-semibold ${
                          isCompleted ? 'text-slate-400 line-through' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h3>

                      {/* Explainable Reason Callout */}
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-400" />
                        <div>
                          <strong className="text-amber-200">Why this task: </strong>
                          {task.reason}
                        </div>
                      </div>

                      {/* Action Tip */}
                      <p className="text-xs text-slate-400 leading-relaxed">
                        <span className="text-slate-300 font-medium">Actionable Goal: </span>
                        {task.actionTip}
                      </p>
                    </div>

                    {/* Right: Checkbox / Action Button */}
                    <div className="shrink-0 self-end sm:self-center">
                      <div className="flex flex-col items-end gap-2">
                        <Link to={`/practice?category=${encodeURIComponent(['DSA', 'DBMS', 'OS', 'Networking', 'OOP', 'Interview'].includes(task.category) ? task.category : 'Interview')}`}>
                          <Button variant="secondary" size="sm" className="gap-2 text-xs">Practice now</Button>
                        </Link>
                        {isCompleted ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Completed</span>
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCompleteTask(task._id)}
                            isLoading={isCurrentAction}
                            className="gap-2 text-xs font-semibold"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Mark as Completed</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>

          <CardFooter className="justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/80 font-mono">
            <span>DETERMINISTIC ENGINE: Skill Gap Weighting</span>
            <span className="text-brand-400 font-semibold">Assessment based readiness</span>
          </CardFooter>
        </Card>
      )}

      {/* Placement Readiness Score & Skill Breakdown */}
      {hasScore && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Readiness Score Meter */}
          <Card className="lg:col-span-1 border-slate-800 bg-slate-900/60 shadow-xl flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-brand-500" />
                  Readiness Score
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${tier.bg} ${tier.color}`}>
                  {tier.label}
                </span>
              </CardTitle>
              <CardDescription>
                Dynamically calculated from assessment baseline and completed practice tasks
              </CardDescription>
            </CardHeader>

            <CardContent className="py-6 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke="#1e293b"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke="#22c55e"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="326.72"
                    strokeDashoffset={326.72 * (1 - profile.readinessScore / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                    {profile.readinessScore}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    out of 100
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center mt-4 px-2 leading-relaxed">
                {tier.desc}
              </p>
            </CardContent>

            <CardFooter className="pt-3 border-t border-slate-800/80 justify-between text-[11px] text-slate-500 font-mono">
              <span>ALGORITHM: Grounded Weighted</span>
              <span className="text-brand-400">Assessment based</span>
            </CardFooter>
          </Card>

          {/* Comprehensive Skill Breakdown */}
          <Card className="lg:col-span-2 border-slate-800 bg-slate-900/60 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sky-400" />
                Comprehensive Skill Breakdown
              </CardTitle>
              <CardDescription>
                Scores reflect your latest diagnostic assessment
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              {[
                { key: 'dsa', label: 'Data Structures & Algorithms', desc: 'LeetCode patterns, complexity' },
                { key: 'oop', label: 'OOP & Software Fundamentals', desc: 'SOLID, polymorphism, design' },
                { key: 'dbms', label: 'Database Systems (DBMS)', desc: 'ACID, indexing, SQL queries' },
                { key: 'os', label: 'Operating Systems', desc: 'Processes, concurrency, virtual memory' },
                { key: 'networking', label: 'Computer Networks', desc: 'TCP/IP, HTTP/REST, protocols' },
              ].map(({ key, label, desc }) => {
                const score = profile.categoryScores?.[key] || 0;
                let colorClass = 'bg-brand-500';
                let textColor = 'text-brand-400';
                if (score < 55) {
                  colorClass = 'bg-rose-500';
                  textColor = 'text-rose-400';
                } else if (score < 70) {
                  colorClass = 'bg-amber-500';
                  textColor = 'text-amber-400';
                }

                return (
                  <div key={key} className="space-y-1.5 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">{label}</span>
                        <span className="text-[11px] text-slate-500 hidden sm:inline ml-2">
                          ({desc})
                        </span>
                      </div>
                      <span className={`font-mono font-bold ${textColor}`}>{score}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/80">
                      <div
                        className={`${colorClass} h-full rounded-full transition-all duration-700`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </CardContent>

            <CardFooter className="pt-3 border-t border-slate-800/80 justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-500"></span> Strong (≥70%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span> Developing (55-69%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span> Needs Attention (&lt;55%)
              </span>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Strong & Weak Areas Summary */}
      {hasScore && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strong Areas */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Strong Competencies
              </CardTitle>
              <CardDescription>
                Topics where you demonstrated high placement proficiency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.strongAreas?.length > 0 ? (
                profile.strongAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{area}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Complete daily tasks to graduate subjects into strong competencies.</p>
              )}
            </CardContent>
          </Card>

          {/* Weak Areas */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Identified Improvement Areas
              </CardTitle>
              <CardDescription>
                Current technical bottlenecks targeted by today's preparation plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.weakAreas?.length > 0 ? (
                profile.weakAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-2"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{area}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                  No critical deficiencies remaining! Maintain consistency on daily tasks.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Completed Tasks History Section */}
      {hasScore && historyTasks.length > 0 && (
        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-slate-200">
                <History className="h-4 w-4 text-brand-500" />
                Completed Tasks History
              </CardTitle>
              <span className="text-xs font-mono text-slate-400">
                {historyTasks.length} Completed Total
              </span>
            </div>
            <CardDescription>
              Persisted record of completed placement practice modules
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2.5">
            {historyTasks.slice(0, 5).map((task) => (
              <div
                key={task._id}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200">{task.title}</span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      ({task.category} • {task.estimatedTimeMinutes} mins)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    {task.priority} priority
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    {new Date(task.completedAt || task.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
