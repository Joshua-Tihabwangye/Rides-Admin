// Chat + in-app calls for the Admin portal.
// Mirrors the driver/rider chat API: threads are resolved server-side from the
// service context, and every call is persisted as a CallRecord. Admin-initiated
// calls target a specific party via calleeUserId (e.g. the driver on an SOS
// incident) while chat always follows the ride/delivery thread.

import { request } from "./httpClient";

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
  attachments?: Record<string, unknown>[] | null;
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

export function adminSendChatMessage(threadId: string, body: string): Promise<AdminChatMessage> {
  return request<AdminChatMessage>(`/chat/threads/${threadId}/messages`, {
    method: "POST",
    body: { body },
  });
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
