import { useCallback, useEffect, useRef, useState } from "react";
import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import "./App.css";

function App() {
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  const undoRef = useRef<() => void>(() => {});
  const redoRef = useRef<() => void>(() => {});
  const clearRef = useRef<() => void>(() => {});

  const handleCanvasReady = useCallback(
    (
      undo: () => void,
      redo: () => void,
      clear: () => void
    ) => {
      undoRef.current = undo;
      redoRef.current = redo;
      clearRef.current = clear;
    },
    []
  );

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();

        if (event.shiftKey) {
          redoRef.current();
        } else {
          undoRef.current();
        }

        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoRef.current();
        return;
      }

      if (event.key.toLowerCase() === "e") {
        setIsEraser((previous) => !previous);
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  return (
    <div className="app">
      <h1>Collaborative Whiteboard</h1>

      <Toolbar
        color={color}
        brushSize={brushSize}
        isEraser={isEraser}
        onColorChange={setColor}
        onBrushSizeChange={setBrushSize}
        onEraserChange={setIsEraser}
        onUndo={() => undoRef.current()}
        onRedo={() => redoRef.current()}
        onClear={() => clearRef.current()}
      />

      <Canvas
        color={color}
        brushSize={brushSize}
        isEraser={isEraser}
        onCanvasReady={handleCanvasReady}
      />

      <div className="shortcuts">
        <span>
          Undo: <strong>Ctrl + Z</strong>
        </span>

        <span>
          Redo: <strong>Ctrl + Y</strong>
        </span>

        <span>
          Eraser: <strong>E</strong>
        </span>
      </div>
    </div>
  );
}

export default App;