import React from 'react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div className="p-4">
      <HexColorPicker color={color} onChange={onChange} />
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full px-3 py-2 border rounded-lg"
      />
    </div>
  );
}