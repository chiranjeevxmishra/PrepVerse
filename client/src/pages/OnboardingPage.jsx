import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getMyProfile, saveOnboarding } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  GraduationCap,
  Code2,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  Layers,
} from 'lucide-react';

export const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState('');
  const [profileExists, setProfileExists] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Form State
  const [targetRole, setTargetRole] = useState('Software Development Engineer (SDE)');
  const [graduationYear, setGraduationYear] = useState(2026);
  const [targetCompanies, setTargetCompanies] = useState(['Product Companies', 'High-Growth Startups']);
  const [languages, setLanguages] = useState(['JavaScript', 'C++']);

  // Self Assessment (1-5 scale)
  const [selfAssessment, setSelfAssessment] = useState({
    dsa: 3,
    oop: 3,
    dbms: 3,
    os: 3,
    networking: 3,
    interview: 3,
    communication: 3,
  });

  // Practical
  const [projectsCount, setProjectsCount] = useState(2);
  const [dailyPrepTimeHours, setDailyPrepTimeHours] = useState(3);

  useEffect(() => {
    let active = true;
    getMyProfile().then(({ profile }) => {
      if (!active || !profile) return;
      setProfileExists(true);
      setTargetRole(profile.targetRole || 'Software Development Engineer (SDE)');
      setGraduationYear(profile.graduationYear || 2026);
      setTargetCompanies(profile.targetCompanies || []);
      setLanguages(profile.languages || []);
      setSelfAssessment((current) => ({ ...current, ...(profile.selfAssessment || {}) }));
      setProjectsCount(profile.projectsCount ?? 0);
      setDailyPrepTimeHours(profile.dailyPrepTimeHours || 2);
    }).catch((loadError) => {
      if (active) setProfileLoadError(loadError.message || 'Could not load your saved profile.');
    }).finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, []);


  const roles = [
    'Software Development Engineer (SDE)',
    'Frontend Engineer',
    'Backend Engineer',
    'Full-Stack Developer',
    'Data Analyst / Engineer',
  ];

  const years = [2024, 2025, 2026, 2027, 2028];

  const availableCompanies = [
    'FAANG / Tier-1 Tech',
    'Product Companies',
    'High-Growth Startups',
    'Fintech & Quant',
    'Consulting / MNCs',
  ];

  const availableLanguages = ['C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go'];

  const toggleItem = (list, setList, item) => {
    if (list.includes(item)) {
      if (list.length > 1) {
        setList(list.filter((i) => i !== item));
      }
    } else {
      setList([...list, item]);
    }
  };

  const handleConfidenceChange = (key, val) => {
    setSelfAssessment((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await saveOnboarding({
        targetRole,
        graduationYear,
        targetCompanies,
        languages,
        selfAssessment,
        projectsCount,
        dailyPrepTimeHours,
      });

      // First-time setup continues to assessment; profile edits return to the workspace.
      navigate(profileExists ? '/dashboard' : '/assessment');
    } catch (err) {
      setError(err.message || 'Failed to save onboarding details');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) return <div className="mx-auto max-w-3xl space-y-4"><div className="h-8 w-52 animate-pulse rounded bg-slate-800"/><div className="h-52 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60"/><div className="h-60 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60"/></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="border-b border-slate-800 pb-5"><p className="pv-label mb-2">Account profile</p><h1 className="text-2xl font-semibold text-white sm:text-3xl">{profileExists ? 'Profile & goals' : 'Set your preparation goals'}</h1><p className="mt-2 text-sm text-slate-400">{user?.name}{user?.email ? ` · ${user.email}` : ''} · Your saved target role and study preferences shape the plan.</p></header>
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-brand-500 font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Profile & preparation goals
          </span>
          <span>{profileExists ? `Editing profile · Step ${step} of 3` : `Step ${step} of 3`}</span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-brand-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {profileLoadError && <div role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/[.06] p-3 text-sm text-rose-200">{profileLoadError} <button type="button" className="underline" onClick={() => window.location.reload()}>Retry profile load</button></div>}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Step 1: Academic & Target Career */}
      {step === 1 && (
        <Card className="border-slate-800 bg-slate-900/60 animate-fadeIn">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-brand-500" />
              Target Role & Background
            </CardTitle>
            <CardDescription>
              Tell us what placement opportunity you are preparing for
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Target Role */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Target Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTargetRole(r)}
                    className={`p-3 rounded-lg text-left text-xs font-medium border transition-colors ${
                      targetRole === r
                        ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Graduation Year */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-slate-400" /> Graduation Year
              </label>
              <div className="flex flex-wrap gap-2">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setGraduationYear(y)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      graduationYear === y
                        ? 'border-brand-500 bg-brand-500/20 text-brand-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Batch of {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Companies */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Target Company Tiers</label>
              <div className="flex flex-wrap gap-2">
                {availableCompanies.map((c) => {
                  const selected = targetCompanies.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleItem(targetCompanies, setTargetCompanies, c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selected
                          ? 'border-brand-500 bg-brand-500/15 text-brand-400'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Programming Languages */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-slate-400" /> Primary Problem-Solving Languages
              </label>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map((l) => {
                  const selected = languages.includes(l);
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggleItem(languages, setLanguages, l)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selected
                          ? 'border-brand-500 bg-brand-500/15 text-brand-400'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-end">
            <Button variant="primary" size="md" onClick={() => setStep(2)} className="gap-2">
              <span>Next: Skill Self-Assessment</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Self-Assessed Confidence */}
      {step === 2 && (
        <Card className="border-slate-800 bg-slate-900/60 animate-fadeIn">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sliders className="h-5 w-5 text-sky-400" />
              Technical Confidence Baseline
            </CardTitle>
            <CardDescription>
              Rate your current comfort level across core topics (1 = Beginner, 5 = Interview Ready)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {[
              { key: 'dsa', label: 'Data Structures & Algorithms (LeetCode/Arrays/Trees)' },
              { key: 'oop', label: 'Object-Oriented Programming & Design Patterns' },
              { key: 'dbms', label: 'DBMS (SQL, Normalization, ACID Transactions, Indexing)' },
              { key: 'os', label: 'Operating Systems (Processes, Threads, Deadlocks, Paging)' },
              { key: 'networking', label: 'Computer Networks (TCP/IP, HTTP/S, DNS, Routing)' },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">{label}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleConfidenceChange(key, val)}
                      className={`h-8 w-8 rounded-lg text-xs font-mono font-bold transition-all ${
                        selfAssessment[key] === val
                          ? 'bg-brand-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>

          <CardFooter className="justify-between">
            <Button variant="outline" size="md" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(3)} className="gap-2">
              <span>Next: Practical Experience</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Projects, Communication & Daily Prep Time */}
      {step === 3 && (
        <Card className="border-slate-800 bg-slate-900/60 animate-fadeIn">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Practical Experience & Commitment
            </CardTitle>
            <CardDescription>
              Help us tailor your daily roadmap based on available bandwidth
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Projects Count */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">
                Number of Major Portfolio Projects Built
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setProjectsCount(num)}
                    className={`py-2.5 rounded-lg text-xs font-semibold border text-center transition-colors ${
                      projectsCount === num
                        ? 'border-brand-500 bg-brand-500/20 text-brand-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {num === 3 ? '3+ Projects' : `${num} Project${num === 1 ? '' : 's'}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Prep Commitment */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" /> Daily Dedicated Preparation Time
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 6].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setDailyPrepTimeHours(hours)}
                    className={`py-2.5 rounded-lg text-xs font-semibold border text-center transition-colors ${
                      dailyPrepTimeHours === hours
                        ? 'border-brand-500 bg-brand-500/20 text-brand-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {hours} hr{hours > 1 ? 's' : ''}/day
                  </button>
                ))}
              </div>
            </div>

            {/* Soft Skills & Interview Comfort */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Live Technical Mock Interview Confidence
                  </p>
                  <span className="text-[11px] text-slate-500">Speaking and coding live</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleConfidenceChange('interview', val)}
                      className={`h-7 w-7 rounded-lg text-xs font-mono font-bold ${
                        selfAssessment.interview === val
                          ? 'bg-brand-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Behavioral & HR Communication Comfort
                  </p>
                  <span className="text-[11px] text-slate-500">STAR format, storytelling</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleConfidenceChange('communication', val)}
                      className={`h-7 w-7 rounded-lg text-xs font-mono font-bold ${
                        selfAssessment.communication === val
                          ? 'bg-brand-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-between">
            <Button variant="outline" size="md" onClick={() => setStep(2)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={Boolean(profileLoadError)}
              isLoading={isSubmitting}
              className="gap-2"
            >
              <span>{profileExists ? 'Save profile updates' : 'Complete & Start Assessment'}</span>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default OnboardingPage;
