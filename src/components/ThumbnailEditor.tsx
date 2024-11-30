import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '../store/editorStore';
import { Image, Type, Trash2, Download, Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ColorPicker } from './editor/ColorPicker';
import { ImageUploader } from './editor/ImageUploader';
import toast from 'react-hot-toast';

export function ThumbnailEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textColor, setTextColor] = useState('#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { canvas, setCanvas, addText, addImage, removeSelected } = useEditorStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1280,
      height: 720,
      backgroundColor: '#f0f0f0',
    });

    canvas.on('selection:created', (e) => {
      const selected = e.selected?.[0];
      if (selected && selected.type === 'textbox') {
        setTextColor((selected as fabric.Textbox).fill?.toString() || '#ffffff');
      }
    });

    setCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  const handleAddText = () => {
    addText('Your Text Here', textColor);
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        addImage(e.target.result.toString());
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!canvas) return;
    
    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
      });
      
      const link = document.createElement('a');
      link.download = 'thumbnail.png';
      link.href = dataURL;
      link.click();
      
      toast.success('Thumbnail downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download thumbnail');
    }
  };

  const handleTextStyle = (style: string) => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'textbox') return;

    const textbox = activeObject as fabric.Textbox;
    
    switch (style) {
      case 'bold':
        textbox.set('fontWeight', textbox.fontWeight === 'bold' ? 'normal' : 'bold');
        break;
      case 'italic':
        textbox.set('fontStyle', textbox.fontStyle === 'italic' ? 'normal' : 'italic');
        break;
      case 'left':
        textbox.set('textAlign', 'left');
        break;
      case 'center':
        textbox.set('textAlign', 'center');
        break;
      case 'right':
        textbox.set('textAlign', 'right');
        break;
    }
    
    canvas.renderAll();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Thumbnail Editor</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAddText}
            className="p-2 hover:bg-gray-100 rounded-lg tooltip"
            title="Add Text"
          >
            <Type className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              style={{ backgroundColor: textColor }}
            />
            {showColorPicker && (
              <div className="absolute right-0 mt-2 z-10 bg-white rounded-lg shadow-lg">
                <ColorPicker color={textColor} onChange={setTextColor} />
              </div>
            )}
          </div>
          <button
            onClick={() => handleTextStyle('bold')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Bold className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleTextStyle('italic')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Italic className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleTextStyle('left')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <AlignLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleTextStyle('center')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <AlignCenter className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleTextStyle('right')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <AlignRight className="w-5 h-5" />
          </button>
          <button
            onClick={removeSelected}
            className="p-2 hover:bg-gray-100 rounded-lg tooltip"
            title="Delete Selected"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-100 rounded-lg tooltip"
            title="Download Thumbnail"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 border rounded-lg overflow-hidden">
          <canvas ref={canvasRef} />
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Upload Image</h3>
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Templates</h3>
            <div className="grid grid-cols-2 gap-2">
              {/* Add template thumbnails here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}