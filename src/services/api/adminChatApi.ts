// Chat + in-app calls for the Admin portal.
// Mirrors the driver/rider chat API: threads are resolved server-side from the
// service context, and every call is persisted as a CallRecord. Admin-initiated
// calls target a specific party via calleeUserId (e.g. the driver on an SOS
// incident) while chat always follows the ride/delivery thread.

import { request, upload } from "./httpClient";

export type AdminChatContextType = "RIDE" | "DELIVERY";

export type AdminChatUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

export type AdminChatThread = {
  id: string;
  contextType: string;
  contextId: string;
  createdByUserId: string;
  lastMessageAt?: string | null;
  createdAt: string;
};

export type AdminChatMessage = {
  id: string;
  threadId: string;
  senderUserId: string;
  body: string;
  attachments?: Array<string | Record<string, unknown>> | null;
  createdAt: string;
};

export type AdminChatParticipant = {
  threadId: string;
  userId: string;
  lastReadAt?: string | null;
  joinedAt: string;
  user?: AdminChatUser;
};

export type AdminThreadWithParticipants = {
  thread: AdminChatThread;
  participants: AdminChatParticipant[];
};

export type AdminChatMessagePage = {
  items: AdminChatMessage[];
  meta: { page: number; limit: number; total: number; pageCount: number };
};

export type AdminCallMediaType = "audio" | "video";

export type AdminCallStatus = "RINGING" | "ANSWERED" | "DECLINED" | "MISSED" | "ENDED";

export type AdminCallRecord = {
  id: string;
  callerUserId: string;
  calleeUserId?: string | null;
  serviceType?: string | null;
  serviceId?: string | null;
  status: AdminCallStatus;
  mediaType?: AdminCallMediaType | null;
  answeredAt?: string | null;
  endedAt?: string | null;
  declinedBy?: string | null;
  durationSeconds?: number | null;
  createdAt: string;
};

export type AdminInitiateCallResult = {
  call: AdminCallRecord;
  signaling: { stun: { urls: string }[] };
  callee: { userId: string; firstName?: string; lastName?: string };
};

export type AdminCallListPage = {
  items: AdminCallRecord[];
  meta: { page: number; limit: number; total: number; pageCount: number };
};

export function adminGetOrCreateServiceThread(
  contextType: AdminChatContextType,
  contextId: string,
): Promise<AdminThreadWithParticipants> {
  return request<AdminThreadWithParticipants>("/chat/threads/service", {
    method: "POST",
    body: { contextType, contextId },
  });
}

export function adminListChatMessages(
  threadId: string,
  page = 1,
  limit = 50,
): Promise<AdminChatMessagePage> {
  return request<AdminChatMessagePage>(
    `/chat/threads/${threadId}/messages?page=${page}&limit=${limit}`,
    { method: "GET" },
  );
}

export function adminSendChatMessage(
  threadId: string,
  body: string,
  attachments?: Array<string | Record<string, unknown>>,
): Promise<AdminChatMessage> {
  return request<AdminChatMessage>(`/chat/threads/${threadId}/messages`, {
    method: "POST",
    body: {
      ...(attachments?.length ? { body, attachments } : { body }),
    },
  });
}

export type AdminUploadedFile = {
  id: string;
  fileAssetId: string;
  fileKey: string;
  fileUrl: string;
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
};

/**
 * Upload a chat voice note (PRIVATE, long-lived signed URL). Requires the
 * backend to be reached via the same origin/proxy used by `request`.
 */
export function adminUploadChatVoiceNote(file: File): Promise<AdminUploadedFile> {
  return upload<AdminUploadedFile>("/files/upload", file, {
    query: {
      visibility: "PRIVATE",
      ttlSeconds: 30 * 24 * 60 * 60,
    },
  });
}

/**
 * A voice-note attachment persisted on a chat message. `url` is a long-lived
 * signed download URL produced by /files/upload with a chat TTL.
 */
export type AdminVoiceNoteAttachment = {
  kind: "voice-note";
  url: string;
  mimeType: string;
  durationMs: number;
  sizeBytes: number;
};

export function isVoiceNoteAttachment(
  attachment: string | Record<string, unknown>,
): attachment is AdminVoiceNoteAttachment {
  if (typeof attachment === "string") return false;
  return (
    attachment?.kind === "voice-note" &&
    typeof attachment.url === "string" &&
    typeof attachment.mimeType === "string"
  );
}

export function voiceNoteUrlOf(message: AdminChatMessage): string | null {
  const attachment = message.attachments?.find(isVoiceNoteAttachment);
  return attachment ? attachment.url : null;
}

export function adminMarkChatThreadRead(
  threadId: string,
): Promise<{ read: boolean; at: string }> {
  return request<{ read: boolean; at: string }>(`/chat/threads/${threadId}/read`, {
    method: "POST",
  });
}

export function adminInitiateChatCall(input: {
  serviceType?: string;
  serviceId?: string;
  calleeUserId?: string;
  mediaType?: AdminCallMediaType;
}): Promise<AdminInitiateCallResult> {
  return request<AdminInitiateCallResult>("/chat/calls", {
    method: "POST",
    body: input,
  });
}

export function adminRespondToChatCall(
  callId: string,
  action: "ANSWER" | "DECLINE",
): Promise<AdminCallRecord> {
  return request<AdminCallRecord>(`/chat/calls/${callId}/respond`, {
    method: "POST",
    body: { action },
  });
}

export function adminEndChatCall(callId: string): Promise<AdminCallRecord> {
  return request<AdminCallRecord>(`/chat/calls/${callId}/end`, { method: "POST" });
}

export function adminListChatCalls(params?: {
  serviceType?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
}): Promise<AdminCallListPage> {
  const query = new URLSearchParams();
  if (params?.serviceType) query.set("serviceType", params.serviceType);
  if (params?.serviceId) query.set("serviceId", params.serviceId);
  query.set("page", String(params?.page ?? 1));
  query.set("limit", String(params?.limit ?? 50));
  return request<AdminCallListPage>(`/chat/calls?${query.toString()}`, { method: "GET" });
}

export function adminDisplayNameOf(user?: AdminChatUser | null): string {
  if (!user) return "User";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";
}

export type AdminSosSessionView = {
  id: string;
  incidentId: string;
  status: "RINGING" | "CONNECTED" | "ENDED" | "PARTIAL_FAILURE";
  startedAt: string;
  answeredAt?: string | null;
  endedAt?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
};

export type AdminSosSessionDetail = {
  session: AdminSosSessionView;
  emergency: {
    address: string | null;
    latitude: number;
    longitude: number;
    mapUrl: string;
    createdAt: string;
  };
  recipients: Array<{
    id: string;
    type: "ADMIN" | "EMERGENCY_CONTACT" | "POLICE";
    name: string;
    channel: "IN_APP" | "VOICE";
    status: string;
    callId?: string;
    failureReason?: string;
  }>;
  signaling: { iceServers: unknown };
};

export function adminGetSosSession(sessionId: string): Promise<AdminSosSessionDetail> {
  return request<AdminSosSessionDetail>(`/chat/calls/sos/session/${sessionId}`, { method: "GET" });
}

export function adminUpdateSosSessionLocation(
  sessionId: string,
  input: { latitude: number; longitude: number; address?: string; accuracyMeters?: number },
): Promise<{ session: AdminSosSessionView }> {
  return request<{ session: AdminSosSessionView }>(`/chat/calls/sos/session/${sessionId}/location`, {
    method: "POST",
    body: input,
  });
}

export function adminGetSosSessionByIncident(incidentId: string): Promise<AdminSosSessionDetail> {
  return request<AdminSosSessionDetail>(`/chat/calls/sos/by-incident/${incidentId}`, { method: "GET" });
}
