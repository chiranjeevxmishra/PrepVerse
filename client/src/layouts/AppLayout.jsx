import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Bell, BookOpenCheck, BriefcaseBusiness, CalendarClock, ChartNoAxesCombined, ChevronRight, ClipboardCheck, GraduationCap, LogIn, LogOut, Menu, MessageSquareText, Radio, Settings2, Users, X } from 'lucide-react';
import Button from '../components/ui/Button';
import { useSocket } from '../context/SocketContext';
import { getMyProfile, markAllNotificationsRead, markNotificationRead } from '../services/api';

const sections = [
  { title: 'Workspace', items: [{ label: 'Command center', path: '/dashboard', icon: Activity }, { label: 'Readiness', path: '/assessment', icon: ClipboardCheck }, { label: 'Preparation plan', path: '/plan', icon: BookOpenCheck }, { label: 'Job analyzer', path: '/job-analyzer', icon: BriefcaseBusiness }, { label: 'Practice center', path: '/practice', icon: GraduationCap }] },
  { title: 'Your progress', items: [{ label: 'Progress', path: '/progress', icon: ChartNoAxesCombined }] },
  { title: 'Collaborate', items: [{ label: 'Peer matching', path: '/peers', icon: MessageSquareText }, { label: 'Study rooms', path: '/rooms', icon: Users }, { label: 'Peer interviews', path: '/interviews', icon: CalendarClock }] },
];

export const AppLayout = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { status: socketStatus, notifications, dismissNotification } = useSocket();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  useEffect(() => { if (isAuthenticated) getMyProfile().then((result) => setProfile(result.profile || null)).catch(() => setProfile(null)); }, [isAuthenticated]);
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const isCurrent = (path) => path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleNotificationRead = async (notification) => {
    if (notification.readAt) return;
    dismissNotification(notification.id);
    try { await markNotificationRead(notification.id); } catch { /* Keep the notification visible; the next server refresh reconciles its state. */ }
  };
  const handleReadAll = async () => {
    notifications.filter((item) => !item.readAt).forEach((item) => dismissNotification(item.id));
    try { await markAllNotificationsRead(); } catch { /* Keep the server-backed notification state available. */ }
  };

  const navContent = isAuthenticated ? sections.map((section) => (
    <div key={section.title} className="mb-5">
      <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[.17em] text-slate-600">{section.title}</p>
      <div className="space-y-0.5">{section.items.filter(() => isAuthenticated).map(({ label, path, icon: Icon }) => (
        <Link key={path} to={path} onClick={() => setMobileNavOpen(false)} aria-current={isCurrent(path) ? 'page' : undefined} className={`pv-nav-link group flex min-h-10 items-center gap-3 rounded-lg border border-transparent px-3 text-[12px] font-medium ${isCurrent(path) ? 'text-violet-100' : 'text-slate-400'}`}>
          <Icon className={`h-4 w-4 shrink-0 ${isCurrent(path) ? 'text-violet-200' : 'text-slate-500 group-hover:text-slate-300'}`} />
          <span className="flex-1">{label}</span>{isCurrent(path) && <span className="h-1.5 w-1.5 rounded-full bg-violet-200"/>}
        </Link>
      ))}</div>
    </div>
  )) : <Link to="/" className="flex min-h-10 items-center gap-3 rounded-lg bg-violet-300/[.07] px-3 text-xs font-medium text-violet-100"><Activity className="h-4 w-4"/>Overview</Link>;

  const notificationPanel = (position) => notificationsOpen && <div className={`absolute z-[70] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-700/80 bg-[#11131a] p-3 shadow-[0_18px_55px_rgba(0,0,0,.5)] ${position}`}>
    <div className="mb-2 flex items-center justify-between border-b border-slate-800 px-1 pb-3"><div><p className="text-sm font-semibold text-white">Notifications</p><p className="mt-0.5 text-[10px] text-slate-500">{unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}</p></div>{unreadCount > 0 && <button type="button" className="text-[10px] text-violet-200 hover:text-white" onClick={handleReadAll}>Mark all read</button>}</div>
    <div className="max-h-80 space-y-1 overflow-y-auto">{notifications.length ? notifications.slice(0, 20).map((item) => <Link key={item.id} to={item.roomId ? `/rooms?room=${item.roomId}` : '/rooms'} onClick={() => { handleNotificationRead(item); setNotificationsOpen(false); }} className={`block rounded-lg p-3 text-xs hover:bg-slate-800/70 ${item.readAt ? 'text-slate-400' : 'bg-slate-800/50 text-slate-100'}`}><span className="flex gap-2"><Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300"/><span>{item.message}<span className="mt-1.5 block text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</span></span></span></Link>) : <p className="px-2 py-7 text-center text-xs text-slate-500">Room activity and interview updates will appear here.</p>}</div>
  </div>;

  return <div className="pv-shell min-h-screen text-slate-100">
    <aside className="pv-sidebar fixed inset-y-0 left-0 z-40 hidden w-[256px] flex-col border-r md:flex">
      <Link to={isAuthenticated?'/dashboard':'/'} className="flex h-[68px] items-center gap-3 border-b border-white/[.06] px-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet-300/15 bg-violet-300/[.06] text-violet-200"><GraduationCap className="h-[18px] w-[18px]"/></span>
        <span><span className="block text-[14px] font-semibold tracking-[-.02em] text-white">PrepVerse</span><span className="mt-0.5 block text-[9px] tracking-wide text-slate-500">Your placement command center</span></span>
      </Link>
      <nav aria-label="Main navigation" className="pv-scrollbar flex-1 overflow-y-auto px-3 py-5">{navContent}</nav>
      {isAuthenticated && <div className="relative border-t border-white/[.06] p-3">
        <div className="mb-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3"><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-slate-600">Target role</p><p className="mt-2 truncate text-xs font-medium text-slate-200">{profile?.targetRole || 'Add your target role'}</p><p className="mt-1 truncate text-[10px] text-slate-500">{profile?.targetCompanies?.length ? profile.targetCompanies.join(', ') : 'Profile and goals'}</p><Link to="/onboarding" className="mt-2 inline-flex items-center text-[10px] text-violet-200 hover:text-white">Edit goals <ChevronRight className="ml-1 h-3 w-3"/></Link></div>
        <div className="mb-2 flex items-center justify-between px-2"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-slate-600">Workspace</span><span className={`h-1.5 w-1.5 rounded-full ${socketStatus==='connected'?'bg-emerald-300':'bg-slate-600'}`} title={`Collaboration ${socketStatus}`}/></div>
        <Link to="/onboarding" className={`mt-1 flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-[11px] transition hover:bg-white/[.04] ${isCurrent('/onboarding')?'text-violet-100':'text-slate-400'}`}><span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 text-[10px] text-slate-300">{user?.avatar?<img src={user.avatar} alt="" className="h-full w-full object-cover"/>:user?.name?.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1 truncate">{user?.name||'Profile'}</span><Settings2 className="h-3.5 w-3.5 text-slate-600"/></Link>
        <Link to="/settings" className={`mt-0.5 flex min-h-9 items-center gap-3 rounded-lg px-3 text-[11px] transition hover:bg-white/[.04] ${isCurrent('/settings')?'text-violet-100':'text-slate-500 hover:text-slate-200'}`}><Settings2 className="h-3.5 w-3.5"/>Settings</Link>
      </div>}
    </aside>

    {mobileNavOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/55 md:hidden" onClick={()=>setMobileNavOpen(false)}/>}
    <div className="flex min-h-screen min-w-0 flex-col md:pl-[256px]">
      <header className="sticky top-0 z-30 border-b border-white/[.06] bg-[#0b0c11]/90 backdrop-blur-xl">
        <div className="flex h-[60px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[.05] hover:text-white md:hidden" aria-label={mobileNavOpen?'Close navigation':'Open navigation'} aria-expanded={mobileNavOpen} onClick={()=>setMobileNavOpen((open)=>!open)}>{mobileNavOpen?<X className="h-4 w-4"/>:<Menu className="h-4 w-4"/>}</button>
            <Link to={isAuthenticated?'/dashboard':'/'} className="flex items-center gap-2 md:hidden"><GraduationCap className="h-[18px] w-[18px] text-violet-200"/><span className="text-[13px] font-semibold text-white">PrepVerse</span></Link>
            <div className="hidden items-center gap-2 text-[11px] md:flex"><span className="text-slate-600">{isAuthenticated?'Workspace':'PrepVerse'}</span><ChevronRight className="h-3 w-3 text-slate-700"/><span className="truncate text-slate-300">{sections.flatMap((section)=>section.items).find((item)=>isCurrent(item.path))?.label||'Overview'}</span></div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated&&<>
              <div className="relative"><button type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={()=>setNotificationsOpen((open)=>!open)} className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/[.05] hover:text-white"><Bell className="h-4 w-4"/>{unreadCount>0&&<span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-200"/>}</button>{notificationPanel('right-0 top-11')}</div>
              <span className="hidden h-5 w-px bg-white/[.08] sm:block"/>
              <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 text-[11px] font-medium text-violet-100">{user?.avatar?<img src={user.avatar} alt="" className="h-full w-full object-cover"/>:user?.name?.charAt(0).toUpperCase()}</span><span className="hidden max-w-36 truncate text-[11px] font-medium text-slate-300 sm:block">{user?.name}</span></div>
              <Button variant="ghost" size="sm" onClick={logout} className="h-9 w-9 p-0 text-slate-500 hover:text-rose-200" title="Sign out" aria-label="Sign out"><LogOut className="h-4 w-4"/></Button>
            </>}
            {!isAuthenticated&&<Link to="/login"><Button size="sm" className="gap-2"><LogIn className="h-3.5 w-3.5"/>Sign in</Button></Link>}
          </div>
        </div>
      </header>
      {mobileNavOpen&&<nav aria-label="Mobile navigation" className="pv-mobile-drawer fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] flex-col border-r border-white/[.08] bg-[#0e1017] px-3 pb-4 pt-16 shadow-2xl md:hidden"><div className="pv-scrollbar flex-1 overflow-y-auto">{navContent}</div>{isAuthenticated&&<div className="border-t border-white/[.07] pt-3"><Link onClick={()=>setMobileNavOpen(false)} to="/onboarding" className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-xs text-slate-300">Profile & goals<ChevronRight className="h-4 w-4"/></Link><Link onClick={()=>setMobileNavOpen(false)} to="/settings" className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-xs text-slate-400"><Settings2 className="h-4 w-4"/>Settings</Link><p className="px-3 pt-2 text-[10px] text-slate-600">Collaboration {socketStatus}</p></div>}</nav>}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-9 lg:py-9"><Outlet/></main>
      <footer className="border-t border-white/[.045] px-4 py-4 text-[10px] text-slate-600 sm:px-6 lg:px-9"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 sm:flex-row"><span>© {new Date().getFullYear()} PrepVerse</span><span>Know where you stand. Know what to do next.</span></div></footer>
    </div>
  </div>;
};

export default AppLayout;
