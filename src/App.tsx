import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Canvas } from "./components/Canvas";
import type { CanvasHandle } from "./components/Canvas";

import Toolbar from "./components/Toolbar";

import {
  useWebSocket,
} from "./hooks/useWebSocket";

import type {
  DrawingMessage,
} from "./hooks/useWebSocket";

function App() {
  const [color, setColor] =
    useState("#000000");

  const [brushSize, setBrushSize] =
    useState(5);

  const [isEraser, setIsEraser] =
    useState(false);

  const [roomId, setRoomId] =
    useState("");

  const [roomInput, setRoomInput] =
    useState("");

  const [onlineUsers, setOnlineUsers] =
    useState(0);

  const [remoteMessage, setRemoteMessage] =
    useState<DrawingMessage | null>(
      null
    );

  const canvasRef =
    useRef<CanvasHandle | null>(
      null
    );

  const handleRemoteMessage =
    useCallback(
      (message: DrawingMessage) => {
        setRemoteMessage(message);
      },
      []
    );

  const handlePresenceChange =
    useCallback((count: number) => {
      setOnlineUsers(count);
    }, []);

  const {
    isConnected,
    sendMessage,
    joinRoom,
  } = useWebSocket(
    handleRemoteMessage,
    handlePresenceChange
  );

  const handleUndo =
    useCallback(() => {
      canvasRef.current?.undo();
    }, []);

  const handleRedo =
    useCallback(() => {
      canvasRef.current?.redo();
    }, []);

  const handleClear =
    useCallback(() => {
      canvasRef.current?.clear();

      sendMessage({
        type: "clear",
      });
    }, [sendMessage]);

  const handleCanvasReady =
    useCallback(
      (canvas: HTMLCanvasElement) => {
        console.log(
          "Canvas ready:",
          canvas
        );
      },
      []
    );

  const handleJoinRoom = () => {
    const trimmedRoom =
      roomInput.trim();

    if (!trimmedRoom) {
      return;
    }

    joinRoom(trimmedRoom);

    setRoomId(trimmedRoom);

    setOnlineUsers(1);

    canvasRef.current?.clear();

    setRemoteMessage(null);
  };

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "z"
      ) {
        event.preventDefault();

        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "y"
      ) {
        event.preventDefault();

        handleRedo();
      }

      if (
        event.key.toLowerCase() ===
        "e"
      ) {
        setIsEraser(
          (current) => !current
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    handleRedo,
    handleUndo,
  ]);

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>
            Collaborative Whiteboard
          </h1>

          <p>
            Draw together in real time
          </p>
        </div>

        <div className="connection-status">
          <span
            className={`status-dot ${
              isConnected
                ? "connected"
                : "disconnected"
            }`}
          />

          {isConnected
            ? "Connected"
            : "Disconnected"}
        </div>
      </header>

      <div className="room-bar">
        <div className="room-info">
          <span className="room-label">
            Room
          </span>

          <span className="room-name">
            {roomId || "Not joined"}
          </span>

          {roomId && (
            <span className="room-users">
              👥 {onlineUsers}{" "}
              {onlineUsers === 1
                ? "user"
                : "users"}{" "}
              online
            </span>
          )}
        </div>

        <div className="room-controls">
          <input
            type="text"
            value={roomInput}
            onChange={(event) =>
              setRoomInput(
                event.target.value
              )
            }
            placeholder="Enter room name"
          />

          <button
            type="button"
            onClick={handleJoinRoom}
            disabled={
              !isConnected ||
              !roomInput.trim()
            }
          >
            Join Room
          </button>
        </div>
      </div>

      <Toolbar
        color={color}
        brushSize={brushSize}
        isEraser={isEraser}
        onColorChange={setColor}
        onBrushSizeChange={
          setBrushSize
        }
        onEraserChange={
          setIsEraser
        }
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
      />

      <Canvas
        ref={canvasRef}
        color={color}
        brushSize={brushSize}
        isEraser={isEraser}
        onCanvasReady={
          handleCanvasReady
        }
        remoteMessage={
          remoteMessage
        }
        onDraw={sendMessage}
      />
    </main>
  );
}

export default App;