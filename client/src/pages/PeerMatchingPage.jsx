import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, CalendarClock, HeartHandshake, Plus, RefreshCw, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { getPeerMatches, getPeerProfile, updatePeerProfile } from '../services/api';

const errorMessage = (error) => error?.message || 'Could not load peer matches.';

export default function PeerMatchingPage() {
  const [profile, setProfile] = useState(null);
  const [interestsText, setInterestsText] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [newScore, setNewScore] = useState(70);
  const [matches, setMatches] = useState([]);
  const [scoring, setScoring] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshMatches = async () => {
    const data = await getPeerMatches();
    setMatches(data.matches || []);
    setScoring(data.scoring || '');
  };

  const loadProfile = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const peerData = await getPeerProfile();
      setProfile(peerData.profile);
      setInterestsText((peerData.profile?.learningInterests || []).join(', '));
      setSkills(peerData.profile?.peerSkills || []);
      if (!peerData.profile) {
        setMatches([]);
        setScoring('');
        return;
      }
      const matchData = await getPeerMatches();
      setMatches(matchData.matches || []);
      setScoring(matchData.scoring || '');
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadProfile(); }, [loadProfile]);

  const addSkill = () => {
    const name = newSkill.trim();
    if (!name || name.length > 40 || skills.length >= 12) return;
    setSkills((current) => [...current.filter((skill) => skill.name.toLowerCase() !== name.toLowerCase()), { name, score: Number(newScore) }]);
    setNewSkill('');
  };

  const saveProfile = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const learningInterests = [...new Set(interestsText.split(',').map((item) => item.trim()).filter(Boolean))].slice(0, 10);
      const data = await updatePeerProfile({ learningInterests, peerSkills: skills });
      setProfile(data.profile);
      await refreshMatches();
      setNotice('Your peer-learning profile and match recommendations are up to date.');
    } catch (err) { setError(errorMessage(err)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="mx-auto max-w-6xl space-y-5"><div className="h-8 w-64 animate-pulse rounded bg-slate-800"/><div className="h-48 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50"/><div className="h-36 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50"/></div>;

  return <div className="mx-auto max-w-6xl space-y-6">
    <PageHeader eyebrow="Collaborate · Peer matching" title="Find someone to prepare with" description="Review compatible peers using their shared interests, strengths, and learning areas, then continue in a room together." icon={Users} actions={<><Link to="/interviews"><Button variant="secondary" className="gap-2"><CalendarClock className="h-4 w-4"/>Peer interviews</Button></Link><Link to="/rooms"><Button variant="outline">Study rooms</Button></Link></>} />
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-sm text-rose-200"><span>{error}</span><Button size="sm" variant="outline" onClick={loadProfile} isLoading={loading}>Retry</Button></div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
    {!profile ? error ? <Card><CardContent className="space-y-3 pt-0"><p className="text-sm text-slate-300">Your profile could not be loaded, so matches are unavailable.</p><Button variant="outline" onClick={loadProfile}>Retry</Button></CardContent></Card> : <Card><CardContent className="space-y-3 pt-0"><p className="text-sm text-slate-300">Complete your profile first so matching can use your target role and assessment strengths.</p><Link to="/onboarding"><Button>Complete profile</Button></Link></CardContent></Card> : <>
      <Card><CardHeader><CardTitle>Your peer-learning profile</CardTitle><p className="text-xs text-slate-400">Target role from onboarding: {profile.targetRole}</p></CardHeader><CardContent><form onSubmit={saveProfile} className="space-y-5">
        <label className="block text-sm font-medium text-slate-300">Learning interests <span className="font-normal text-slate-500">(comma-separated, up to 10)</span><input value={interestsText} onChange={(event) => setInterestsText(event.target.value)} maxLength={450} placeholder="Java, Graphs, System design, Interview preparation" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-600" /></label>
        <div><div className="mb-2 flex items-center justify-between"><div><p className="text-sm font-medium text-slate-300">Skill ratings</p><p className="mt-1 text-xs text-slate-500">Add a few skills from 0–100. These help find complementary strengths and learning areas.</p></div><span className="text-xs text-slate-500">{skills.length}/12</span></div>
          {skills.length > 0 && <div className="mb-3 grid gap-2 sm:grid-cols-2">{skills.map((skill) => <div key={skill.name} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2"><span className="text-sm text-slate-200">{skill.name}<span className="ml-2 text-xs text-slate-500">{skill.score}/100</span></span><button type="button" onClick={() => setSkills((current) => current.filter((item) => item.name !== skill.name))} className="text-xs text-slate-500 hover:text-rose-300" aria-label={`Remove ${skill.name}`}>Remove</button></div>)}</div>}
          <div className="flex flex-wrap gap-2"><input value={newSkill} onChange={(event) => setNewSkill(event.target.value)} maxLength={40} placeholder="Skill name" className="min-w-[10rem] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600" /><input type="number" min="0" max="100" value={newScore} onChange={(event) => setNewScore(event.target.value)} aria-label="Skill rating" className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><Button type="button" variant="secondary" onClick={addSkill} disabled={!newSkill.trim() || skills.length >= 12} className="gap-2"><Plus className="h-4 w-4" />Add skill</Button></div>
        </div>
        <Button type="submit" disabled={saving || interestsText.split(',').filter((item) => item.trim()).length > 10}>{saving ? 'Saving…' : 'Save profile and refresh matches'}</Button>
      </form></CardContent></Card>

      <div><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-semibold text-white">Recommended peers</h2><p className="mt-1 text-xs text-slate-400">Matches are two-way and based on simple, visible rules.</p></div><Button variant="ghost" size="sm" onClick={() => refreshMatches().catch((err) => setError(errorMessage(err)))} className="gap-2"><RefreshCw className="h-3.5 w-3.5" />Refresh</Button></div>
        {matches.length ? <div className="grid gap-4 lg:grid-cols-2">{matches.map((match) => <Card key={match.user.id}><CardHeader><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3">{match.user.avatar ? <img src={match.user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15 text-brand-300"><Users className="h-5 w-5" /></div>}<div><CardTitle>{match.user.name}</CardTitle><p className="mt-1 text-xs text-slate-400">{match.targetRole}</p></div></div><span className="rounded-lg bg-brand-500/10 px-3 py-2 text-right"><strong className="block text-lg text-brand-300">{match.score}</strong><span className="text-[9px] uppercase tracking-wide text-slate-500">match points</span></span></div></CardHeader><CardContent className="space-y-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Why this peer</p><ul className="space-y-1 text-sm text-slate-300">{match.reasons.map((reason) => <li key={reason} className="flex gap-2"><HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{reason}</li>)}</ul></div><div className="grid gap-3 sm:grid-cols-2"><div><p className="mb-1 text-xs text-emerald-300">Their strengths</p><p className="text-xs leading-relaxed text-slate-400">{match.candidateSkills.strengths.slice(0, 5).map((item) => `${item.name} ${item.score}`).join(' · ') || 'Add skill ratings to share your strengths.'}</p></div><div><p className="mb-1 text-xs text-amber-300">Their learning areas</p><p className="text-xs leading-relaxed text-slate-400">{match.candidateSkills.weaknesses.slice(0, 5).map((item) => `${item.name} ${item.score}`).join(' · ') || 'No learning areas listed.'}</p></div></div><p className="flex items-center gap-1 text-xs text-slate-500"><ArrowLeftRight className="h-3.5 w-3.5" />Shared interests: {match.sharedInterests.join(', ') || 'none'}</p><Link to="/interviews" className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-200 hover:text-violet-100"><CalendarClock className="h-3.5 w-3.5"/>Schedule a peer interview</Link></CardContent></Card>)}</div> : <Card><CardContent className="flex items-start gap-3 pt-0"><span className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400"><Users className="h-4 w-4"/></span><div><p className="text-sm font-medium text-slate-200">No compatible peers yet</p><p className="mt-1 text-xs leading-relaxed text-slate-500">Add accurate interests and skill ratings, save your profile, then refresh. Matches appear only when another student’s saved profile fits.</p></div></CardContent></Card>}
        {scoring && <p className="mt-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs leading-relaxed text-slate-500">Scoring: {scoring}</p>}
      </div>
    </>}
  </div>;
}
