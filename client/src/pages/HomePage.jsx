import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { checkHealth, getCurrentUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Server,
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  UserX,
  Lock,
  LogIn,
} from 'lucide-react';

export const HomePage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState(null);

  const [protectedData, setProtectedData] = useState(null);
  const [loadingProtected, setLoadingProtected] = useState(false);
  const [protectedError, setProtectedError] = useState(null);

  const [testInput, setTestInput] = useState('');
  const { user, isAuthenticated, logout } = useAuth();

  const fetchHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const data = await checkHealth();
      setHealthData(data);
    } catch (err) {
      setHealthError(err.message || 'Unable to reach backend API');
    } finally {
      setLoadingHealth(false);
    }
  };

  const testProtectedMe = async () => {
    setLoadingProtected(true);
    setProtectedError(null);
    try {
      const data = await getCurrentUser();
      setProtectedData(data);
    } catch (err) {
      setProtectedData(null);
      setProtectedError(err.message || 'Access denied / Unauthenticated');
    } finally {
      setLoadingProtected(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    if (isAuthenticated) {
      testProtectedMe();
    } else {
      setProtectedData(null);
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Section */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-medium text-brand-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Phase 1: Production Authentication Active</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          PrepVerse Placement OS
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Your personal placement preparation network. Authentication is running with secure HTTP-only cookies, JWT tokens, bcrypt encryption, rate limiting, and Google OAuth support.
        </p>
      </div>

      {/* Grid: Diagnostics, Protected Route Test, and Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backend Diagnostics Card */}
        <Card className="lg:col-span-1 border-slate-800 bg-slate-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Server className="h-4 w-4 text-brand-500" />
                Backend Diagnostics
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchHealth}
                isLoading={loadingHealth}
                title="Refresh Status"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <CardDescription>
              Ping to <code className="text-brand-500 font-mono">GET /api/v1/health</code>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs font-mono">
            {healthError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-rose-400 shrink-0" />
                <div>
                  <p className="font-semibold">Backend Unreachable</p>
                  <p className="text-[11px] text-rose-400">{healthError}</p>
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

        {/* Live Authentication & Protected Endpoint Status */}
        <Card className="lg:col-span-2 border-slate-800 bg-slate-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <ShieldCheck className="h-4 w-4 text-brand-500" />
                Authentication State & Protected API Test
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={testProtectedMe}
                isLoading={loadingProtected}
                title="Test GET /api/v1/auth/me"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <CardDescription>
              Testing protected route <code className="text-brand-500 font-mono">GET /api/v1/auth/me</code> via JWT / Cookie
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isAuthenticated && user ? (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-full border border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-brand-500/20 text-brand-500 font-bold flex items-center justify-center">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        {user.name}
                        <span className="px-2 py-0.5 text-[10px] uppercase font-mono rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                          {user.role}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="danger" size="sm" onClick={logout}>
                      Sign Out
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">AUTH PROVIDER</span>
                    <span className="text-slate-300 capitalize">{user.provider || 'local'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SESSION TYPE</span>
                    <span className="text-slate-300">HTTP-Only Cookie + JWT</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SECURITY</span>
                    <span className="text-brand-500">Rate Limited & Helmet</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ENDPOINT /me</span>
                    <span className="text-emerald-400">200 OK Authorized</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Unauthenticated Session</h4>
                    <p className="text-xs text-slate-400">
                      You are browsing as a guest. Authenticate to test protected API routes and view student state.
                    </p>
                  </div>
                </div>

                <Link to="/login">
                  <Button variant="primary" size="sm" className="gap-1.5 shrink-0">
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In or Register</span>
                  </Button>
                </Link>
              </div>
            )}

            {/* Response Payload Inspector */}
            <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                <span>Response from GET /api/v1/auth/me</span>
                <span className={isAuthenticated ? 'text-emerald-400' : 'text-amber-400'}>
                  {isAuthenticated ? 'Status: 200 OK' : 'Status: 401 Unauthorized'}
                </span>
              </div>
              <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                {protectedData
                  ? JSON.stringify(protectedData, null, 2)
                  : protectedError
                  ? JSON.stringify({ success: false, message: protectedError }, null, 2)
                  : JSON.stringify({ message: 'Click refresh or authenticate to inspect payload' }, null, 2)}
              </pre>
            </div>
          </CardContent>

          <CardFooter className="justify-between text-xs text-slate-400">
            <span>Status: Phase 1 Feature Slice</span>
            <span className="flex items-center gap-1 text-brand-500 font-medium">
              Next: Phase 2 Student Onboarding & Profiles <ArrowRight className="h-3 w-3" />
            </span>
          </CardFooter>
        </Card>
      </div>

      {/* Component Sandbox: Reusable UI Design Tokens */}
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
