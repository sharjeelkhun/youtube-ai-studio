import { create } from 'zustand';
import { fabric } from 'fabric';

interface EditorStore {
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas) => void;
  selectedElement: fabric.Object | null;
  setSelectedElement: (element: fabric.Object | null) => void;
  addText: (text: string, color?: string) => void;
  addImage: (url: string) => void;
  removeSelected: () => void;
  updateTextStyle: (style: { [key: string]: any }) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  canvas: null,
  selectedElement: null,
  
  setCanvas: (canvas) => {
    canvas.on('selection:created', (e) => {
      set({ selectedElement: e.selected?.[0] || null });
    });
    
    canvas.on('selection:cleared', () => {
      set({ selectedElement: null });
    });
    
    set({ canvas });
  },
  
  setSelectedElement: (element) => set({ selectedElement: element }),
  
  addText: (text, color = '#ffffff') => {
    const canvas = get().canvas;
    if (!canvas) return;
    
    const textBox = new fabric.Textbox(text, {
      left: 50,
      top: 50,
      fontSize: 40,
      fill: color,
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeWidth: 1,
      shadow: new fabric.Shadow({ color: '#000000', blur: 10, offsetX: 2, offsetY: 2 }),
    });
    
    canvas.add(textBox);
    canvas.setActiveObject(textBox);
    canvas.renderAll();
  },
  
  addImage: async (url) => {
    const canvas = get().canvas;
    if (!canvas) return;
    
    fabric.Image.fromURL(url, (img) => {
      img.scaleToWidth(300);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  },
  
  removeSelected: () => {
    const canvas = get().canvas;
    const selected = canvas?.getActiveObject();
    if (!canvas || !selected) return;
    
    canvas.remove(selected);
    canvas.renderAll();
    set({ selectedElement: null });
  },
  
  updateTextStyle: (style) => {
    const canvas = get().canvas;
    const selected = canvas?.getActiveObject();
    if (!canvas || !selected || selected.type !== 'textbox') return;
    
    selected.set(style);
    canvas.renderAll();
  },
}));