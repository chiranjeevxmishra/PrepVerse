import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Mail, Lock, User as UserIcon, AlertCircle, ArrowLeft } from 'lucide-react';

export const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, register, googleLogin, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (isSignUp && !name) {
      setFormError('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    let result;
    if (isSignUp) {
      result = await register(name, email, password);
    } else {
      result = await login(email, password);
    }
    setIsSubmitting(false);

    if (result.success) {
      if (location.state?.from?.pathname && location.state.from.pathname !== '/') {
        navigate(location.state.from.pathname, { replace: true });
      } else if (!result.user?.hasCompletedOnboarding) {
        navigate('/onboarding', { replace: true });
      } else if (!result.user?.hasCompletedAssessment) {
        navigate('/assessment', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  const handleDemoGoogleLogin = async () => {
    setFormError('');
    clearError();
    setIsSubmitting(true);
    const result = await googleLogin({
      isDemo: true,
      email: 'student.alex@prepverse.dev',
      name: 'Alex Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexChen',
    });
    setIsSubmitting(false);

    if (result.success) {
      if (location.state?.from?.pathname && location.state.from.pathname !== '/') {
        navigate(location.state.from.pathname, { replace: true });
      } else if (!result.user?.hasCompletedOnboarding) {
        navigate('/onboarding', { replace: true });
      } else if (!result.user?.hasCompletedAssessment) {
        navigate('/assessment', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  const switchMode = (signUpMode) => {
    setIsSignUp(signUpMode);
    setFormError('');
    clearError();
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to System Overview
        </Link>

        <Card className="border-slate-800 bg-slate-900/70 backdrop-blur-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl sm:text-2xl text-white">
              {isSignUp ? 'Join PrepVerse' : 'Welcome to PrepVerse'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Create your student account to build your readiness profile'
                : 'Sign in to access your placement dashboard and roadmap'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-3">
            {/* OAuth: Google Sign-in */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleDemoGoogleLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-sm font-medium text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-mono absolute">
                  or email
                </span>
              </div>
            </div>

            {/* Error Message Alert */}
            {(formError || authError) && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="h-4 w-4 mt-0.5 text-rose-400 shrink-0" />
                <span>{formError || authError}</span>
              </div>
            )}

            {/* Standard Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignUp && (
                <Input
                  label="Full Name"
                  id="name"
                  type="text"
                  placeholder="e.g. Alex Chen"
                  icon={UserIcon}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              )}

              <Input
                label="Email Address"
                id="email"
                type="email"
                placeholder="student@college.edu"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />

              <Input
                label="Password"
                id="password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isSubmitting}
              >
                {isSignUp ? 'Create Student Account' : 'Sign In'}
              </Button>
            </form>

            {/* Switch Mode Toggle */}
            <div className="text-center pt-2 border-t border-slate-800/80">
              {isSignUp ? (
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className="text-brand-500 font-medium hover:underline focus:outline-none"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  New to PrepVerse?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className="text-brand-500 font-medium hover:underline focus:outline-none"
                  >
                    Create student account
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
