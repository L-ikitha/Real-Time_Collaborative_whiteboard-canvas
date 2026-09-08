import { useRef, useState } from "react";

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

  const startDrawing = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    saveState();

    const rect = canvas.getBoundingClientRect();

    context.beginPath();

    context.moveTo(
      event.clientX - rect.left,
      event.clientY - rect.top
    );

    setIsDrawing(true);
  };

  const draw = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const rect = canvas.getBoundingClientRect();

    context.lineTo(
      event.clientX - rect.left,
      event.clientY - rect.top
    );

    context.strokeStyle = isEraser ? "#ffffff" : color;
    context.lineWidth = brushSize;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

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

  onCanvasReady(undo, redo, clear);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={600}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
}

export default Canvas;