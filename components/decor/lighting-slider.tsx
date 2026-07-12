"use client";

export function LightingSlider({
  label,
  value,
  minimum = -100,
  maximum = 100,
  step = 1,
  disabled,
  unit = "",
  onBegin,
  onChange,
  onCommit,
  onReset,
}: {
  label: string;
  value: number;
  minimum?: number;
  maximum?: number;
  step?: number;
  disabled?: boolean;
  unit?: string;
  onBegin?: () => void;
  onChange: (value: number) => void;
  onCommit?: () => void;
  onReset: () => void;
}) {
  return (
    <label className="block text-xs text-[#5f6670]">
      <span className="flex items-center justify-between gap-2">
        <span className="font-semibold">{label}</span>
        <span className="flex items-center gap-2 tabular-nums">
          {Math.round(value * 10) / 10}{unit}
          <button
            type="button"
            disabled={disabled || value === 0}
            onClick={onReset}
            className="rounded px-1 text-[10px] font-semibold text-[#2563eb] disabled:opacity-35"
            aria-label={`Restablecer ${label}`}
          >
            Restablecer
          </button>
        </span>
      </span>
      <input
        type="range"
        aria-label={label}
        min={minimum}
        max={maximum}
        step={step}
        value={value}
        disabled={disabled}
        onPointerDown={onBegin}
        onKeyDown={onBegin}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        onBlur={onCommit}
        className="mt-1 w-full accent-[#2563eb] disabled:opacity-45"
      />
    </label>
  );
}
