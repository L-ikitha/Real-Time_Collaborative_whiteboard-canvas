interface ToolbarProps {
  color: string;
  brushSize: number;
  isEraser: boolean;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onEraserChange: (value: boolean) => void;
  onClear: () => void;
}

function Toolbar({
  color,
  brushSize,
  isEraser,
  onColorChange,
  onBrushSizeChange,
  onEraserChange,
  onClear,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <label>
        Color:
        <input
          type="color"
          value={color}
          disabled={isEraser}
          onChange={(event) => onColorChange(event.target.value)}
        />
      </label>

      <label>
        Brush Size:
        <input
          type="range"
          min="1"
          max="30"
          value={brushSize}
          onChange={(event) =>
            onBrushSizeChange(Number(event.target.value))
          }
        />
        <span>{brushSize}px</span>
      </label>

      <button onClick={() => onEraserChange(!isEraser)}>
        {isEraser ? "Pen" : "Eraser"}
      </button>

      <button onClick={onClear}>Clear</button>
    </div>
  );
}

export default Toolbar;