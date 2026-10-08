import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, BookOpenCheck, Check, CheckCircle2, Clock3, History, RotateCw, Target } from 'lucide-react';
import { completeTask, getMyProfile, getPlanHistory, getTodaysPlan } from '../services/api';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';

const practiceCategory = (category) => ['DSA','DBMS','OS','Networking','OOP','Interview'].includes(category) ? category : category === 'JavaScript' ? 'JavaScript' : 'Interview';
const priorityTone = (priority) => priority === 'High' ? 'border-amber-300/20 bg-amber-300/[.07] text-amber-200' : priority === 'Medium' ? 'border-violet-300/20 bg-violet-300/[.07] text-violet-200' : 'border-slate-700 bg-slate-800/50 text-slate-400';

export default function PreparationPlanPage() {
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [profileResult, planResult, historyResult] = await Promise.all([getMyProfile(), getTodaysPlan(), getPlanHistory()]);
      setProfile(profileResult.profile || null); setPlan(planResult); setHistory(historyResult.tasks || []);
    } catch (err) { setError(err.message || 'Could not load your preparation plan.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const markComplete = async (taskId) => {
    setBusyId(taskId); setError(''); setNotice('');
    try {
      const result = await completeTask(taskId);
      setPlan((previous) => previous ? {...previous,tasks:previous.tasks.map((task)=>task._id===taskId?{...task,status:'completed',completedAt:result.task?.completedAt||new Date().toISOString()}:task),stats:{...previous.stats,completedTasks:(previous.tasks.filter((task)=>task.status==='completed').length+1)}} : previous);
      if (result.profile) setProfile(result.profile);
      const historyResult = await getPlanHistory(); setHistory(historyResult.tasks || []);
      setNotice('Task marked complete and saved to your preparation history.');
    } catch (err) { setError(err.message || 'Could not update this task.'); }
    finally { setBusyId(''); }
  };

  if (loading) return <div className="mx-auto max-w-5xl space-y-5"><div className="h-8 w-64 animate-pulse rounded bg-slate-800"/><div className="h-40 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60"/><div className="h-28 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60"/></div>;
  const needsAssessment = plan?.requiresAssessment || profile?.readinessScore == null;
  const tasks = plan?.tasks || [];
  const completedToday = tasks.filter((task)=>task.status==='completed').length;
  const minutes = tasks.reduce((total,task)=>total+(Number(task.estimatedTimeMinutes)||0),0);

  return <div className="mx-auto max-w-6xl space-y-7">
    <PageHeader eyebrow="Preparation plan" title="What should you do next?" description="Today’s focus is built from your assessed gaps, plan history, and available preparation time." icon={BookOpenCheck} actions={<Button variant="outline" onClick={load} className="gap-2"><RotateCw className="h-3.5 w-3.5"/>Refresh plan</Button>} />
    {error&&<div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[.06] p-3 text-sm text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>{error}</div>}
    {notice&&<div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/[.06] p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4"/>{notice}</div>}
    {needsAssessment?<Card className="border-violet-300/20 bg-slate-900/55"><CardContent className="flex flex-col items-start gap-5 pt-0 sm:flex-row sm:items-center"><div className="rounded-xl border border-violet-300/15 bg-violet-300/[.07] p-3 text-violet-200"><Target className="h-5 w-5"/></div><div className="flex-1"><h2 className="text-base font-semibold text-white">Your plan starts with an assessment</h2><p className="mt-1 text-sm leading-relaxed text-slate-400">Complete the diagnostic so your preparation tasks can reflect your actual strengths and skill gaps.</p></div><Link to="/assessment"><Button className="gap-2">Take assessment<ArrowRight className="h-4 w-4"/></Button></Link></CardContent></Card>:<>
      <section className="grid gap-3 sm:grid-cols-3"><Card className="bg-slate-900/45"><CardContent className="pt-0"><p className="text-xs text-slate-500">Tasks completed today</p><p className="mt-2 text-2xl font-semibold text-white">{completedToday}<span className="ml-1 text-sm font-normal text-slate-600">/ {tasks.length}</span></p></CardContent></Card><Card className="bg-slate-900/45"><CardContent className="pt-0"><p className="text-xs text-slate-500">Estimated focus</p><p className="mt-2 text-2xl font-semibold text-white">{minutes}<span className="ml-1 text-sm font-normal text-slate-500">min</span></p></CardContent></Card><Card className="bg-slate-900/45"><CardContent className="pt-0"><p className="text-xs text-slate-500">Daily time available</p><p className="mt-2 text-2xl font-semibold text-white">{profile?.dailyPrepTimeHours ?? '—'}<span className="ml-1 text-sm font-normal text-slate-500">hr</span></p></CardContent></Card></section>
      <section><div className="mb-3 flex items-end justify-between gap-3"><div><p className="pv-label mb-1">Today’s preparation</p><h2 className="text-lg font-semibold text-white">Priority tasks</h2></div>{tasks.length>0&&<span className="text-xs text-slate-500">{plan?.stats?.percentComplete ?? Math.round((completedToday/Math.max(tasks.length,1))*100)}% complete</span>}</div>{tasks.length?<div className="space-y-3">{tasks.map((task,index)=>{const done=task.status==='completed';return <Card key={task._id} className={`${done?'opacity-70':'hover:border-slate-700'} transition-colors`}><CardContent className="pt-0"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold ${done?'border-emerald-300/20 bg-emerald-300/[.06] text-emerald-200':'border-violet-300/15 bg-violet-300/[.06] text-violet-200'}`}>{done?<Check className="h-4 w-4"/>:String(index+1).padStart(2,'0')}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md border border-slate-700 bg-slate-800/50 px-2 py-1 text-[10px] font-medium text-slate-300">{task.category}</span><span className={`rounded-md border px-2 py-1 text-[10px] font-medium ${priorityTone(task.priority)}`}>{task.priority} priority</span><span className="inline-flex items-center gap-1 text-[10px] text-slate-500"><Clock3 className="h-3 w-3"/>{task.estimatedTimeMinutes} min</span></div><h3 className={`mt-3 text-base font-semibold ${done?'text-slate-400 line-through':'text-white'}`}>{task.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{task.reason}</p>{task.actionTip&&<p className="mt-2 text-xs leading-relaxed text-slate-500">Suggested focus: {task.actionTip}</p>}<div className="mt-4 flex flex-wrap gap-2"><Link to={`/practice?category=${encodeURIComponent(practiceCategory(task.category))}`}><Button variant="secondary" size="sm" className="gap-1.5">Practice this topic<ArrowRight className="h-3 w-3"/></Button></Link>{done?<span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/20 px-3 py-1.5 text-xs text-emerald-200"><CheckCircle2 className="h-3.5 w-3.5"/>Completed</span>:<Button size="sm" isLoading={busyId===task._id} disabled={Boolean(busyId)} onClick={()=>markComplete(task._id)} className="gap-1.5"><Check className="h-3.5 w-3.5"/>Mark complete</Button>}</div></div></div></CardContent></Card>})}</div>:<Card><CardContent className="py-8 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-violet-300"/><h3 className="mt-3 text-sm font-medium text-white">No new preparation tasks today</h3><p className="mt-1 text-xs text-slate-500">Your current plan has no remaining recommendations. Check your completed history or revisit your assessment later.</p></CardContent></Card>}</section>
    </>}
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-4 w-4 text-violet-300"/>Completed preparation</CardTitle></CardHeader><CardContent>{history.length?<div className="divide-y divide-slate-800">{history.slice(0,8).map((task)=><div key={task._id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"><div><p className="text-sm font-medium text-slate-200">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.category} · {task.estimatedTimeMinutes} min · {task.priority} priority</p></div><span className="text-[11px] text-slate-500">{task.completedAt?new Date(task.completedAt).toLocaleDateString():''}</span></div>)}</div>:<p className="text-sm text-slate-500">Completed tasks will appear here after you finish them.</p>}</CardContent></Card>
  </div>;
}
