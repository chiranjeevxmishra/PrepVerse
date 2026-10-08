import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Shield, Cpu, Activity, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import Button from '../components/ui/Button';

export const AppLayout = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { label: 'Overview', path: '/' },
    ...(isAuthenticated
      ? [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Job Analyzer', path: '/job-analyzer' },
          { label: 'Assessment', path: '/assessment' },
          { label: 'Onboarding', path: '/onboarding' },
        ]
      : []),
    { label: 'Rooms (Phase 6)', path: '/rooms', disabled: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500 group-hover:bg-brand-500 group-hover:text-slate-950 transition-colors">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">
                PrepVerse
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">
                Placement OS
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              if (item.disabled) {
                return (
                  <span
                    key={item.label}
                    className="text-xs px-3 py-1.5 text-slate-500 font-medium rounded-md cursor-not-allowed hidden md:inline-block"
                  >
                    {item.label}
                  </span>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`text-xs px-3 py-1.5 font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-6 w-6 rounded-full bg-slate-800 object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center text-xs font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-medium text-slate-200 leading-none">
                      {user.name}
                    </p>
                    <span className="text-[10px] text-brand-500 font-mono uppercase">
                      {user.role}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-slate-400 hover:text-rose-400 gap-1.5"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PrepVerse — Personal Placement Operating System</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3 w-3 text-brand-500" /> Secure JWT/Cookie Auth
            </span>
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3 text-sky-400" /> Google OAuth Ready
            </span>
            <span className="inline-flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-400" /> Protected API Routes
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
