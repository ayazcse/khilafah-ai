# KHILAFAH Connect: Calls, Stories and Disappearing Media

## Product goal
Add private, consent-based real-time communication to KHILAFAH Connect without introducing a mandatory paid vendor or implying security guarantees that have not been implemented.

## Delivery sequence

### 1. Voice and video calling (WebRTC)
- One-to-one audio and video calls from an accepted inbox conversation.
- Incoming-call accept/decline, outgoing ringing, busy/unavailable states, hang-up.
- In-call microphone mute, camera toggle, camera switch where supported.
- Explicit browser permission prompts; no camera/microphone activation before the user starts or accepts a call.
- Call state machine: idle -> outgoing/incoming -> connecting -> connected -> ended/failed.
- Signaling must be authenticated and authorize both participants against an accepted, unblocked conversation.
- WebRTC media should be peer-to-peer by default. STUN helps discovery; TURN relay is needed for some restrictive networks. A free TURN service cannot be assumed reliable or unlimited, so relay availability must be disclosed.
- Do not persist call audio/video. Do not claim end-to-end encryption beyond the protections WebRTC actually provides and the app's verified signaling implementation.

### 2. Stories and snaps
- Camera/gallery capture with preview before sending.
- Send to selected followers or accepted contacts only; recipient audience is explicit.
- Story expiry after 24 hours.
- Direct snap expiry after first successful view or a short maximum lifetime, whichever comes first.
- Server-authoritative expiry and deletion; client-side hiding alone is not deletion.
- No public media URL. Media access must be authorized per recipient and use short-lived access.
- View-once is a best-effort product control, not a guarantee against screenshots, screen recording, external cameras, or modified clients. Show this limitation clearly.
- Enforce upload size/type limits, validate actual media content, rate-limit uploads, and provide report/block controls.
- Keep media retention short and document backup/deletion limitations.

### 3. Notifications and privacy
- In-app incoming call and new snap notifications first.
- Notification preferences, quiet hours, and call permissions.
- Blocked users cannot call or send snaps.
- Default to followers/accepted contacts; no unsolicited public calling.
- Report and moderation workflow for abusive media.

## Data and infrastructure decisions
- Keep existing FastAPI, PostgreSQL, Next.js and authentication patterns.
- Do not use process-local in-memory signaling as the production source of truth; it breaks across restarts and multiple backend workers.
- Prefer a database-backed short-lived call invitation/signaling channel initially, or a managed realtime channel only if a genuinely free, suitable tier is confirmed.
- Media storage is the main cost risk. Do not put user media on ephemeral Render filesystem or commit uploads to Git. Use a free object-storage tier only after checking current quotas, egress limits, retention and terms; otherwise keep media uploads disabled until a sustainable storage path exists.
- Never add secrets or TURN credentials to frontend source. Use short-lived credentials if a TURN provider is adopted.

## Acceptance criteria
- Only authenticated participants in an accepted conversation can signal a call.
- A blocked user cannot call or send media.
- Call can be declined and ended cleanly; device tracks are stopped on exit.
- Camera/microphone permissions are requested only on explicit action.
- Expired media is inaccessible from the API, not merely hidden in the UI.
- Uploads are validated, size-limited, and recipient-scoped.
- Tests cover authorization, state transitions, expiry, and blocked-user behavior.
- CI passes before merge; production deployment is separately verified before announcing launch.

## Explicit non-goals for the first release
- Group calls, livestreams, public discoverability of snaps, guaranteed screenshot prevention, guaranteed message E2EE, or unlimited free media storage.
