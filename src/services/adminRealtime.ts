type SocketHandler = (...args: any[]) => void;

export type AdminRealtimeSocket = {
  on: (event: string, handler: SocketHandler) => void;
  off: (event: string, handler: SocketHandler) => void;
  emit: (event: string, payload?: unknown) => void;
  connect: () => void;
  disconnect: () => void;
};

export type AdminRealtimeOptions = {
  rooms?: string[];
  events: Record<string, SocketHandler>;
  onConnected?: () => void;
  onDisconnected?: () => void;
};

export function attachAdminRealtimeSocket(
  socket: AdminRealtimeSocket,
  options: AdminRealtimeOptions,
): () => void {
  const subscribe = () => {
    if (options.rooms?.length) {
      socket.emit("subscribe", { rooms: options.rooms });
    }
    options.onConnected?.();
  };
  const disconnected = () => options.onDisconnected?.();

  socket.on("connect", subscribe);
  socket.on("reconnect", subscribe);
  socket.on("connect_error", disconnected);
  socket.on("disconnect", disconnected);
  Object.entries(options.events).forEach(([event, handler]) => socket.on(event, handler));
  socket.connect();

  return () => {
    socket.off("connect", subscribe);
    socket.off("reconnect", subscribe);
    socket.off("connect_error", disconnected);
    socket.off("disconnect", disconnected);
    Object.entries(options.events).forEach(([event, handler]) => socket.off(event, handler));
    socket.disconnect();
  };
}
