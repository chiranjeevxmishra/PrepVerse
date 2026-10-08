import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BookOpenCheck, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, Circle, ClipboardCheck, Clock3, Dumbbell, RefreshCw, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { completeTask, getMyProfile, getPlanHistory, getPracticeSessions, getTodaysPlan } from '../services/api';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import ProgressRing from '../components/ui/ProgressRing';

const prettySkill = (key) => ({ dsa: 'Data structures & algorithms', dbms: 'Databases', oop: 'Object-oriented programming', os: 'Operating systems', networking: 'Networking', fundamentals: 'Fundamentals' }[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()));
const priorityClass = (priority) => priority === 'High' ? 'text-amber-200 bg-amber-300/[.08] border-amber-300/15' : priority === 'Medium' ? 'text-violet-200 bg-violet-300/[.08] border-violet-300/15' : 'text-slate-400 bg-slate-800/70 border-slate-700';

function DashboardSkeleton() {
  return <div className="mx-auto max-w-6xl space-y-6" aria-label="Loading dashboard">
    <div className="h-20 animate-pulse rounded-2xl bg-slate-900/70" />
    <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><div className="h-64 animate-pulse rounded-2xl bg-slate-900/70"/><div className="h-64 animate-pulse rounded-2xl bg-slate-900/70"/></div>
    <div className="grid gap-4 sm:grid-cols-3">{[0,1,2].map((item)=><div key={item} className="h-28 animate-pulse rounded-xl bg-slate-900/70" />)}</div>
  </div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError('');
    try {
      const [profileResult, planResult, historyResult, practiceResult] = await Promise.allSettled([
        getMyProfile(), getTodaysPlan(), getPlanHistory(), getPracticeSessions(),
      ]);
      if (profileResult.status === 'rejected') throw profileResult.reason;
      setProfile(profileResult.value.profile || null);
      if (planResult.status === 'fulfilled') setPlan(planResult.value);
      else { setPlan(null); setError(planResult.reason?.message || 'Your preparation plan could not be loaded.'); }
      if (historyResult.status === 'fulfilled') setHistory(historyResult.value.tasks || []);
      else setHistory([]);
      if (practiceResult.status === 'fulfilled') setSessions(practiceResult.value.sessions || []);
      else setSessions([]);
    } catch (loadError) {
      setError(loadError?.message || 'Your dashboard could not be loaded. Please try again.');
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasAssessment = profile?.readinessScore != null;
  const tasks = plan?.tasks || [];
  const pendingTasks = tasks.filter((task) => task.status !== 'completed');
  const completedSessions = sessions.filter((session) => session.status === 'completed');
  const skillRows = useMemo(() => Object.entries(profile?.categoryScores || {})
    .filter(([, score]) => Number.isFinite(score) && score > 0)
    .sort((a, b) => a[1] - b[1]), [profile]);
  const nextTask = pendingTasks[0];
  const focusSkills = (profile?.weakAreas || []).slice(0, 3);
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const markComplete = async (task) => {
    setBusyId(task._id); setError(''); setNotice('');
    try {
      await completeTask(task._id);
      setNotice('Task completed and saved to your preparation history.');
      await load(false);
    } catch (completeError) {
      setError(completeError?.message || 'This task could not be completed. Try again.');
    } finally { setBusyId(''); }
  };

  if (loading) return <DashboardSkeleton />;

  return <div className="mx-auto max-w-6xl space-y-6 pb-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="pv-label mb-2 flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-violet-300" />{new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date())}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{greeting}, {user?.name?.split(' ')[0] || 'there'}.</h1>
        <p className="mt-2 text-sm text-slate-400">Here’s what matters for your preparation today.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => load()} className="gap-2"><RefreshCw className="h-3.5 w-3.5"/>Refresh</Button>
        <Link to={hasAssessment?'/plan':'/assessment'}><Button size="sm" className="gap-2">{hasAssessment?'Open today’s plan':'Take your assessment'}<ArrowRight className="h-3.5 w-3.5"/></Button></Link>
      </div>
    </header>

    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-sm text-rose-200"><span>{error}</span><Button size="sm" variant="outline" onClick={()=>load()}>Retry</Button></div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] px-4 py-3 text-sm text-emerald-200">{notice}</div>}

    {!profile ? <Card><CardContent className="flex flex-col items-start gap-4 pt-0 sm:flex-row sm:items-center"><span className="rounded-xl border border-violet-300/20 bg-violet-300/[.07] p-3 text-violet-200"><Target className="h-5 w-5"/></span><div className="flex-1"><h2 className="text-base font-semibold text-white">Set up your preparation profile</h2><p className="mt-1 text-sm text-slate-400">Add your target role and preparation goals to get started.</p></div><Link to="/onboarding"><Button>Complete your profile<ArrowRight className="h-4 w-4"/></Button></Link></CardContent></Card> : <>
      <section className="grid gap-4 lg:grid-cols-[1.22fr_.78fr]">
        <Card className="relative overflow-hidden border-violet-300/15 bg-[linear-gradient(125deg,rgba(139,124,246,.08),rgba(17,19,28,.82)_55%)]">
          <CardContent className="flex flex-col gap-6 pt-0 sm:flex-row sm:items-center">
            <ProgressRing value={hasAssessment?profile.readinessScore:0} size={152} stroke={9} label={hasAssessment?`Readiness ${profile.readinessScore} out of 100`:'Readiness assessment not completed'}>
              <div><p className="text-3xl font-semibold tracking-tight text-white">{hasAssessment?profile.readinessScore:'—'}</p><p className="text-[10px] uppercase tracking-[.14em] text-slate-500">Readiness</p></div>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="pv-label mb-2">Your current baseline</p>
              <h2 className="text-xl font-semibold tracking-tight text-white">{hasAssessment?'Know your starting point.':'Your readiness journey starts here.'}</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">{hasAssessment?`Based on your latest assessment for ${profile.targetRole}. Your preparation plan focuses on the gaps with the most impact.`:'Take the diagnostic to see your assessed strengths and the areas to focus on next.'}</p>
              {hasAssessment ? <div className="mt-5 flex flex-wrap gap-2">{focusSkills.map((skill)=><span key={skill} className="rounded-full border border-amber-300/15 bg-amber-300/[.06] px-2.5 py-1 text-[11px] text-amber-100">Focus · {skill}</span>)}{!focusSkills.length&&(profile.strongAreas||[]).slice(0,2).map((skill)=><span key={skill} className="rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-2.5 py-1 text-[11px] text-emerald-100">Strong · {skill}</span>)}</div> : <Link to="/assessment" className="mt-5 inline-flex"><Button size="sm" className="gap-2">Take assessment<ArrowRight className="h-3.5 w-3.5"/></Button></Link>}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between"><p className="pv-label">Your next best move</p><span className="rounded-lg border border-violet-300/15 bg-violet-300/[.06] p-2 text-violet-200"><Sparkles className="h-4 w-4"/></span></div>
            {hasAssessment && nextTask ? <><p className="mt-5 text-lg font-semibold leading-snug text-white">{nextTask.title}</p><p className="mt-2 text-sm leading-relaxed text-slate-400">{nextTask.reason || nextTask.actionTip || `A ${nextTask.category} task selected for your preparation plan.`}</p><div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span className="rounded-md border border-slate-700 px-2 py-1">{nextTask.category}</span><span className={`rounded-md border px-2 py-1 ${priorityClass(nextTask.priority)}`}>{nextTask.priority} priority</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3"/>{nextTask.estimatedTimeMinutes} min</span></div></> : <><p className="mt-5 text-lg font-semibold leading-snug text-white">{hasAssessment?'You’re clear for today.':'Start with your baseline.'}</p><p className="mt-2 text-sm leading-relaxed text-slate-400">{hasAssessment?'No unfinished tasks remain in today’s plan. Review your progress or choose a practice session.':'Your assessment will shape the plan and surface a useful first step.'}</p></>}
          </CardContent>
          <div className="flex flex-wrap gap-2 border-t border-slate-800/80 px-5 pt-4">
            {hasAssessment && nextTask ? <><Button size="sm" disabled={Boolean(busyId)} isLoading={busyId===nextTask._id} onClick={()=>markComplete(nextTask)} className="gap-2"><Check className="h-3.5 w-3.5"/>Mark complete</Button><Link to="/plan"><Button variant="outline" size="sm">View plan</Button></Link></> : <Link to={hasAssessment?'/practice':'/assessment'}><Button size="sm">{hasAssessment?'Start practicing':'Take assessment'}<ArrowRight className="h-3.5 w-3.5"/></Button></Link>}
          </div>
        </Card>
      </section>

      <section aria-label="Preparation summary" className="grid gap-3 sm:grid-cols-3">
        {[
          {label:'Plan tasks completed',value:profile.tasksCompletedCount??history.length,note:'Saved to your preparation history',icon:BookOpenCheck},
          {label:'Practice sessions',value:completedSessions.length,note:'Completed sessions in your account',icon:Dumbbell},
          {label:'Today’s focus',value:hasAssessment?`${tasks.filter((task)=>task.status==='completed').length} / ${tasks.length}`:'—',note:hasAssessment?'Tasks completed today':'Available after assessment',icon:Activity},
        ].map(({label,value,note,icon:Icon})=><Card key={label} className="transition-colors hover:border-slate-700"><CardContent className="flex items-start justify-between pt-0"><div><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p></div><span className="rounded-lg border border-slate-700/80 bg-slate-800/60 p-2 text-slate-300"><Icon className="h-4 w-4"/></span></CardContent></Card>)}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardContent className="pt-0">
            <div className="mb-5 flex items-end justify-between gap-3"><div><p className="pv-label mb-1">Your plan</p><h2 className="text-lg font-semibold text-white">Today’s focus</h2></div><Link to="/plan" className="inline-flex items-center gap-1 text-xs text-violet-200 hover:text-white">Full plan<ArrowRight className="h-3 w-3"/></Link></div>
            {!hasAssessment ? <div className="rounded-xl border border-dashed border-slate-700 p-5"><p className="text-sm text-slate-300">No assessment yet</p><p className="mt-1 text-xs leading-relaxed text-slate-500">Complete your baseline before we recommend daily tasks.</p></div> : tasks.length ? <div className="space-y-2">{tasks.slice(0,4).map((task)=><div key={task._id} className={`flex items-center gap-3 rounded-xl border p-3 ${task.status==='completed'?'border-slate-800/70 bg-slate-950/30':'border-slate-800 bg-slate-950/55'}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${task.status==='completed'?'border-emerald-300/15 bg-emerald-300/[.06] text-emerald-200':'border-violet-300/15 bg-violet-300/[.06] text-violet-200'}`}>{task.status==='completed'?<CheckCircle2 className="h-4 w-4"/>:<Circle className="h-4 w-4"/>}</span><div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${task.status==='completed'?'text-slate-500 line-through':'text-slate-200'}`}>{task.title}</p><p className="mt-1 text-[11px] text-slate-500">{task.category} · {task.estimatedTimeMinutes} min</p></div><span className={`hidden rounded-md border px-2 py-1 text-[10px] sm:inline-flex ${priorityClass(task.priority)}`}>{task.priority}</span>
            </div>)}</div> : <div className="rounded-xl border border-dashed border-slate-700 p-5"><p className="text-sm text-slate-300">No tasks for today</p><p className="mt-1 text-xs text-slate-500">Your plan will show new tasks when recommendations are available.</p></div>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <div className="mb-5"><p className="pv-label mb-1">Skill overview</p><h2 className="text-lg font-semibold text-white">What you’ve assessed</h2></div>
            {skillRows.length ? <div className="space-y-4">{skillRows.slice(0,6).map(([key,score])=><div key={key}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-xs text-slate-300">{prettySkill(key)}</span><span className="shrink-0 text-[11px] text-slate-500">{score}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-violet-300 transition-[width] duration-500" style={{width:`${Math.max(0,Math.min(score,100))}%`}}/></div></div>)}</div> : <div className="rounded-xl border border-dashed border-slate-700 p-5"><p className="text-sm text-slate-300">No assessed skills yet</p><p className="mt-1 text-xs text-slate-500">Your skill overview uses your latest diagnostic results.</p><Link to="/assessment" className="mt-3 inline-flex items-center gap-1 text-xs text-violet-200">Take assessment<ArrowRight className="h-3 w-3"/></Link></div>}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {title:'Continue your preparation',description:'Work through assessed gaps with a plan built around your available time.',path:'/plan',icon:BookOpenCheck},
          {title:'Practice a skill',description:'Start a focused DSA, core CS, or interview practice session.',path:'/practice',icon:ClipboardCheck},
          {title:'Compare a role',description:'See how a job description maps to your current assessment.',path:'/job-analyzer',icon:BriefcaseBusiness},
        ].map(({title,description,path,icon:Icon})=><Link to={path} key={title} className="group rounded-xl border border-slate-800 bg-slate-900/35 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/65"><span className="inline-flex rounded-lg border border-violet-300/15 bg-violet-300/[.06] p-2 text-violet-200"><Icon className="h-4 w-4"/></span><h3 className="mt-4 text-sm font-semibold text-slate-200">{title}</h3><p className="mt-1.5 text-xs leading-relaxed text-slate-500">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-[11px] text-violet-200">Open<ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5"/></span></Link>)}
      </section>
    </>}
  </div>;
}
