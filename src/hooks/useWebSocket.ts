import { useCallback, useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:8080";

export interface DrawingMessage {
  type: "draw" | "clear";
  x?: number;
  y?: number;
  previousX?: number;
  previousY?: number;
  color?: string;
  brushSize?: number;
  isEraser?: boolean;
}

export function useWebSocket(
  onMessage?: (message: DrawingMessage) => void
) {
  const socketRef = useRef<WebSocket | null>(null);

  const onMessageRef = useRef(onMessage);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const message: DrawingMessage = JSON.parse(event.data);

        console.log("Received:", message);

        onMessageRef.current?.(message);
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
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

  const sendMessage = useCallback((message: DrawingMessage) => {
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