import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, ChevronRight, CircleHelp, Fingerprint, Monitor, Moon, SlidersHorizontal, UserRound } from 'lucide-react';
import { getMyProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';

function SettingRow({ icon: Icon, title, detail, action }) {
  return <div className="flex flex-col gap-3 border-b border-white/[.055] py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="mt-0.5 rounded-lg border border-slate-700/70 bg-slate-800/50 p-2 text-slate-300"><Icon className="h-4 w-4"/></span><div><p className="text-sm font-medium text-slate-200">{title}</p><p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">{detail}</p></div></div>{action&&<div className="shrink-0 sm:pl-5">{action}</div>}</div>;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getMyProfile().then((result)=>{if(active)setProfile(result.profile||null);})
      .catch((err)=>{if(active)setError(err.message||'Settings could not be loaded.');})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[]);

  return <div className="mx-auto max-w-4xl space-y-7">
    <PageHeader eyebrow="Workspace" title="Settings" description="Manage your profile details and understand how your PrepVerse workspace is configured." icon={SlidersHorizontal}/>
    {error&&<div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-sm text-rose-200">{error}</div>}
    <section><div className="mb-3"><p className="pv-label mb-1">Account</p><h2 className="text-sm font-semibold text-white">Your account</h2></div><Card><CardContent className="pt-0"><SettingRow icon={UserRound} title={user?.name||'Student account'} detail={user?.email||'Account email is unavailable.'} action={<Link to="/onboarding"><Button size="sm" variant="outline" className="gap-1.5">Edit profile<ChevronRight className="h-3.5 w-3.5"/></Button></Link>}/><SettingRow icon={Fingerprint} title="Sign-in method" detail={`${user?.provider==='google'?'Google account':'Email and password'} · Sessions use PrepVerse authentication.`}/></CardContent></Card></section>
    <section><div className="mb-3"><p className="pv-label mb-1">Preferences</p><h2 className="text-sm font-semibold text-white">Preparation preferences</h2></div><Card><CardContent className="pt-0"><SettingRow icon={SlidersHorizontal} title="Target role" detail={loading?'Loading your profile…':profile?.targetRole||'Add a target role to guide your plan.'} action={<Link to="/onboarding"><Button size="sm" variant="ghost">Update</Button></Link>}/><SettingRow icon={Monitor} title="Daily preparation time" detail={loading?'Loading your profile…':profile?.dailyPrepTimeHours!=null?`${profile.dailyPrepTimeHours} hours · Used to shape your daily plan.`:'Set your available time in your profile.'} action={<Link to="/onboarding"><Button size="sm" variant="ghost">Update</Button></Link>}/></CardContent></Card></section>
    <section><div className="mb-3"><p className="pv-label mb-1">Workspace</p><h2 className="text-sm font-semibold text-white">Display and notifications</h2></div><Card><CardContent className="pt-0"><SettingRow icon={Moon} title="Appearance" detail="PrepVerse currently uses its dark workspace theme across pages." action={<span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-2.5 py-1 text-[10px] text-slate-400"><Check className="h-3 w-3 text-violet-200"/>Dark</span>}/><SettingRow icon={Bell} title="Notifications" detail="Room and interview notifications are shown in the workspace notification center. Individual delivery preferences are not configurable yet." action={<span className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] text-slate-500">In workspace</span>}/></CardContent></Card></section>
    <div className="flex items-start gap-2 rounded-xl border border-white/[.05] bg-white/[.015] p-4 text-[11px] leading-relaxed text-slate-500"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"/>Account and preparation details are read from your saved profile. Use Profile to edit them; this page does not claim to save settings the account does not support.</div>
  </div>;
}
