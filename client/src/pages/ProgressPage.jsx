import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BookOpenCheck, ChartNoAxesCombined, CircleHelp, ClipboardCheck, Clock3, Dumbbell, Target, TrendingUp } from 'lucide-react';
import { getAssessmentResults, getMyProfile, getPlanHistory, getPracticeSessions } from '../services/api';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const scoreLabel = (score) => score >= 75 ? 'Strong' : score >= 50 ? 'Developing' : 'Focus area';

export default function ProgressPage() {
  const [data, setData] = useState({ profile: null, attempt: null, tasks: [], sessions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([getMyProfile(), getAssessmentResults(), getPlanHistory(), getPracticeSessions()]).then(([profile, assessment, history, practice]) => {
      if (!active) return;
      const next = { profile: null, attempt: null, tasks: [], sessions: [] };
      if (profile.status === 'fulfilled') next.profile = profile.value.profile;
      if (assessment.status === 'fulfilled') next.attempt = assessment.value.attempt;
      if (history.status === 'fulfilled') next.tasks = history.value.tasks || [];
      if (practice.status === 'fulfilled') next.sessions = practice.value.sessions || [];
      if ([profile, history, practice].every((item) => item.status === 'rejected')) setError('Progress data could not be loaded. Please try again.');
      setData(next);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="flex min-h-[45vh] items-center justify-center text-sm text-slate-400"><span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />Loading your saved progress…</div>;
  const { profile, attempt, tasks, sessions } = data;
  const hasAssessment = profile?.readinessScore != null;
  const completedSessions = sessions.filter((session) => session.status === 'completed');
  const scoredSessions = completedSessions.filter((session) => typeof session.overallScore === 'number');
  const completedTasks = tasks.length;
  const skillScores = hasAssessment ? Object.entries(profile.categoryScores || {}).filter(([, score]) => Number.isFinite(score)).sort((a, b) => a[1] - b[1]) : [];
  const metrics = [
    { label: 'Readiness', value: hasAssessment ? `${profile.readinessScore}%` : '—', note: hasAssessment ? 'Latest assessed score' : 'Assessment not completed', icon: Target },
    { label: 'Plan tasks', value: completedTasks, note: 'Saved completed tasks', icon: BookOpenCheck },
    { label: 'Practice sessions', value: completedSessions.length, note: `${scoredSessions.length} with evaluation scores`, icon: Dumbbell },
  ];

  return <div className="mx-auto max-w-6xl space-y-7">
    <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="pv-label mb-2 flex items-center gap-2"><ChartNoAxesCombined className="h-3.5 w-3.5 text-violet-300" />Progress</p><h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Your preparation, in view</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">A record of assessment, completed plan work, and practice saved to your account.</p></div>
      <Link to="/assessment"><Button variant="secondary" className="gap-2">{hasAssessment ? 'Retake assessment' : 'Start assessment'}<ArrowRight className="h-4 w-4" /></Button></Link>
    </header>
    {error && <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}
    <section aria-label="Progress summary" className="grid gap-3 sm:grid-cols-3">{metrics.map(({ label, value, note, icon: Icon }) => <Card key={label} className="border-slate-800 bg-slate-900/50"><CardContent className="flex items-start justify-between p-5"><div><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p></div><span className="rounded-lg border border-violet-300/15 bg-violet-300/[.07] p-2 text-violet-200"><Icon className="h-4 w-4" /></span></CardContent></Card>)}</section>
    <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <Card className="border-slate-800 bg-slate-900/50"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-violet-300" />Assessed skills</CardTitle></CardHeader><CardContent className="space-y-4">
        {skillScores.length ? skillScores.map(([name, score]) => <div key={name}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="text-sm text-slate-300">{name.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</span><span className="text-xs text-slate-500">{score}% · {scoreLabel(score)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-violet-400" style={{ width: `${Math.max(0, Math.min(score, 100))}%` }} /></div></div>) : <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center"><CircleHelp className="mx-auto h-5 w-5 text-slate-500" /><p className="mt-3 text-sm font-medium text-slate-300">No assessment results yet</p><p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">Complete the diagnostic to see skill evidence here. We won’t estimate unassessed scores.</p><Link to="/assessment" className="mt-4 inline-block"><Button variant="outline" size="sm">Take assessment</Button></Link></div>}
      </CardContent></Card>
      <Card className="border-slate-800 bg-slate-900/50"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-violet-300" />Latest diagnostic</CardTitle></CardHeader><CardContent>{attempt ? <div className="space-y-4"><div className="flex items-end justify-between border-b border-slate-800 pb-4"><div><p className="text-3xl font-semibold text-white">{attempt.score}<span className="text-sm font-normal text-slate-500"> / 100</span></p><p className="mt-1 text-xs text-slate-500">{attempt.correctCount} of {attempt.totalQuestions} correct</p></div><p className="text-right text-[11px] text-slate-500">{attempt.createdAt ? new Date(attempt.createdAt).toLocaleDateString() : 'Most recent attempt'}</p></div><p className="text-xs leading-relaxed text-slate-400">{attempt.createdAt ? 'This is your latest recorded assessment. Historical score comparisons are not available yet.' : 'Latest recorded assessment result.'}</p></div> : <p className="text-sm text-slate-500">No assessment attempt has been saved yet.</p>}</CardContent></Card>
    </section>
    <section className="grid gap-5 lg:grid-cols-2">
      <Card className="border-slate-800 bg-slate-900/50"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpenCheck className="h-4 w-4 text-violet-300" />Completed preparation</CardTitle></CardHeader><CardContent>{tasks.length ? <div className="space-y-2">{tasks.slice(0, 6).map((task) => <div key={task._id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div><p className="text-sm font-medium text-slate-200">{task.title}</p><p className="mt-1 text-[11px] text-slate-500">{task.category} · {task.estimatedTimeMinutes} min · {task.priority} priority</p></div><span className="whitespace-nowrap text-[10px] text-slate-500">{task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''}</span></div>)}</div> : <p className="text-sm text-slate-500">Completed plan work will be recorded here.</p>}</CardContent></Card>
      <Card className="border-slate-800 bg-slate-900/50"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-violet-300" />Practice record</CardTitle></CardHeader><CardContent>{completedSessions.length ? <div className="space-y-2">{completedSessions.slice(0, 6).map((session) => <div key={session._id || session.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div><p className="text-sm font-medium text-slate-200">{session.category} · {session.difficulty}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="h-3 w-3" />{session.durationMinutes} minutes · {session.completedAt ? new Date(session.completedAt).toLocaleDateString() : 'Completed'}</p></div><span className="text-sm font-medium text-slate-300">{typeof session.overallScore === 'number' ? `${session.overallScore}%` : 'Evaluated'}</span></div>)}</div> : <div><p className="text-sm text-slate-500">Your completed practice sessions will appear here.</p><Link to="/practice" className="mt-3 inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200">Start a practice session <ArrowRight className="h-3 w-3" /></Link></div>}</CardContent></Card>
    </section>
    <p className="text-center text-[11px] text-slate-600">Progress reflects records available in your account. Readiness changes only after a completed assessment.</p>
  </div>;
}
