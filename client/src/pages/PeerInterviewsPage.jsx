import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock3, Radio, Users } from 'lucide-react';
import { endPeerInterview, getStudyRoom, getStudyRooms, joinPeerInterview, schedulePeerInterview, startPeerInterview } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';

const idOf = (value) => typeof value === 'string' ? value : value?._id || value?.id || '';
const localDateTimeInput = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
const statusStyle = (status) => status === 'in_progress' ? 'border-emerald-300/20 bg-emerald-300/[.07] text-emerald-200' : status === 'ready' ? 'border-violet-300/20 bg-violet-300/[.07] text-violet-200' : status === 'ended' ? 'border-slate-700 bg-slate-800/60 text-slate-400' : 'border-amber-300/20 bg-amber-300/[.06] text-amber-200';

export default function PeerInterviewsPage() {
  const { user } = useAuth();
  const { socket, status: socketStatus, joinRoom, leaveRoom } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [startsAt, setStartsAt] = useState(() => localDateTimeInput(new Date(Date.now()+30*60000)));
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const list = await getStudyRooms();
      const roomList = list.rooms || [];
      const details = await Promise.all(roomList.map(async (room) => {
        const data = await getStudyRoom(idOf(room));
        return data.room;
      }));
      setRooms(details);
      setInterviews(details.flatMap((room) => (room.interviews || []).map((interview) => ({...interview, roomId:idOf(room), roomName:room.name, members:room.members||[]}))).sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt)));
      setRoomId((current)=>details.some((room)=>idOf(room)===current)?current:idOf(details[0]));
    } catch (err) { setError(err.message || 'Could not load your peer interviews.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!socket || socketStatus !== 'connected' || !rooms.length) return undefined;
    let disposed = false;
    const ids = roomIds ? roomIds.split('|') : [];
    Promise.all(ids.map((id)=>joinRoom(id).catch(()=>null)));
    const refresh = () => { if (!disposed) load(); };
    ['interview:created','interview:participant_joined','interview:started','interview:ended'].forEach((event)=>socket.on(event,refresh));
    return () => { disposed=true; ids.forEach(leaveRoom); ['interview:created','interview:participant_joined','interview:started','interview:ended'].forEach((event)=>socket.off(event,refresh)); };
  }, [socket,socketStatus,roomIds,joinRoom,leaveRoom,load]);

  const roomIds = useMemo(() => rooms.map(idOf).filter(Boolean).join('|'), [rooms]);
  const selectedRoom = rooms.find((room)=>idOf(room)===roomId);
  const partners = useMemo(()=>selectedRoom?.members?.filter((member)=>idOf(member)!==user?.id)||[],[selectedRoom,user?.id]);
  useEffect(()=>{ if (!partners.some((person)=>idOf(person)===partnerId)) setPartnerId(''); },[partners,partnerId]);

  const schedule = async (event) => {
    event.preventDefault(); if (!roomId||!partnerId||!startsAt) return;
    setBusyId('schedule');setError('');setNotice('');
    try { await schedulePeerInterview(roomId,{participantId:partnerId,startsAt:new Date(startsAt).toISOString()});setNotice('Interview scheduled. Both participants will receive a notification.');await load(); }
    catch(err){setError(err.message||'Could not schedule this interview.');} finally{setBusyId('');}
  };
  const act = async (interview,action,success) => {
    setBusyId(idOf(interview));setError('');setNotice('');
    try{await action(idOf(interview));setNotice(success);await load();}catch(err){setError(err.message||'Could not update the interview.');}finally{setBusyId('');}
  };

  if(loading)return <div className="mx-auto max-w-6xl space-y-5"><div className="h-8 w-60 animate-pulse rounded bg-slate-800"/><div className="h-52 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50"/><div className="h-32 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50"/></div>;
  const upcoming=interviews.filter((item)=>item.status!=='ended');
  const completed=interviews.filter((item)=>item.status==='ended');

  return <div className="mx-auto max-w-6xl space-y-6">
    <PageHeader eyebrow="Collaborate · Peer interviews" title="Practice with a peer" description="Schedule an interview with someone in one of your study rooms, then manage the session together." icon={CalendarClock} actions={<span className="inline-flex items-center gap-2 text-xs text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${socketStatus==='connected'?'bg-emerald-300':'bg-slate-600'}`}/>{socketStatus==='connected'?'Live updates connected':'Live updates reconnecting'}</span>} />
    {error&&<div role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/[.06] p-3 text-sm text-rose-200">{error}<button className="ml-3 underline" onClick={load}>Retry</button></div>}{notice&&<div role="status" className="rounded-lg border border-emerald-300/20 bg-emerald-300/[.06] p-3 text-sm text-emerald-200">{notice}</div>}
    <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <Card><CardHeader><CardTitle>Schedule an interview</CardTitle><p className="text-xs text-slate-500">Choose a room and one of its members. Room membership is checked by the server.</p></CardHeader><CardContent>{rooms.length?<form onSubmit={schedule} className="space-y-4"><label className="block text-xs font-medium text-slate-400">Study room<select required value={roomId} onChange={(event)=>setRoomId(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">{rooms.map((room)=><option key={idOf(room)} value={idOf(room)}>{room.name}</option>)}</select></label><label className="block text-xs font-medium text-slate-400">Interview partner<select required value={partnerId} onChange={(event)=>setPartnerId(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="">Choose a room member</option>{partners.map((person)=><option key={idOf(person)} value={idOf(person)}>{person.name}</option>)}</select></label><label className="block text-xs font-medium text-slate-400">Date and time<input required type="datetime-local" min={localDateTimeInput(new Date(Date.now()+60000))} value={startsAt} onChange={(event)=>setStartsAt(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"/></label><Button type="submit" isLoading={busyId==='schedule'} disabled={!partnerId||Boolean(busyId)} className="w-full">Schedule peer interview</Button></form>:<div className="rounded-lg border border-dashed border-slate-700 p-5"><p className="text-sm font-medium text-slate-300">Join or create a study room first</p><p className="mt-1 text-xs text-slate-500">Peer interviews are scheduled with members of your rooms.</p><Link to="/rooms"><Button size="sm" className="mt-4">Go to study rooms</Button></Link></div>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-violet-300"/>Interview activity</CardTitle><p className="text-xs text-slate-500">Requests and status are synced for the participants.</p></CardHeader><CardContent><div className="grid grid-cols-2 gap-3"><div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">Upcoming & active</p><p className="mt-1 text-2xl font-semibold text-white">{upcoming.length}</p></div><div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">Completed</p><p className="mt-1 text-2xl font-semibold text-white">{completed.length}</p></div></div><p className="mt-4 text-xs leading-relaxed text-slate-500">Interview reminders and participant updates are delivered through your PrepVerse notifications.</p></CardContent></Card>
    </section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-white">Upcoming and pending</h2><span className="text-xs text-slate-500">{upcoming.length} sessions</span></div>{upcoming.length?<div className="grid gap-3 md:grid-cols-2">{upcoming.map((interview)=>{const host=interview.members.find((member)=>idOf(member)===idOf(interview.host));const peer=interview.members.find((member)=>idOf(member)===idOf(interview.participant));const joined=(interview.joinedUsers||[]).map(idOf);const me=idOf(user?.id);const joinedByBoth=joined.includes(idOf(interview.host))&&joined.includes(idOf(interview.participant));const hasJoined=joined.includes(me);const isHost=idOf(interview.host)===me;return <Card key={idOf(interview)}><CardContent className="pt-0"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-500">{interview.roomName}</p><h3 className="mt-1 text-sm font-semibold text-white">{host?.name||'Room member'} <span className="text-slate-600">with</span> {peer?.name||'Room member'}</h3><p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5"/>{new Date(interview.startsAt).toLocaleString()}</p></div><span className={`rounded-full border px-2 py-1 text-[10px] capitalize ${statusStyle(interview.status)}`}>{interview.status.replace('_',' ')}</span></div><div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3"><span className="text-[11px] text-slate-500">{joined.length}/2 participants joined</span><Link to={`/rooms?room=${interview.roomId}`} className="text-[11px] text-violet-200 hover:text-violet-100">Open room</Link></div><div className="mt-3 flex flex-wrap gap-2">{!hasJoined&&interview.status!=='ended'&&<Button size="sm" variant="secondary" isLoading={busyId===idOf(interview)} disabled={Boolean(busyId)} onClick={()=>act(interview,joinPeerInterview,'You joined the interview.')}>Join</Button>}{isHost&&joinedByBoth&&interview.status==='ready'&&<Button size="sm" isLoading={busyId===idOf(interview)} disabled={Boolean(busyId)} onClick={()=>act(interview,startPeerInterview,'Interview started.')}>Start interview</Button>}{hasJoined&&interview.status!=='ended'&&<Button size="sm" variant="outline" disabled={Boolean(busyId)} onClick={()=>act(interview,endPeerInterview,'Interview ended.')}>End interview</Button>}</div></CardContent></Card>})}</div>:<Card><CardContent className="flex items-center gap-3 py-5"><CalendarClock className="h-4 w-4 text-slate-500"/><div><p className="text-sm text-slate-300">No upcoming interviews</p><p className="mt-1 text-xs text-slate-500">Schedule one with a member of your study room.</p></div></CardContent></Card>}</section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-white">Completed interviews</h2><span className="text-xs text-slate-500">{completed.length} sessions</span></div>{completed.length?<div className="space-y-2">{completed.map((interview)=><div key={idOf(interview)} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/35 p-3"><div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-300"/><div><p className="text-sm text-slate-200">{interview.roomName} · {new Date(interview.startsAt).toLocaleString()}</p><p className="mt-1 text-[11px] text-slate-500">Session ended</p></div></div><Link to={`/rooms?room=${interview.roomId}`}><Button variant="ghost" size="sm">View room</Button></Link></div>)}</div>:<p className="rounded-lg border border-dashed border-slate-800 p-4 text-sm text-slate-500">Completed interviews will be listed here.</p>}</section>
    {socketStatus==='connected'&&<p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600"><Radio className="h-3 w-3 text-emerald-300"/>Interview status updates are realtime</p>}
  </div>;
}
