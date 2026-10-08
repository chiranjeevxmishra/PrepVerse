import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { checkHealth } from '../services/api';
import {
  Server,
  Database,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const HomePage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testInput, setTestInput] = useState('');

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkHealth();
      setHealthData(data);
    } catch (err) {
      setError(err.message || 'Unable to reach backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Section */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-medium text-brand-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Phase 0: Project Architecture Initialized</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          PrepVerse Foundation
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          The personal placement preparation operating system for students. Below is the verified full-stack architecture foundation connecting your React client to the Express API and MongoDB.
        </p>
      </div>

      {/* Grid: Live Diagnostics & Architecture Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Diagnostics Card */}
        <Card className="lg:col-span-1 border-slate-800 bg-slate-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-4 w-4 text-brand-500" />
                Backend Diagnostics
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchHealth}
                isLoading={loading}
                title="Refresh Status"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <CardDescription>
              Live ping to <code className="text-brand-500 font-mono">GET /api/v1/health</code>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs font-mono">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-rose-400 shrink-0" />
                <div>
                  <p className="font-semibold">Backend Unreachable</p>
                  <p className="text-[11px] text-rose-400">{error}</p>
                </div>
              </div>
            )}

            {healthData && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" /> API Server
                  </span>
                  <span className="text-brand-500 font-semibold uppercase">
                    {healthData.status}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-sky-400" /> Database
                  </span>
                  <span
                    className={`font-semibold capitalize ${
                      healthData.database?.connected
                        ? 'text-brand-500'
                        : 'text-amber-400'
                    }`}
                  >
                    {healthData.database?.status || 'unknown'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400">Environment</span>
                  <span className="text-slate-200">{healthData.environment}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400">Uptime</span>
                  <span className="text-slate-200">{healthData.uptimeSeconds}s</span>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="text-[11px] text-slate-500 justify-between">
            <span>Protocol: HTTP REST</span>
            <span>Version: v1</span>
          </CardFooter>
        </Card>

        {/* Architecture Pipeline Card */}
        <Card className="lg:col-span-2 border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              Verified Data Flow Pipeline
            </CardTitle>
            <CardDescription>
              Clean separation of client, API routing, server middleware, and data persistence
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-brand-500 font-mono uppercase block mb-1">
                  Step 1
                </span>
                <p className="font-semibold text-sm text-white">Browser (React)</p>
                <p className="text-xs text-slate-400 mt-1">Vite + Tailwind</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-sky-400 font-mono uppercase block mb-1">
                  Step 2
                </span>
                <p className="font-semibold text-sm text-white">API Gateway</p>
                <p className="text-xs text-slate-400 mt-1">/api/v1/health</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-indigo-400 font-mono uppercase block mb-1">
                  Step 3
                </span>
                <p className="font-semibold text-sm text-white">Express Server</p>
                <p className="text-xs text-slate-400 mt-1">Helmet, CORS, Error</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-emerald-400 font-mono uppercase block mb-1">
                  Step 4
                </span>
                <p className="font-semibold text-sm text-white">MongoDB</p>
                <p className="text-xs text-slate-400 mt-1">Mongoose User Model</p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs text-slate-400 space-y-1">
              <p className="text-slate-300 font-semibold mb-2"># Future Architecture Readiness (Planned):</p>
              <p>• WebSockets (Socket.IO): Peer interview presence & live study rooms</p>
              <p>• Redis Caching: Fast leaderboard queries & distributed session store</p>
              <p>• AI Service: Deterministic Job Description parsing & interview feedback</p>
            </div>
          </CardContent>

          <CardFooter className="justify-between text-xs text-slate-400">
            <span>Status: Phase 0 Completed</span>
            <span className="flex items-center gap-1 text-brand-500 font-medium">
              Ready for Phase 1 <ArrowRight className="h-3 w-3" />
            </span>
          </CardFooter>
        </Card>
      </div>

      {/* Component Sandbox: Verifying UI Design Tokens */}
      <Card className="border-slate-800 bg-slate-900/30">
        <CardHeader>
          <CardTitle>Design Token & Component Verification</CardTitle>
          <CardDescription>
            Reusable UI components ready for upcoming vertical slices (Button, Input, Card)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Test Student Input"
              placeholder="e.g. chiranjeev@prepverse.dev"
              icon={Search}
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              helperText="Testing reusable input styling and icon slot"
            />

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Button Variant Verification
              </label>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm">Primary</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="outline" size="sm">Outline</Button>
                <Button variant="ghost" size="sm">Ghost</Button>
                <Button variant="danger" size="sm">Danger</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
