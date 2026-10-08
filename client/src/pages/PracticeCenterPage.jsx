import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Dumbbell, History } from 'lucide-react';
import { completePracticeSession, getPracticeSession, getPracticeSessions, startPracticeSession, submitPracticeAnswer } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';

const CATEGORIES = ['DSA', 'DBMS', 'OS', 'Networking', 'OOP', 'JavaScript', 'Interview'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const DURATIONS = [10, 15, 20];
const initialCategory = (value) => CATEGORIES.includes(value) ? value : 'DSA';
const dateLabel = (value) => value ? new Date(value).toLocaleString() : 'In progress';

export default function PracticeCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(() => initialCategory(searchParams.get('category')));
  const [difficulty, setDifficulty] = useState('Beginner');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getPracticeSessions();
      setHistory(data.sessions || []);
    } catch (err) {
      setError(err.message || 'Unable to load practice history.');
    } finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { refreshHistory(); }, [refreshHistory]);
  useEffect(() => {
    const queryCategory = searchParams.get('category');
    if (queryCategory && CATEGORIES.includes(queryCategory)) setCategory(queryCategory);
  }, [searchParams]);

  const beginSession = async () => {
    setLoading(true); setError(''); setEvaluation(null); setAnswer(''); setPendingQuestion(null);
    try {
      const data = await startPracticeSession({ category, difficulty, durationMinutes });
      setSession(data.session); setCurrentQuestion(data.currentQuestion);
      await refreshHistory();
    } catch (err) { setError(err.message || 'Unable to start practice.'); }
    finally { setLoading(false); }
  };

  const sendAnswer = async () => {
    if (!currentQuestion || !answer.trim()) return;
    setLoading(true); setError('');
    try {
      const data = await submitPracticeAnswer(session.id, { questionId: currentQuestion.questionId, answer });
      setEvaluation(data.evaluation); setAnswer(''); setPendingQuestion(data.nextQuestion);
    } catch (err) { setError(err.message || 'Unable to submit your answer.'); }
    finally { setLoading(false); }
  };

  const finishSession = async () => {
    setLoading(true); setError('');
    try {
      const data = await completePracticeSession(session.id);
      setSession(data.session); setCurrentQuestion(null); setEvaluation(null); await refreshHistory();
    } catch (err) { setError(err.message || 'Unable to complete this session.'); }
    finally { setLoading(false); }
  };

  const openSession = async (id) => {
    setLoading(true); setError(''); setEvaluation(null); setAnswer(''); setPendingQuestion(null);
    try {
      const data = await getPracticeSession(id);
      const selected = data.session;
      setSession(selected); setCategory(selected.category); setDifficulty(selected.difficulty);
      const activeQuestion = selected.status === 'in_progress' ? selected.questions[selected.currentQuestionIndex] : null;
      setCurrentQuestion(activeQuestion || null);
      if (selected.status === 'in_progress' && !activeQuestion) {
        const completed = await completePracticeSession(selected.id);
        setSession(completed.session);
      }
    } catch (err) { setError(err.message || 'Unable to open this session.'); }
    finally { setLoading(false); }
  };

  const reset = () => { setSession(null); setCurrentQuestion(null); setPendingQuestion(null); setEvaluation(null); setAnswer(''); setError(''); };
  const advanceQuestion = () => {
    if (pendingQuestion) setCurrentQuestion(pendingQuestion);
    else setCurrentQuestion(null);
    setPendingQuestion(null); setEvaluation(null); setAnswer('');
  };
  const chooseCategory = (value) => { setCategory(value); setSearchParams({ category: value }); };
  const active = session?.status === 'in_progress';

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Practice workspace" title="Practice with a plan" description="Choose a topic and session length, work through curated questions, and review the feedback saved for your answers." icon={Dumbbell} actions={session && <Button variant="outline" onClick={reset}>Session setup</Button>} />

      {error && <div role="alert" className="rounded-lg border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">{error}</div>}

      {!session && <Card>
        <CardHeader><CardTitle>Choose your practice</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div><p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Category</p><div className="flex flex-wrap gap-2">{CATEGORIES.map((item) => <Button key={item} size="sm" aria-pressed={category === item} variant={category === item ? 'primary' : 'secondary'} onClick={() => chooseCategory(item)}>{item}</Button>)}</div></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Difficulty<select className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm normal-case text-slate-100" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>{DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Session duration<select className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm normal-case text-slate-100" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))}>{DURATIONS.map((item) => <option key={item} value={item}>{item} minutes</option>)}</select></label>
          </div>
          <Button onClick={beginSession} disabled={loading} className="gap-2"><Dumbbell className="h-4 w-4" />{loading ? 'Starting…' : 'Start practice'}</Button>
        </CardContent>
      </Card>}

      {active && <Card>
        <CardHeader><div className="flex items-center justify-between"><CardTitle>{session.category} · {session.difficulty}</CardTitle><span className="inline-flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" />{session.durationMinutes} minutes</span></div></CardHeader>
        <CardContent>
          {currentQuestion ? <>
            <div className="mb-4"><div className="mb-2 flex justify-between text-xs"><span className="font-medium text-violet-200">Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}</span><span className="text-slate-500">{session.category} · {session.difficulty}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-violet-300" style={{width:`${Math.round((currentQuestion.questionNumber/Math.max(currentQuestion.totalQuestions,1))*100)}%`}}/></div></div>
            <h2 className="text-xl font-semibold text-white">{currentQuestion.question}</h2>
            {!evaluation && <><label className="mt-5 block text-sm text-slate-300" htmlFor="practice-answer">Your answer</label>
            <textarea id="practice-answer" maxLength={4000} rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Explain your answer in your own words…" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none" />
            <div className="mt-3 flex flex-wrap gap-2"><Button onClick={sendAnswer} disabled={loading || !answer.trim()}>{loading ? 'Submitting…' : 'Submit answer'}</Button><Button variant="outline" onClick={finishSession} disabled={loading}>Finish session</Button></div></>}
            {evaluation && <div className="mt-5 rounded-lg border border-brand-500/30 bg-brand-500/5 p-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-white">Practice evaluation</h3><span className="text-lg font-bold text-brand-400">{evaluation.score}/100</span></div><p className="mt-2 text-sm text-slate-300">{evaluation.feedback}</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><p className="text-xs text-emerald-300"><strong>Covered:</strong> {evaluation.matchedConcepts.length ? evaluation.matchedConcepts.join(', ') : 'None identified'}</p><p className="text-xs text-amber-300"><strong>To revisit:</strong> {evaluation.missingConcepts.length ? evaluation.missingConcepts.join(', ') : 'No target concepts missed'}</p></div><p className="mt-3 text-xs text-slate-500">Rule-based feedback checks concept mentions and answer length; it does not judge correctness like a human interviewer.</p><Button className="mt-4" onClick={advanceQuestion}>{pendingQuestion ? 'Next question' : 'View session summary'}</Button></div>}
          </> : <div className="space-y-4"><p className="text-slate-300">All questions have been answered.</p><Button onClick={finishSession} disabled={loading}>{loading ? 'Finishing…' : 'View session summary'}</Button></div>}
        </CardContent>
      </Card>}

      {session?.status === 'completed' && <Card>
        <CardHeader><CardTitle>Session summary</CardTitle><p className="text-xs text-slate-400">{session.category} · {session.difficulty} · {session.totalQuestions} questions</p></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-emerald-400" /><div><p className="text-3xl font-bold text-white">{session.overallScore}<span className="text-base text-slate-500">/100</span></p><p className="text-xs text-slate-400">Practice score</p></div></div>
          <div className="grid gap-3 sm:grid-cols-3">{Object.entries(session.categoryScores || {}).map(([name, score]) => <div key={name} className="rounded-lg bg-slate-950 p-3"><p className="text-xs capitalize text-slate-400">{name.replace(/[A-Z]/g, (m) => ` ${m.toLowerCase()}`)}</p><p className="mt-1 text-lg font-semibold text-white">{score}/100</p></div>)}</div>
          <div className="grid gap-4 sm:grid-cols-2"><div><h3 className="mb-2 text-sm font-semibold text-emerald-300">Strengths</h3>{session.strengths?.length ? <ul className="space-y-1 text-sm text-slate-300">{session.strengths.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="text-sm text-slate-500">Keep practicing to build strengths.</p>}</div><div><h3 className="mb-2 text-sm font-semibold text-amber-300">Areas to improve</h3>{session.improvements?.length ? <ul className="space-y-1 text-sm text-slate-300">{session.improvements.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="text-sm text-slate-500">No missed concepts were identified.</p>}</div></div>
          <div className="rounded-lg border border-slate-800 p-4"><h3 className="text-sm font-semibold text-white">Recommended next steps</h3><ul className="mt-2 space-y-1 text-sm text-slate-300">{session.recommendedNextSteps?.map((item) => <li key={item}>• {item}</li>)}</ul></div>
          <div className="flex flex-wrap gap-2"><Button onClick={reset}>Practice again</Button><Link to="/dashboard"><Button variant="outline">Back to dashboard</Button></Link></div>
        </CardContent>
      </Card>}

      <Card>
        <CardHeader><CardTitle><span className="inline-flex items-center gap-2"><History className="h-4 w-4" />Practice history</span></CardTitle></CardHeader>
        <CardContent>{historyLoading ? <div className="space-y-2"><div className="h-12 animate-pulse rounded-lg bg-slate-800/50"/><div className="h-12 animate-pulse rounded-lg bg-slate-800/50"/></div> : history.length ? <div className="divide-y divide-slate-800">{history.map((item) => <div key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-white">{item.category} · {item.difficulty} {item.overallScore != null && <span className="text-brand-400">· {item.overallScore}/100</span>}</p><p className="mt-1 text-xs text-slate-500">{dateLabel(item.completedAt || item.startedAt)} · {item.status.replace('_', ' ')}</p></div><Button size="sm" variant="outline" onClick={() => openSession(item.id)} disabled={loading}>{item.status === 'in_progress' ? 'Resume' : 'View summary'}</Button></div>)}</div> : <p className="text-sm text-slate-500">Your completed and in-progress sessions will appear here.</p>}</CardContent>
      </Card>
    </div>
  );
}
