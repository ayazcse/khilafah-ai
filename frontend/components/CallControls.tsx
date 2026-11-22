"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type SignalCall = {
  id: string; conversation_id: string; call_type: "audio" | "video";
  status: string; caller_id: string; callee_id: string;
  offer: RTCSessionDescriptionInit | null; answer: RTCSessionDescriptionInit | null;
};

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
};

function waitForIce(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise(resolve => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      pc.removeEventListener("icegatheringstatechange", done);
      window.clearTimeout(timeout);
      resolve();
    };
    const done = () => { if (pc.iceGatheringState === "complete") finish(); };
    const timeout = window.setTimeout(finish, 10000);
    pc.addEventListener("icegatheringstatechange", done);
    done();
  });
}

export default function CallControls({ conversationId }: { conversationId?: string }) {
  const [call, setCall] = useState<SignalCall | null>(null);
  const [incoming, setIncoming] = useState<SignalCall | null>(null);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const localRef = useRef<HTMLVideoElement | null>(null);
  const callRef = useRef<SignalCall | null>(null);
  const appliedAnswerRef = useRef(false);

  const cleanup = useCallback(async (notify = false) => {
    const current = callRef.current;
    if (notify && current) {
      try { await api.post("/calls/" + current.id + "/end"); } catch { /* best effort */ }
    }
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    callRef.current = null;
    appliedAnswerRef.current = false;
    setCall(null); setIncoming(null); setPhase(""); setMuted(false); setCameraOff(false);
  }, []);

  useEffect(() => {
    if (!call || call.status !== "ringing" && call.status !== "accepted") return;
    const timer = window.setInterval(async () => {
      try {
        const latest = await api.get<SignalCall>("/calls/" + call.id);
        setCall(latest); callRef.current = latest;
        if (latest.status === "declined" || latest.status === "ended" || latest.status === "expired") {
          await cleanup(false); return;
        }
        if (latest.answer && pcRef.current && !appliedAnswerRef.current && latest.caller_id !== undefined) {
          if (latest.caller_id === latest.callee_id) return;
          if (latest.caller_id && latest.answer && pcRef.current.signalingState === "have-local-offer") {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(latest.answer));
            appliedAnswerRef.current = true; setPhase("Connected");
          }
        }
        if (latest.status === "accepted" && latest.answer) setPhase("Connected");
      } catch { /* transient poll/network error; next poll retries */ }
    }, 1800);
    return () => window.clearInterval(timer);
  }, [call?.id, call?.status, cleanup]);

  useEffect(() => {
    if (call || incoming) return;
    const timer = window.setInterval(async () => {
      try {
        const data = await api.get<{ calls: SignalCall[] }>("/calls/incoming");
        const match = data.calls[0];
        if (match) setIncoming(match);
      } catch { /* inbox remains usable if call polling is unavailable */ }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [call, incoming, conversationId]);

  async function start(kind: "audio" | "video") {
    if (!conversationId) return;
    setError(""); setPhase("Requesting device permission…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === "video" });
      streamRef.current = stream;
      const pc = new RTCPeerConnection(ICE_SERVERS); pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.ontrack = event => { if (remoteRef.current && event.streams[0]) remoteRef.current.srcObject = event.streams[0]; };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setPhase("Connected");
        if (pc.connectionState === "failed") setError("Network could not connect this call. Try another network; some networks require a TURN relay.");
        if (pc.connectionState === "disconnected") setPhase("Reconnecting…");
      };
      if (localRef.current) localRef.current.srcObject = stream;
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer); await waitForIce(pc);
      const created = await api.post<SignalCall>("/calls", {
        call_type: kind, offer: { conversation_id: conversationId, sdp: pc.localDescription?.sdp },
      });
      callRef.current = created; setCall(created); setPhase("Calling…");
    } catch (e) {
      await cleanup(false);
      setError(e instanceof Error ? e.message : "Could not start the call. Check device permissions.");
    }
  }

  async function accept() {
    if (!incoming?.offer) return;
    setError(""); setPhase("Joining call…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: incoming.call_type === "video" });
      streamRef.current = stream;
      const pc = new RTCPeerConnection(ICE_SERVERS); pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.ontrack = event => { if (remoteRef.current && event.streams[0]) remoteRef.current.srcObject = event.streams[0]; };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setPhase("Connected");
        if (pc.connectionState === "failed") setError("Network could not connect this call. Try another network; some networks require a TURN relay.");
        if (pc.connectionState === "disconnected") setPhase("Reconnecting…");
      };
      if (localRef.current) localRef.current.srcObject = stream;
      await pc.setRemoteDescription(new RTCSessionDescription(incoming.offer));
      const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); await waitForIce(pc);
      const accepted = await api.post<SignalCall>("/calls/" + incoming.id + "/accept", {
        answer: { sdp: pc.localDescription?.sdp },
      });
      callRef.current = accepted; setCall(accepted); setIncoming(null); setPhase("Connecting…");
    } catch (e) {
      await cleanup(false);
      setError(e instanceof Error ? e.message : "Could not accept the call.");
    }
  }

  async function decline() {
    if (!incoming) return;
    try { await api.post("/calls/" + incoming.id + "/decline"); } catch { /* best effort */ }
    setIncoming(null);
  }

  function toggleMute() {
    const next = !muted; streamRef.current?.getAudioTracks().forEach(track => track.enabled = !next); setMuted(next);
  }
  function toggleCamera() {
    const next = !cameraOff; streamRef.current?.getVideoTracks().forEach(track => track.enabled = !next); setCameraOff(next);
  }

  return <div className="flex flex-wrap items-center gap-2">
    {!call && !incoming && conversationId && <>
      <button type="button" onClick={() => start("audio")} className="rounded-full border border-emerald-300/30 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-300/10" aria-label="Start voice call">☎ Voice</button>
      <button type="button" onClick={() => start("video")} className="rounded-full border border-sky-300/30 px-3 py-2 text-xs text-sky-100 hover:bg-sky-300/10" aria-label="Start video call">▣ Video</button>
    </>}
    {incoming && <div className="flex items-center gap-2 rounded-xl bg-emerald-300/10 border border-emerald-200/20 p-2">
      <span className="text-xs text-emerald-100">Incoming {incoming.call_type} call</span>
      <button type="button" onClick={accept} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white">Accept</button>
      <button type="button" onClick={decline} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white">Decline</button>
    </div>}
    {call && <div className="flex items-center gap-2">
      <span className="text-xs text-emerald-100">{phase || call.status}</span>
      <button type="button" onClick={toggleMute} className="rounded-full border border-white/20 px-3 py-2 text-xs text-white">{muted ? "Unmute" : "Mute"}</button>
      {call.call_type === "video" && <button type="button" onClick={toggleCamera} className="rounded-full border border-white/20 px-3 py-2 text-xs text-white">{cameraOff ? "Camera on" : "Camera off"}</button>}
      <button type="button" onClick={() => cleanup(true)} className="rounded-full bg-red-700 px-3 py-2 text-xs text-white">End call</button>
    </div>}
    {(call || incoming) && <div className="fixed z-50 bottom-4 right-4 w-64 rounded-2xl border border-white/15 bg-[#0b1722] p-2 shadow-2xl">
      <video ref={remoteRef} autoPlay playsInline className="w-full aspect-video rounded-lg bg-black object-cover" />
      <video ref={localRef} autoPlay muted playsInline className="absolute bottom-12 right-4 w-20 aspect-video rounded-md border border-white/30 bg-black object-cover" />
      <p className="text-[10px] text-slate-400 px-1 pt-1">Media is peer-to-peer. STUN fallback is enabled; restrictive networks may still require a TURN relay.</p>
    </div>}
    {error && <span role="alert" className="text-xs text-red-300">{error}</span>}
  </div>;
}
