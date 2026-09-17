import { describe, expect, it, vi } from "vitest";
import { attachAdminRealtimeSocket, type AdminRealtimeSocket } from "./adminRealtime";

function mockSocket() {
  const handlers = new Map<string, (...args: any[]) => void>();
  const socket: AdminRealtimeSocket & {
    trigger: (event: string, payload?: unknown) => void;
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  } = {
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      handlers.set(event, handler);
    }),
    off: vi.fn((event: string) => {
      handlers.delete(event);
    }),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    trigger: (event: string, payload?: unknown) => {
      handlers.get(event)?.(payload);
    },
  };
  return socket;
}

describe("attachAdminRealtimeSocket", () => {
  it("subscribes rooms and refires on reconnect", () => {
    const socket = mockSocket();
    const onConnected = vi.fn();

    attachAdminRealtimeSocket(socket, {
      rooms: ["operations"],
      onConnected,
      events: {},
    });

    expect(socket.connect).toHaveBeenCalledTimes(1);

    socket.trigger("connect");
    socket.trigger("reconnect");

    expect(socket.emit).toHaveBeenCalledWith("subscribe", { rooms: ["operations"] });
    expect(socket.emit).toHaveBeenCalledTimes(2);
    expect(onConnected).toHaveBeenCalledTimes(2);
  });

  it("registers realtime event handlers and removes them on cleanup", () => {
    const socket = mockSocket();
    const handler = vi.fn();
    const detach = attachAdminRealtimeSocket(socket, {
      rooms: ["operations"],
      events: {
        "safety.incident.new": handler,
      },
    });

    socket.trigger("safety.incident.new", { incident: { id: "incident-1" } });
    expect(handler).toHaveBeenCalledWith({ incident: { id: "incident-1" } });

    detach();
    expect(socket.off).toHaveBeenCalledWith("safety.incident.new", handler);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it("marks disconnect and connect errors as disconnected", () => {
    const socket = mockSocket();
    const onDisconnected = vi.fn();
    attachAdminRealtimeSocket(socket, {
      events: {},
      onDisconnected,
    });

    socket.trigger("connect_error");
    socket.trigger("disconnect");

    expect(onDisconnected).toHaveBeenCalledTimes(2);
  });
});
