import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getMyProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Target,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const DashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfile();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Loading placement dashboard...</p>
      </div>
    );
  }

  const hasScore = profile && profile.readinessScore !== null && profile.readinessScore !== undefined;

  // Tier calculation
  const getScoreTier = (score) => {
    if (score >= 80) {
      return {
        label: 'Placement Ready',
        color: 'text-brand-400',
        bg: 'bg-brand-500/10 border-brand-500/30',
        desc: 'Strong baseline. Focus on system design, behavioral storytelling, and high-frequency company tags.',
      };
    }
    if (score >= 60) {
      return {
        label: 'Developing Readiness',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        desc: 'Good fundamentals. Targeted practice in identified weak areas will push you into top placement tiers.',
      };
    }
    return {
      label: 'Foundation Phase',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/30',
      desc: 'Build consistency in core CS fundamentals and standard DSA problem-solving patterns.',
    };
  };

  const tier = hasScore ? getScoreTier(profile.readinessScore) : null;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[11px] font-mono text-brand-400 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Placement Intelligence Dashboard</span>
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
            onClick={fetchProfile}
            title="Refresh Data"
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
          <Link to="/assessment">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{hasScore ? 'Retake Assessment' : 'Take Assessment'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* If No Assessment Completed Yet Callout */}
      {!hasScore && (
        <Card className="border-brand-500/30 bg-brand-500/5 backdrop-blur-md p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/30 flex items-center justify-center mx-auto">
            <Target className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white">Diagnostic Assessment Pending</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete your 12-question technical diagnostic test to compute your real Placement Readiness Score and unlock your personalized roadmap.
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

      {/* Main Score & Metrics Section (When assessment completed) */}
      {hasScore && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Readiness Score Card */}
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
                Calculated from diagnostic accuracy, self-baseline, and project depth
              </CardDescription>
            </CardHeader>

            <CardContent className="py-6 flex flex-col items-center justify-center">
              {/* Circular Score Visualizer */}
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
              <span>STATE: Active</span>
            </CardFooter>
          </Card>

          {/* Skill Breakdown */}
          <Card className="lg:col-span-2 border-slate-800 bg-slate-900/60 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sky-400" />
                Comprehensive Skill Breakdown
              </CardTitle>
              <CardDescription>
                Objective category scores based on your answers and technical baseline
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
                <CheckCircle className="h-4 w-4" /> Strong Competencies
              </CardTitle>
              <CardDescription>
                Topics where you demonstrated high placement accuracy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.strongAreas?.length > 0 ? (
                profile.strongAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{area}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Complete additional practice to build strong areas.</p>
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
                High-yield subjects requiring immediate review before interviews
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
                  No critical deficiencies identified. Maintain consistency across your target roles!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommended Next Actions (Deterministic) */}
      {hasScore && profile.recommendations?.length > 0 && (
        <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-brand-500" />
              Recommended Next Actions
            </CardTitle>
            <CardDescription>
              Actionable tasks prioritized to increase your Placement Readiness Score
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {profile.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 mt-0.5 ${
                      rec.priority === 'High'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {rec.priority} Priority
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{rec.category}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{rec.action}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="text-[11px] font-mono text-brand-400 flex items-center gap-1">
                    Ready to practice <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </CardContent>

          <CardFooter className="justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/80">
            <span>Deterministic Placement Roadmap v1</span>
            <span className="text-brand-500 font-medium">Phase 2 Vertical Slice Complete</span>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
