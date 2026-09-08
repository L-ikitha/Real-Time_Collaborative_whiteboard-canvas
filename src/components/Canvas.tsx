import { useRef, useState } from "react";

interface CanvasProps {
  color: string;
  brushSize: number;
  isEraser: boolean;
}

function Canvas({ color, brushSize, isEraser }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const rect = canvas.getBoundingClientRect();

    context.beginPath();

    context.moveTo(
      event.clientX - rect.left,
      event.clientY - rect.top
    );

    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
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
    setIsDrawing(false);
  };

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