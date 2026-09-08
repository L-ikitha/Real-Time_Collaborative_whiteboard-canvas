import { useRef, useState } from "react";
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

  const handleCanvasReady = (
    undo: () => void,
    redo: () => void,
    clear: () => void
  ) => {
    undoRef.current = undo;
    redoRef.current = redo;
    clearRef.current = clear;
  };

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
    </div>
  );
}

export default App;