import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Copy, DoorOpen, MessageCircle, Plus, Send, Users, Wifi, WifiOff } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { createStudyRoom, endPeerInterview, getRoomMessages, getStudyRoom, getStudyRooms, joinPeerInterview, joinStudyRoom, schedulePeerInterview, sendRoomMessage, startPeerInterview } from '../services/api';

const asId = (value) => typeof value === 'string' ? value : value?._id || value?.id || '';
const localDateTimeInput = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const errorMessage = (error) => error?.message || 'Something went wrong. Please try again.';

export default function RoomsPage() {
  const { user } = useAuth();
  const { socket, status: socketStatus, socketError, joinRoom, leaveRoom } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(searchParams.get('room') || '');
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [interviewPartner, setInterviewPartner] = useState('');
  const [interviewStartsAt, setInterviewStartsAt] = useState(() => localDateTimeInput(new Date(Date.now() + 30 * 60 * 1000)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadRooms = useCallback(async () => {
    const data = await getStudyRooms();
    setRooms(data.rooms || []);
    return data.rooms || [];
  }, []);

  const loadSelectedRoom = useCallback(async (roomId) => {
    if (!roomId) return;
    const [roomData, messagesData] = await Promise.all([getStudyRoom(roomId), getRoomMessages(roomId)]);
    setRoom(roomData.room);
    setMessages(messagesData.messages || []);
    setOnlineUsers(roomData.room.onlineUsers || []);
  }, []);

  useEffect(() => {
    loadRooms().catch((err) => setError(errorMessage(err)));
  }, [loadRooms]);

  useEffect(() => {
    const queryId = searchParams.get('room') || '';
    if (queryId !== selectedRoomId) setSelectedRoomId(queryId);
  }, [searchParams, selectedRoomId]);

  useEffect(() => {
    if (!selectedRoomId) { setRoom(null); setMessages([]); return undefined; }
    loadSelectedRoom(selectedRoomId).catch((err) => { setError(errorMessage(err)); setSelectedRoomId(''); setSearchParams({}); });
  }, [selectedRoomId, loadSelectedRoom]);

  useEffect(() => {
    if (!socket || socketStatus !== 'connected' || !selectedRoomId) return undefined;
    let disposed = false;
    const refreshRoom = () => loadSelectedRoom(selectedRoomId).catch(() => {});
    const onMessage = (message) => {
      if (asId(message.room) !== selectedRoomId) return;
      setMessages((current) => current.some((item) => asId(item._id || item.id) === asId(message._id || message.id)) ? current : [...current, message]);
    };
    const onJoined = (payload) => setOnlineUsers((current) => current.some((item) => item.userId === payload.userId) ? current : [...current, payload]);
    const onLeft = (payload) => setOnlineUsers((current) => current.filter((item) => item.userId !== payload.userId));
    const refreshOnRoomActivity = (payload) => {
      if (!payload?.roomId || payload.roomId === selectedRoomId || asId(payload.room) === selectedRoomId) refreshRoom();
    };
    socket.on('room:message', onMessage);
    socket.on('room:user_joined', onJoined);
    socket.on('room:user_left', onLeft);
    socket.on('room:member_joined', refreshRoom);
    socket.on('interview:created', refreshOnRoomActivity);
    socket.on('interview:participant_joined', refreshOnRoomActivity);
    socket.on('interview:started', refreshOnRoomActivity);
    socket.on('interview:ended', refreshOnRoomActivity);
    joinRoom(selectedRoomId).then((data) => { if (!disposed) setOnlineUsers(data.onlineUsers || []); })
      .catch((err) => { if (!disposed) setError(errorMessage(err)); });
    return () => {
      disposed = true;
      leaveRoom(selectedRoomId);
      socket.off('room:message', onMessage);
      socket.off('room:user_joined', onJoined);
      socket.off('room:user_left', onLeft);
      socket.off('room:member_joined', refreshRoom);
      socket.off('interview:created', refreshOnRoomActivity);
      socket.off('interview:participant_joined', refreshOnRoomActivity);
      socket.off('interview:started', refreshOnRoomActivity);
      socket.off('interview:ended', refreshOnRoomActivity);
    };
  }, [socket, socketStatus, selectedRoomId, joinRoom, leaveRoom, loadSelectedRoom]);

  const openRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setSearchParams({ room: roomId });
    setError(''); setNotice('');
  };

  const runAction = async (action, successText = '') => {
    setBusy(true); setError(''); setNotice('');
    try { await action(); if (successText) setNotice(successText); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  const handleCreateRoom = (event) => {
    event.preventDefault();
    runAction(async () => {
      const data = await createStudyRoom(roomName);
      setRoomName(''); setInviteCode(data.room.joinCode); await loadRooms(); openRoom(asId(data.room));
      await loadSelectedRoom(asId(data.room));
    }, 'Study room created. Share the invite code with your peer.');
  };

  const handleJoinRoom = (event) => {
    event.preventDefault();
    runAction(async () => {
      const data = await joinStudyRoom(joinCode);
      setJoinCode(''); await loadRooms(); openRoom(asId(data.room)); await loadSelectedRoom(asId(data.room));
    }, 'You joined the study room.');
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!messageText.trim() || !room) return;
    runAction(async () => {
      await sendRoomMessage(selectedRoomId, { text: messageText, replyTo: replyTo?._id || replyTo?.id || null });
      setMessageText(''); setReplyTo(null);
    });
  };

  const handleScheduleInterview = (event) => {
    event.preventDefault();
    if (!interviewPartner || !interviewStartsAt) return;
    runAction(async () => {
      await schedulePeerInterview(selectedRoomId, { participantId: interviewPartner, startsAt: new Date(interviewStartsAt).toISOString() });
      setInterviewPartner(''); await loadSelectedRoom(selectedRoomId);
    }, 'Peer interview scheduled. Both participants will receive notifications.');
  };

  const handleInterviewAction = (action, successText) => runAction(async () => {
    await action(); await loadSelectedRoom(selectedRoomId);
  }, successText);

  const onlineIds = useMemo(() => new Set(onlineUsers.map((item) => item.userId)), [onlineUsers]);
  const members = room?.members || [];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-mono uppercase tracking-widest text-brand-400">Phase 6 · Real-time communication</p><h1 className="mt-2 text-3xl font-bold text-white">Study rooms</h1><p className="mt-2 text-sm text-slate-400">Find a study partner, share a doubt, and coordinate peer interviews.</p></div><Link to="/practice"><Button variant="outline">Practice center</Button></Link></div>
    {error && <div role="alert" className="rounded-lg border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
    {socketError && <div role="status" className="rounded-lg border border-amber-800 bg-amber-950/30 px-4 py-3 text-xs text-amber-200">Realtime connection: {socketError}. REST room features remain available while it reconnects.</div>}

    {!selectedRoomId ? <div className="grid gap-5 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Create a study room</CardTitle></CardHeader><CardContent><form onSubmit={handleCreateRoom} className="flex flex-col gap-3 sm:flex-row"><input value={roomName} onChange={(event) => setRoomName(event.target.value)} minLength={2} maxLength={80} placeholder="e.g. DSA practice group" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600" /><Button type="submit" disabled={busy || roomName.trim().length < 2} className="gap-2"><Plus className="h-4 w-4" />Create room</Button></form></CardContent></Card>
      <Card><CardHeader><CardTitle>Join with an invite code</CardTitle></CardHeader><CardContent><form onSubmit={handleJoinRoom} className="flex flex-col gap-3 sm:flex-row"><input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} minLength={10} maxLength={10} placeholder="10-character code" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm uppercase tracking-widest text-white placeholder:text-slate-600" /><Button type="submit" variant="secondary" disabled={busy || joinCode.trim().length !== 10} className="gap-2"><DoorOpen className="h-4 w-4" />Join room</Button></form></CardContent></Card>
      <div className="lg:col-span-2"><h2 className="mb-3 text-lg font-semibold text-white">Your rooms</h2>{rooms.length ? <div className="grid gap-3 sm:grid-cols-2">{rooms.map((item) => <Card key={asId(item)} className="flex items-center justify-between gap-3"><div><h3 className="font-semibold text-white">{item.name}</h3><p className="mt-1 text-xs text-slate-400">{item.memberCount} members · {item.onlineUsers?.length || 0} online</p></div><Button size="sm" variant="outline" onClick={() => openRoom(asId(item))}>Open room</Button></Card>)}</div> : <Card><CardContent className="pt-0 text-sm text-slate-500">Create a room or join one using an invite code.</CardContent></Card>}</div>
    </div> : <>
      <Button variant="ghost" onClick={() => { setSelectedRoomId(''); setSearchParams({}); setInviteCode(''); }} className="gap-2"><ArrowLeft className="h-4 w-4" />All rooms</Button>
      {room && <>
        {inviteCode && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4"><div><p className="text-xs text-slate-400">Share this invite code with your study partner</p><p className="mt-1 font-mono text-xl font-bold tracking-[0.25em] text-brand-300">{inviteCode}</p></div><Button variant="secondary" size="sm" onClick={() => { navigator.clipboard?.writeText(inviteCode); setNotice('Invite code copied.'); }} className="gap-2"><Copy className="h-3.5 w-3.5" />Copy code</Button></div>}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
          <div className="space-y-5">
            <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>{room.name}</CardTitle><span className={`inline-flex items-center gap-1 text-xs ${socketStatus === 'connected' ? 'text-emerald-300' : 'text-amber-300'}`}>{socketStatus === 'connected' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{socketStatus}</span></div></CardHeader><CardContent><div className="flex flex-wrap gap-2">{members.map((member) => <span key={asId(member)} className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-300"><span className={`h-2 w-2 rounded-full ${onlineIds.has(asId(member)) ? 'bg-emerald-400' : 'bg-slate-600'}`} />{member.name}{asId(member) === user?.id ? ' (you)' : ''}</span>)}</div><p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><Users className="h-3.5 w-3.5" />{onlineUsers.length} online now · Presence updates live</p></CardContent></Card>
            <Card><CardHeader><CardTitle><span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" />Room discussion</span></CardTitle><p className="text-xs text-slate-400">Post a doubt or reply to a peer. Replies send a private notification to the original author.</p></CardHeader><CardContent><div className="mb-4 max-h-[28rem] space-y-3 overflow-y-auto">{messages.length ? messages.map((message) => <div key={asId(message._id || message.id)} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-brand-300">{message.author?.name || 'Room member'}</p>{message.replyTo && <p className="mt-1 text-[10px] text-slate-500">Replying to an earlier post</p>}</div><button type="button" onClick={() => setReplyTo(message)} className="text-[10px] text-slate-500 hover:text-brand-300">Reply</button></div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{message.text}</p><p className="mt-2 text-[10px] text-slate-600">{new Date(message.createdAt).toLocaleString()}</p></div>) : <p className="py-8 text-center text-sm text-slate-500">Start the discussion with a question.</p>}</div>
              {replyTo && <div className="mb-2 flex items-center justify-between rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-300"><span>Replying to {replyTo.author?.name || 'room post'}</span><button type="button" onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-white">Cancel</button></div>}
              <form onSubmit={handleSendMessage} className="flex items-end gap-2"><textarea rows={2} maxLength={2000} value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Share a doubt or idea…" className="min-w-0 flex-1 resize-y rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-600" /><Button aria-label="Send message" type="submit" disabled={busy || !messageText.trim()} className="gap-2"><Send className="h-4 w-4" /><span className="hidden sm:inline">Send</span></Button></form>
            </CardContent></Card>
          </div>
          <div className="space-y-5">
            <Card><CardHeader><CardTitle><span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" />Peer interviews</span></CardTitle></CardHeader><CardContent className="space-y-4">
              <form onSubmit={handleScheduleInterview} className="space-y-3 rounded-lg border border-slate-800 p-3"><p className="text-xs font-medium text-slate-300">Schedule an interview</p><select value={interviewPartner} onChange={(event) => setInterviewPartner(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Choose a room member</option>{members.filter((member) => asId(member) !== user?.id).map((member) => <option key={asId(member)} value={asId(member)}>{member.name}</option>)}</select><input type="datetime-local" min={localDateTimeInput(new Date(Date.now() + 60 * 1000))} value={interviewStartsAt} onChange={(event) => setInterviewStartsAt(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" /><Button type="submit" size="sm" disabled={busy || !interviewPartner} className="w-full">Schedule peer interview</Button></form>
              {room.interviews?.length ? <div className="space-y-3">{room.interviews.map((interview) => {
                const host = members.find((member) => asId(member) === asId(interview.host));
                const participant = members.find((member) => asId(member) === asId(interview.participant));
                const isHost = asId(interview.host) === user?.id;
                const joinedIds = interview.joinedUsers?.map(asId) || [];
                const bothJoined = joinedIds.includes(asId(interview.host)) && joinedIds.includes(asId(interview.participant));
                const hasJoined = joinedIds.includes(user?.id);
                return <div key={asId(interview)} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium text-white">{host?.name || 'Member'} ↔ {participant?.name || 'Member'}</p><p className="mt-1 text-xs text-slate-400">{new Date(interview.startsAt).toLocaleString()}</p></div><span className={`rounded-full px-2 py-1 text-[10px] capitalize ${interview.status === 'in_progress' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>{interview.status.replace('_', ' ')}</span></div><p className="mt-2 text-[10px] text-slate-500">{joinedIds.length}/2 participants joined</p><div className="mt-3 flex flex-wrap gap-2">{!hasJoined && interview.status !== 'ended' && <Button size="sm" variant="secondary" onClick={() => handleInterviewAction(() => joinPeerInterview(asId(interview)), 'You joined the interview.')} disabled={busy}>Join interview</Button>}{isHost && bothJoined && interview.status === 'ready' && <Button size="sm" onClick={() => handleInterviewAction(() => startPeerInterview(asId(interview)), 'Interview started.')}>Start interview</Button>}{hasJoined && interview.status !== 'ended' && <Button size="sm" variant="outline" onClick={() => handleInterviewAction(() => endPeerInterview(asId(interview)), 'Interview ended.')}>End interview</Button>}</div></div>;
              })}</div> : <p className="text-sm text-slate-500">No peer interviews scheduled in this room.</p>}
            </CardContent></Card>
            <Card><CardHeader><CardTitle>Room members</CardTitle></CardHeader><CardContent className="space-y-2">{members.map((member) => <div key={asId(member)} className="flex items-center justify-between text-sm"><span className="text-slate-300">{member.name}{asId(member) === asId(room.owner) ? ' · host' : ''}</span><span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><span className={`h-2 w-2 rounded-full ${onlineIds.has(asId(member)) ? 'bg-emerald-400' : 'bg-slate-700'}`} />{onlineIds.has(asId(member)) ? 'Online' : 'Offline'}</span></div>)}</CardContent></Card>
          </div>
        </div>
      </>}
    </>}
  </div>;
}
