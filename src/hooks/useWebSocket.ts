import { useCallback, useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:8080";

export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      console.log("Server message:", event.data);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = useCallback((message: unknown) => {
    const socket = socketRef.current;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, []);

  return {
    isConnected,
    sendMessage,
  };
}