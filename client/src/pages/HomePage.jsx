import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight, BookOpenCheck, BriefcaseBusiness, Check, ChevronRight, CircleHelp, ClipboardCheck, Code2, Compass, GraduationCap, MessagesSquare, ScanSearch, Target, Users, Waypoints } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const journey = [
  { title: 'Assess', description: 'Build an evidence-based baseline.', icon: ClipboardCheck, path: '/assessment' },
  { title: 'Find the gaps', description: 'See strengths and skills to improve.', icon: ScanSearch, path: '/progress' },
  { title: 'Make a plan', description: 'Know what to focus on next.', icon: BookOpenCheck, path: '/plan' },
  { title: 'Practice', description: 'Build confidence through repetition.', icon: Code2, path: '/practice' },
  { title: 'Explore roles', description: 'Compare your skills with a real job.', icon: BriefcaseBusiness, path: '/job-analyzer' },
  { title: 'Prepare together', description: 'Learn with peers in shared rooms.', icon: Users, path: '/peers' },
];
const features = [
  { icon: Target, title: 'Know your baseline', description: 'A technical assessment gives you a grounded view of where you are today.', path: '/assessment', label: 'Assessment' },
  { icon: BookOpenCheck, title: 'A useful next step', description: 'Daily recommendations respond to your assessed gaps and preparation time.', path: '/plan', label: 'Preparation plan' },
  { icon: BriefcaseBusiness, title: 'Understand the role', description: 'Map job requirements against your profile and identify what to strengthen.', path: '/job-analyzer', label: 'Job analysis' },
  { icon: Code2, title: 'Practice with purpose', description: 'Build a focused routine and keep a record of completed sessions.', path: '/practice', label: 'Practice' },
  { icon: Waypoints, title: 'See your progress', description: 'Review assessment, plan, and practice activity saved to your account.', path: '/progress', label: 'Progress' },
  { icon: MessagesSquare, title: 'Learn with peers', description: 'Find preparation partners, share a study room, and schedule interviews.', path: '/rooms', label: 'Collaboration' },
];

function ProductPreview() {
  return <div className="relative mx-auto w-full max-w-[440px]">
    <div aria-hidden="true" className="absolute -inset-8 rounded-[2rem] bg-violet-400/[.035] blur-2xl" />
    <div className="relative overflow-hidden rounded-2xl border border-white/[.09] bg-[#11131a] shadow-[0_28px_90px_rgba(0,0,0,.32)]">
      <div className="flex h-12 items-center justify-between border-b border-white/[.07] px-4"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-600"/><span className="h-2 w-2 rounded-full bg-slate-700"/><span className="h-2 w-2 rounded-full bg-slate-800"/></div><span className="text-[10px] text-slate-500">A workspace built around your next step</span><span className="w-8"/></div>
      <div className="grid min-h-[300px] grid-cols-[54px_1fr] sm:grid-cols-[72px_1fr]">
        <div className="border-r border-white/[.06] p-3"><div className="mx-auto grid h-7 w-7 place-items-center rounded-lg bg-violet-300/10 text-violet-200"><GraduationCap className="h-4 w-4"/></div><div className="mt-5 space-y-3">{[Target,ClipboardCheck,BookOpenCheck,Code2].map((Icon,index)=><span key={index} className={`mx-auto grid h-7 w-7 place-items-center rounded-md ${index===0?'bg-violet-300/10 text-violet-200':'text-slate-600'}`}><Icon className="h-3.5 w-3.5"/></span>)}</div></div>
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between"><div><p className="text-[9px] font-medium uppercase tracking-[.16em] text-slate-500">Your workspace</p><p className="mt-1 text-sm font-semibold text-slate-100">Preparation, with direction</p></div><div className="grid h-7 w-7 place-items-center rounded-full border border-slate-700 text-[10px] text-slate-400">P</div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-xl border border-violet-300/15 bg-violet-300/[.035] p-3.5"><p className="text-[9px] uppercase tracking-[.13em] text-slate-500">Readiness</p><div className="mt-2 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-violet-300/70 border-r-slate-800 border-b-slate-800 text-xs font-semibold text-white">—</div><div><p className="text-xs font-medium text-slate-200">Assessment-based</p><p className="mt-1 text-[9px] text-slate-500">Your score, your evidence</p></div></div><div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-2/3 rounded-full bg-violet-300/60"/></div></div>
            <div className="rounded-xl border border-white/[.06] bg-white/[.015] p-3.5"><p className="text-[9px] uppercase tracking-[.13em] text-slate-500">Next up</p><p className="mt-3 text-xs font-medium text-slate-200">A plan shaped by your gaps</p><div className="mt-3 space-y-2">{['Assess your baseline','Choose a focused task','Practice with intent'].map((label,index)=><div className="flex items-center gap-2" key={label}><span className={`grid h-4 w-4 place-items-center rounded-full border ${index===0?'border-violet-300/50 text-violet-200':'border-slate-700 text-slate-600'}`}>{index===0?<Check className="h-2.5 w-2.5"/>:<span className="h-1 w-1 rounded-full bg-current"/>}</span><span className="text-[9px] text-slate-400">{label}</span></div>)}</div></div>
          </div>
          <div className="mt-3 rounded-xl border border-white/[.06] bg-white/[.015] p-3.5"><div className="flex items-center justify-between"><p className="text-[9px] uppercase tracking-[.13em] text-slate-500">One connected path</p><span className="text-[9px] text-violet-200">From baseline to interview</span></div><div className="mt-3 grid grid-cols-4 gap-2">{['Assess','Prepare','Practice','Collaborate'].map((label,index)=><div key={label} className="relative"><div className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${index===0?'bg-violet-200':'bg-slate-600'}`}/><span className="text-[8px] text-slate-400 sm:text-[9px]">{label}</span></div>{index<3&&<span className="absolute -right-1.5 top-0 text-[8px] text-slate-700">→</span>}</div>)}</div></div>
        </div>
      </div>
    </div>
    <p className="relative mt-2 text-right text-[9px] text-slate-600">Illustrative product preview</p>
  </div>;
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  const startPath = isAuthenticated ? '/dashboard' : '/login';
  return <div className="mx-auto max-w-6xl space-y-20 pb-14 sm:space-y-28">
    <section className="relative grid items-center gap-12 overflow-hidden pt-5 lg:grid-cols-[1.02fr_.98fr] lg:gap-10 lg:pt-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full bg-violet-400/[.035] blur-3xl"/>
      <div className="relative max-w-2xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-300/[.045] px-3 py-1.5 text-[10px] font-medium tracking-wide text-violet-100"><span className="h-1.5 w-1.5 rounded-full bg-violet-300"/>A clearer way to prepare for what’s next</div>
        <h1 className="text-[2.55rem] font-semibold leading-[1.06] tracking-[-.055em] text-white sm:text-5xl lg:text-[3.65rem]">Know where you stand.<br/><span className="text-slate-400">Know what to do next.</span></h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">PrepVerse turns your placement preparation into a clear, measurable path — from assessment to interview.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to={startPath}><Button size="lg" className="w-full gap-2 sm:w-auto">{isAuthenticated?`Continue, ${user?.name?.split(' ')[0]||'student'}`:'Get started'}<ArrowRight className="h-4 w-4"/></Button></Link>
          <a href="#how-it-works"><Button variant="outline" size="lg" className="w-full gap-2 sm:w-auto">Explore PrepVerse<ArrowDownRight className="h-4 w-4"/></Button></a>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-slate-500"><span className="inline-flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-300"/>Evidence-backed readiness</span><span className="inline-flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-300"/>Preparation you can act on</span></div>
      </div>
      <ProductPreview/>
    </section>

    <section id="how-it-works" className="scroll-mt-24 border-y border-white/[.06] py-8 sm:py-10">
      <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="pv-label mb-2">How it works</p><h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">One path. Every part connected.</h2></div><p className="max-w-md text-xs leading-relaxed text-slate-500">Your baseline informs the plan. Your practice builds momentum. Your progress stays tied to what you actually do.</p></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{journey.map(({title,description,icon:Icon,path},index)=><Link to={isAuthenticated?path:'/login'} key={title} className="group relative flex min-h-24 items-center gap-4 rounded-xl border border-transparent p-4 transition duration-200 hover:border-white/[.07] hover:bg-white/[.02]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-300/15 bg-violet-300/[.05] text-violet-200"><Icon className="h-4 w-4"/></span><div className="min-w-0 flex-1"><p className="text-[9px] font-medium uppercase tracking-[.15em] text-slate-600">0{index+1}</p><h3 className="mt-1 text-sm font-medium text-slate-200">{title}</h3><p className="mt-1 text-[11px] leading-relaxed text-slate-500">{description}</p></div><ChevronRight className="h-4 w-4 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-violet-200"/></Link>)}</div>
    </section>

    <section>
      <div className="mb-8 max-w-xl"><p className="pv-label mb-2">Built for real preparation</p><h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Everything you need to make a focused next move.</h2><p className="mt-3 text-sm leading-relaxed text-slate-400">A calm workspace for the work behind the offer: understand your skills, spend time where it matters, and prepare with intention.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{features.map(({icon:Icon,title,description,path,label},index)=><Link key={title} to={isAuthenticated?path:'/login'} className="group flex min-h-52 flex-col rounded-xl border border-white/[.07] bg-white/[.015] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/20 hover:bg-white/[.03]"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg border border-violet-300/15 bg-violet-300/[.05] text-violet-200"><Icon className="h-4 w-4"/></span><span className="text-[9px] font-medium uppercase tracking-[.14em] text-slate-600">{label}</span></div><h3 className="mt-6 text-sm font-semibold text-white">{title}</h3><p className="mt-2 flex-1 text-xs leading-relaxed text-slate-400">{description}</p><span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium text-violet-200">Explore feature<ArrowUpRight className="h-3 w-3 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></span></Link>)}</div>
    </section>

    <section className="grid gap-8 rounded-2xl border border-white/[.07] bg-[#10121a] p-6 sm:p-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:p-10">
      <div><p className="pv-label mb-2 flex items-center gap-2"><Compass className="h-3.5 w-3.5 text-violet-300"/>Designed around evidence</p><h2 className="text-2xl font-semibold tracking-tight text-white">Your preparation should reflect your progress.</h2><p className="mt-3 text-sm leading-relaxed text-slate-400">Readiness comes from your assessment. Recommendations follow your gaps. Practice feedback is based on your submitted work. PrepVerse keeps the next step clear without guessing where you stand.</p><Link to={startPath} className="mt-6 inline-flex"><Button variant="outline" className="gap-2">{isAuthenticated?'Open your workspace':'Build your preparation path'}<ArrowRight className="h-4 w-4"/></Button></Link></div>
      <div className="grid gap-2 sm:grid-cols-2">{[
        {title:'Grounded readiness',copy:'Based on the assessment you complete.',icon:Target},
        {title:'Focused preparation',copy:'Tasks connected to actual skill gaps.',icon:BookOpenCheck},
        {title:'Role awareness',copy:'Job requirements compared with your profile.',icon:BriefcaseBusiness},
        {title:'Shared learning',copy:'Study rooms and peer interview sessions.',icon:Users},
      ].map(({title,copy,icon:Icon})=><div key={title} className="flex items-start gap-3 rounded-xl border border-white/[.06] bg-black/10 p-4"><span className="mt-0.5 text-violet-200"><Icon className="h-4 w-4"/></span><div><p className="text-xs font-medium text-slate-200">{title}</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">{copy}</p></div></div>)}</div>
    </section>

    <section className="relative overflow-hidden rounded-2xl border border-violet-300/15 bg-violet-300/[.035] px-6 py-9 text-center sm:px-10 sm:py-12"><CircleHelp className="mx-auto h-5 w-5 text-violet-200"/><h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Make your next step a clear one.</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">Start with what you know today. PrepVerse helps you turn that baseline into purposeful preparation.</p><Link to={startPath} className="mt-6 inline-flex"><Button size="lg" className="gap-2">{isAuthenticated?`Continue, ${user?.name?.split(' ')[0]||'student'}`:'Get started'}<ArrowRight className="h-4 w-4"/></Button></Link></section>
  </div>;
}
