import React, { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, Clock3, FileSearch, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import {
  addJobRecommendationToPlan,
  analyzeJobDescription,
  deleteJobAnalysis,
  getJobAnalyses,
  getJobAnalysis,
} from '../services/api';

const MAX_DESCRIPTION_LENGTH = 12000;

const STATUS_LABELS = {
  strong: 'Strong match',
  developing: 'Developing',
  needs_attention: 'Needs attention',
  unknown: 'Needs validation',
};

const statusStyle = (status) => {
  if (status === 'strong') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
  if (status === 'developing') return 'bg-sky-500/10 border-sky-500/20 text-sky-300';
  if (status === 'needs_attention') return 'bg-amber-500/10 border-amber-500/20 text-amber-300';
  return 'bg-slate-800 border-slate-700 text-slate-300';
};

const practiceCategoryFor = (recommendation) => {
  if (['DSA', 'DBMS', 'OS', 'Networking', 'OOP', 'Interview'].includes(recommendation.category)) {
    return recommendation.category;
  }
  if (recommendation.skill === 'JavaScript') return 'JavaScript';
  return null;
};

export const JobAnalyzerPage = () => {
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [addingIndex, setAddingIndex] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadHistory = async () => {
    try {
      const result = await getJobAnalyses();
      setHistory(result.analyses || []);
      if (!analysis && result.analyses?.length) {
        const latest = await getJobAnalysis(result.analyses[0]._id);
        setAnalysis(latest.analysis);
      }
    } catch (loadError) {
      setError(loadError.message || 'Could not load saved job analyses.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleAnalyze = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!description.trim()) {
      setError('Paste a job description before analyzing it.');
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeJobDescription({ company, title, description });
      setAnalysis(result.analysis);
      setHistory((items) => [result.analysis, ...items.filter((item) => item._id !== result.analysis._id)]);
    } catch (analysisError) {
      setError(analysisError.message || 'Could not analyze this job description.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddRecommendation = async (index) => {
    if (!analysis) return;
    setError('');
    setNotice('');
    setAddingIndex(index);
    try {
      const result = await addJobRecommendationToPlan(analysis._id, index);
      setAnalysis((current) => {
        const recommendations = current.recommendations.map((item, itemIndex) =>
          itemIndex === index ? { ...item, preparationTask: result.task._id } : item
        );
        return { ...current, recommendations };
      });
      setNotice(result.message);
    } catch (addError) {
      setError(addError.message || 'Could not add this recommendation to today’s plan.');
    } finally {
      setAddingIndex(null);
    }
  };

  const handleOpenAnalysis = async (id) => {
    setError('');
    try {
      const result = await getJobAnalysis(id);
      setAnalysis(result.analysis);
    } catch (loadError) {
      setError(loadError.message || 'Could not open this analysis.');
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await deleteJobAnalysis(id);
      const nextHistory = history.filter((item) => item._id !== id);
      setHistory(nextHistory);
      if (analysis?._id === id) {
        setAnalysis(null);
        if (nextHistory.length) await handleOpenAnalysis(nextHistory[0]._id);
      }
      setNotice('Saved analysis deleted.');
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete this analysis.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow="Career intelligence" title="Job Analyzer" description="Compare a target role with your assessed skills, find the gaps that matter, and turn recommendations into preparation." icon={Briefcase} />

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-400/20 bg-rose-400/[.06] p-3 text-sm text-rose-200"><span>{error}</span><Button size="sm" variant="outline" onClick={loadHistory}>Retry saved analyses</Button></div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</div>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSearch className="h-4 w-4 text-brand-400" />Analyze a role</CardTitle>
          <CardDescription>Paste the job description. The analyzer extracts common placement skills locally and compares them with your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Role title (optional)" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Software Engineer Intern" />
              <Input label="Company (optional)" value={company} onChange={(event) => setCompany(event.target.value)} maxLength={120} placeholder="Company name" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="job-description" className="block text-xs font-medium text-slate-300">Job description</label>
              <textarea
                id="job-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={MAX_DESCRIPTION_LENGTH}
                rows={9}
                required
                placeholder={'Requirements:\n• Strong DSA\n• Java or C++\n• SQL and DBMS\n• REST APIs and Git\n• Good communication'}
                className="block w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Up to {MAX_DESCRIPTION_LENGTH.toLocaleString()} characters</span>
                <span>{description.length.toLocaleString()} / {MAX_DESCRIPTION_LENGTH.toLocaleString()}</span>
              </div>
            </div>
            <Button type="submit" variant="primary" isLoading={analyzing} className="gap-2">
              <Search className="h-4 w-4" />Analyze job description
            </Button>
          </form>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-5">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle>{analysis.title || 'Job analysis'}{analysis.company ? ` · ${analysis.company}` : ''}</CardTitle>
                <CardDescription className="mt-2">Analyzed {new Date(analysis.analyzedAt).toLocaleString()}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Job readiness match</p>
                <p className="font-mono text-3xl font-bold text-white">{analysis.readinessPercent}%</p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-xs leading-relaxed text-slate-400">{analysis.readinessExplanation}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Strong', analysis.summary.strong, 'text-emerald-300'],
                  ['Developing', analysis.summary.developing, 'text-sky-300'],
                  ['Needs attention', analysis.summary.needsAttention, 'text-amber-300'],
                  ['Unknown', analysis.summary.unknown, 'text-slate-300'],
                ].map(([label, count, color]) => (
                  <div key={label} className={`rounded-lg border p-3 ${label === 'Needs attention' && count > 0 ? 'border-amber-300/20 bg-amber-300/[.04]' : 'border-slate-800 bg-slate-950/60'}`}>
                    <p className="text-[11px] text-slate-400">{label}</p>
                    <p className={`mt-1 text-xl font-semibold ${color}`}>{count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requirements and your current evidence</CardTitle>
              <CardDescription>Related assessment scores are identified as proxies; unassessed tools and frameworks stay unknown.</CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.skillMatches.length ? (
                <div className="space-y-2">
                  {analysis.skillMatches.map((match) => (
                    <div key={match.name} className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">{match.name}</span>
                          <span className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">{match.group.replace('-', ' ')}</span>
                          <span className={`rounded border px-2 py-0.5 text-[10px] ${statusStyle(match.status)}`}>{STATUS_LABELS[match.status]}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{match.explanation}</p>
                      </div>
                      <span className="shrink-0 font-mono text-sm text-slate-300">{match.score === null ? '—' : `${match.score}%`}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">No supported placement skills were detected. Try including explicit terms such as DSA, DBMS, SQL, React, or REST APIs.</div>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {analysis.extractedSkills.map((skill) => <span key={skill} className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-300">{skill}</span>)}
                {analysis.extractedTopics.map((topic) => <span key={topic} className="rounded-full bg-brand-500/10 px-2.5 py-1 text-brand-300">{topic}</span>)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your next steps</CardTitle>
              <CardDescription>Recommendations use the gaps above and can be added to your existing preparation plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.recommendations.length ? analysis.recommendations.map((recommendation, index) => (
                <div key={`${recommendation.skill}-${index}`} className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{recommendation.title}</h3>
                      <span className={`rounded border px-2 py-0.5 text-[10px] ${statusStyle(recommendation.priority === 'High' ? 'needs_attention' : recommendation.priority === 'Medium' ? 'developing' : 'strong')}`}>{recommendation.priority} priority</span>
                    </div>
                    <p className="text-xs text-slate-400">{recommendation.reason}</p>
                    <p className="text-xs leading-relaxed text-slate-300">{recommendation.actionTip}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="h-3 w-3" />{recommendation.estimatedTimeMinutes} minutes</span>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {practiceCategoryFor(recommendation) && (
                      <Link to={`/practice?category=${encodeURIComponent(practiceCategoryFor(recommendation))}`}>
                        <Button variant="secondary" size="sm" className="gap-2">Practice this skill</Button>
                      </Link>
                    )}
                    <Button variant="outline" size="sm" disabled={Boolean(recommendation.preparationTask)} isLoading={addingIndex === index} onClick={() => handleAddRecommendation(index)} className="gap-2">
                      {recommendation.preparationTask ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {recommendation.preparationTask ? 'In today’s plan' : 'Add to today’s plan'}
                    </Button>
                  </div>
                </div>
              )) : <p className="text-sm text-slate-400">Your assessed areas are strong for the skills detected. Keep practicing to maintain them.</p>}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Saved analyses</CardTitle>
          <CardDescription>Only you can access your saved job descriptions and results.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? <p className="text-sm text-slate-400">Loading saved analyses…</p> : history.length ? (
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                  <button type="button" onClick={() => handleOpenAnalysis(item._id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium text-slate-200">{item.title || 'Job analysis'}{item.company ? ` · ${item.company}` : ''}</span>
                    <span className="text-[11px] text-slate-500">{new Date(item.analyzedAt).toLocaleDateString()} · {item.requiredSkills.length} requirements</span>
                  </button>
                  <span className="font-mono text-sm text-slate-300">{item.readinessPercent}%</span>
                  <Button variant="ghost" size="sm" title="Delete analysis" onClick={() => handleDelete(item._id)} className="text-slate-400 hover:text-rose-300"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No saved analyses yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobAnalyzerPage;
