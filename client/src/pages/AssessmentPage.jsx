import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, BarChart3, Check, CheckCircle2, CircleHelp, ClipboardCheck, RotateCcw, Target } from 'lucide-react';
import { getAssessmentQuestions, submitAssessment } from '../services/api';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

const pretty = (value) => value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());

export default function AssessmentPage() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getAssessmentQuestions();
      setQuestions(data.questions || []);
    } catch (err) { setError(err.message || 'Unable to load diagnostic questions.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const current = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const submit = async () => {
    if (answeredCount < questions.length && !window.confirm(`You answered ${answeredCount} of ${questions.length}. Unanswered questions count as incorrect. Submit anyway?`)) return;
    setSubmitting(true); setError('');
    try {
      const data = await submitAssessment(questions.map((question) => ({ questionId: question._id, selectedOption: answers[question._id] ?? -1 })));
      setResult(data);
    } catch (err) { setError(err.message || 'Assessment could not be submitted. Your answers are still here; try again.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="mx-auto max-w-4xl space-y-5"><div className="h-8 w-56 animate-pulse rounded bg-slate-800"/><div className="h-2 animate-pulse rounded bg-slate-800"/><div className="h-72 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60"/></div>;
  if (error && !questions.length) return <div className="mx-auto max-w-2xl py-8"><Card><CardContent className="pt-0 text-center"><AlertCircle className="mx-auto h-8 w-8 text-rose-300"/><h1 className="mt-4 text-lg font-semibold text-white">Assessment unavailable</h1><p className="mt-2 text-sm text-slate-400">{error}</p><Button variant="outline" onClick={loadQuestions} className="mt-5">Try again</Button></CardContent></Card></div>;
  if (!questions.length) return <div className="mx-auto max-w-2xl py-8"><Card><CardContent className="pt-0 text-center"><CircleHelp className="mx-auto h-8 w-8 text-slate-500"/><h1 className="mt-4 text-lg font-semibold text-white">No assessment questions are available</h1><p className="mt-2 text-sm text-slate-400">Try again later or return to your dashboard.</p><Button variant="outline" onClick={loadQuestions} className="mt-5">Refresh questions</Button></CardContent></Card></div>;

  if (result) {
    const metrics = result.metrics || {};
    const readiness = result.profile?.readinessScore ?? metrics.overallReadiness;
    const skills = Object.entries(metrics.categoryScores || result.profile?.categoryScores || {});
    const recommendations = metrics.recommendations || result.profile?.recommendations || [];
    return <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b border-slate-800 pb-5"><p className="pv-label mb-2 flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300"/>Assessment complete</p><h1 className="text-2xl font-semibold text-white sm:text-3xl">Your baseline is ready</h1><p className="mt-2 text-sm text-slate-400">This summary comes from the answers you submitted. Use it to decide where to focus next.</p></header>
      <div className="grid gap-4 sm:grid-cols-[.8fr_1.2fr]">
        <Card className="border-violet-300/20 bg-violet-300/[.04]"><CardContent className="pt-0"><p className="text-xs text-slate-400">Placement readiness</p><div className="mt-2 flex items-baseline gap-2"><span className="text-5xl font-semibold tracking-tight text-white">{readiness ?? '—'}</span><span className="text-sm text-slate-500">/100</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-violet-300" style={{ width: `${Math.max(0, Math.min(Number(readiness) || 0, 100))}%` }}/></div><p className="mt-4 text-xs text-slate-500">{result.attempt?.correctCount ?? '—'} of {result.attempt?.totalQuestions ?? questions.length} questions correct</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-violet-300"/>Skill breakdown</CardTitle><CardDescription>Scores from this completed diagnostic</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{skills.map(([name, score])=><div key={name} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div className="flex justify-between gap-3"><span className="text-xs text-slate-400">{pretty(name)}</span><span className="text-sm font-medium text-white">{score}%</span></div><div className="mt-2 h-1 overflow-hidden rounded bg-slate-800"><div className="h-full bg-violet-300" style={{width:`${Math.max(0,Math.min(Number(score)||0,100))}%`}}/></div></div>)}</CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-violet-300"/>Recommended focus</CardTitle><CardDescription>Suggested from your assessed areas and profile</CardDescription></CardHeader><CardContent>{recommendations.length ? <div className="grid gap-3 sm:grid-cols-2">{recommendations.map((item,index)=><div key={`${item.category}-${index}`} className="rounded-lg border border-slate-800 bg-slate-950/40 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium text-white">{item.category}</h3><span className={`rounded-full px-2 py-1 text-[10px] ${item.priority === 'High' ? 'bg-amber-400/10 text-amber-200' : 'bg-slate-800 text-slate-400'}`}>{item.priority} priority</span></div><p className="mt-2 text-xs leading-relaxed text-slate-400">{item.action}</p></div>)}</div>:<p className="text-sm text-slate-500">No recommendations were returned for this assessment.</p>}</CardContent></Card>
      <div className="flex flex-wrap gap-3"><Link to="/plan"><Button className="gap-2">View preparation plan<ArrowRight className="h-4 w-4"/></Button></Link><Link to="/dashboard"><Button variant="outline">Go to dashboard</Button></Link><Button variant="ghost" onClick={()=>{setResult(null);setAnswers({});setCurrentIndex(0);}} className="gap-2"><RotateCcw className="h-3.5 w-3.5"/>Retake assessment</Button></div>
    </div>;
  }

  return <div className="mx-auto max-w-4xl space-y-6">
    <header className="border-b border-slate-800 pb-5"><p className="pv-label mb-2 flex items-center gap-2"><ClipboardCheck className="h-3.5 w-3.5 text-violet-300"/>Skill assessment</p><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Understand your baseline</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Answer the technical questions to calculate a readiness snapshot and get a focused preparation plan.</p></div><span className="w-fit rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">{answeredCount} of {questions.length} answered</span></div></header>
    {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[.06] p-3 text-sm text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>{error}</div>}
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5"><div className="mb-3 flex items-center justify-between text-xs"><span className="font-medium text-slate-300">Question {currentIndex + 1} <span className="text-slate-600">/ {questions.length}</span></span><span className="text-slate-500">{answeredCount} answered</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-violet-300 transition-[width] duration-200" style={{width:`${progress}%`}}/></div></div>
    {current && <Card className="border-slate-800 bg-slate-900/60"><CardHeader className="border-b border-slate-800/80"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-md border border-violet-300/20 bg-violet-300/[.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-200">{current.category}</span><span className="rounded-md border border-slate-800 px-2.5 py-1 text-[10px] text-slate-400">{current.difficulty}</span></div><span className="text-[11px] text-slate-500">Select one answer</span></div><CardTitle className="pt-3 text-base font-medium leading-relaxed sm:text-lg">{current.question}</CardTitle></CardHeader>
      <CardContent className="space-y-2.5 pt-4">{current.options.map((option,index)=>{const selected=answers[current._id]===index;return <button key={`${current._id}-${index}`} type="button" aria-pressed={selected} onClick={()=>setAnswers((previous)=>({...previous,[current._id]:index}))} className={`flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300 sm:p-4 ${selected?'border-violet-300/50 bg-violet-300/[.08] text-white':'border-slate-800 bg-slate-950/35 text-slate-300 hover:border-slate-700 hover:bg-slate-950/70'}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold ${selected?'border-violet-200 bg-violet-200 text-slate-950':'border-slate-700 bg-slate-900 text-slate-500'}`}>{selected?<Check className="h-3.5 w-3.5"/>:String.fromCharCode(65+index)}</span><span className="pt-0.5 text-sm leading-relaxed">{option}</span></button>})}</CardContent>
      <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-5 py-4"><Button variant="outline" size="sm" disabled={currentIndex===0} onClick={()=>setCurrentIndex((index)=>index-1)} className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5"/>Previous</Button>{currentIndex<questions.length-1?<Button size="sm" onClick={()=>setCurrentIndex((index)=>index+1)} className="gap-1.5">Next<ArrowRight className="h-3.5 w-3.5"/></Button>:<Button size="sm" isLoading={submitting} onClick={submit} className="gap-1.5">Submit assessment<CheckCircle2 className="h-3.5 w-3.5"/></Button>}</div>
    </Card>}
    <section className="rounded-xl border border-slate-800 bg-slate-900/35 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-medium text-slate-300">Question navigator</h2><span className="text-[10px] text-slate-600">Jump to a question</span></div><div className="flex flex-wrap gap-2">{questions.map((question,index)=>{const answered=answers[question._id]!==undefined;const active=index===currentIndex;return <button key={question._id} type="button" aria-label={`Question ${index+1}${answered?', answered':', unanswered'}`} aria-current={active?'step':undefined} onClick={()=>setCurrentIndex(index)} className={`h-9 min-w-9 rounded-lg border px-2 text-xs font-medium transition-colors ${active?'border-violet-300 bg-violet-300 text-slate-950':answered?'border-violet-300/25 bg-violet-300/[.08] text-violet-200':'border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700'}`}>{answered&&!active?<Check className="mx-auto h-3.5 w-3.5"/>:index+1}</button>})}</div></section>
  </div>;
}
