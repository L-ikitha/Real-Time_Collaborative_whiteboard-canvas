interface ToolbarProps {
  color: string;
  brushSize: number;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
}

function Toolbar({
  color,
  brushSize,
  onColorChange,
  onBrushSizeChange,
  onClear,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <label>
        Color:
        <input
          type="color"
          value={color}
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

      <button onClick={onClear}>Clear</button>
    </div>
  );
}

export default Toolbar;