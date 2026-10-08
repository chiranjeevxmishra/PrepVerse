import React, { useCallback, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
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

  const finishAuthentication = useCallback((user) => {
    if (location.state?.from?.pathname && location.state.from.pathname !== '/') {
      navigate(location.state.from.pathname, { replace: true });
    } else if (!user?.hasCompletedOnboarding) {
      navigate('/onboarding', { replace: true });
    } else if (!user?.hasCompletedAssessment) {
      navigate('/assessment', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [location.state, navigate]);

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
      finishAuthentication(result.user);
    }
  };

  const handleGoogleCredential = useCallback(async (credential) => {
    setFormError('');
    clearError();
    setIsSubmitting(true);
    const result = await googleLogin({ credential });
    setIsSubmitting(false);

    if (result.success) {
      finishAuthentication(result.user);
    }
  }, [clearError, finishAuthentication, googleLogin]);

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
            {/* Google Identity Services renders its own secure sign-in button. */}
            <div className="space-y-3">
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                onError={setFormError}
                disabled={isSubmitting}
              />

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
