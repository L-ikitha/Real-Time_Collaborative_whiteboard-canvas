import { useEffect, useRef, useState } from "react";

interface CanvasProps {
  color: string;
  brushSize: number;
  isEraser: boolean;
  onCanvasReady: (
    undo: () => void,
    redo: () => void,
    clear: () => void
  ) => void;
}

function Canvas({
  color,
  brushSize,
  isEraser,
  onCanvasReady,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);

  const historyRef = useRef<ImageData[]>([]);
  const redoHistoryRef = useRef<ImageData[]>([]);

  const saveState = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const imageData = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    historyRef.current.push(imageData);

    redoHistoryRef.current = [];
  };

  const getCoordinates = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.setPointerCapture(event.pointerId);

    saveState();

    const { x, y } = getCoordinates(event);

    context.beginPath();
    context.moveTo(x, y);

    setIsDrawing(true);
  };

  const draw = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const { x, y } = getCoordinates(event);

    context.lineTo(x, y);

    context.strokeStyle = isEraser ? "#ffffff" : color;
    context.lineWidth = brushSize;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.stroke();
  };

  const stopDrawing = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;

    if (
      canvas &&
      canvas.hasPointerCapture(event.pointerId)
    ) {
      canvas.releasePointerCapture(event.pointerId);
    }

    setIsDrawing(false);
  };

  const undo = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const previousState = historyRef.current.pop();

    if (!previousState) return;

    const currentState = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    redoHistoryRef.current.push(currentState);

    context.putImageData(previousState, 0, 0);
  };

  const redo = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const nextState = redoHistoryRef.current.pop();

    if (!nextState) return;

    const currentState = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    historyRef.current.push(currentState);

    context.putImageData(nextState, 0, 0);
  };

  const clear = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    saveState();

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  useEffect(() => {
    onCanvasReady(undo, redo, clear);
  }, [onCanvasReady]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        onContextMenu={(event) => event.preventDefault()}
        style={{
          touchAction: "none",
          userSelect: "none",
        }}
      />
    </div>
  );
}

export default Canvas;