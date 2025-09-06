// components/captions/CaptionSettings.tsx
'use client';

import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface CaptionSettingsProps {
  settings: {
    fontSize: string;
    position: string;
    background: string;
    textColor: string;
  };
  onSettingsChange: (settings: any) => void;
  onClose: () => void;
}

export default function CaptionSettings({
  settings,
  onSettingsChange,
  onClose,
}: CaptionSettingsProps) {
  const handleSettingChange = (key: string, value: string) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium mb-3">Font Size</label>
        <div className="grid grid-cols-2 gap-2">
          {['small', 'medium', 'large', 'extra-large'].map((size) => (
            <Button
              key={size}
              onClick={() => handleSettingChange('fontSize', size)}
              className={cn(
                'capitalize',
                settings.fontSize === size
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-[#19232d] hover:bg-[#4c535b]'
              )}
            >
              {size.replace('-', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="block text-sm font-medium mb-3">Position</label>
        <div className="grid grid-cols-3 gap-2">
          {['top', 'middle', 'bottom'].map((position) => (
            <Button
              key={position}
              onClick={() => handleSettingChange('position', position)}
              className={cn(
                'capitalize',
                settings.position === position
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-[#19232d] hover:bg-[#4c535b]'
              )}
            >
              {position}
            </Button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div>
        <label className="block text-sm font-medium mb-3">Background</label>
        <div className="grid grid-cols-3 gap-2">
          {['transparent', 'semi-transparent', 'solid'].map((bg) => (
            <Button
              key={bg}
              onClick={() => handleSettingChange('background', bg)}
              className={cn(
                'capitalize text-xs',
                settings.background === bg
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-[#19232d] hover:bg-[#4c535b]'
              )}
            >
              {bg.replace('-', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Text Color */}
      <div>
        <label className="block text-sm font-medium mb-3">Text Color</label>
        <div className="grid grid-cols-4 gap-2">
          {['white', 'yellow', 'green', 'cyan'].map((color) => (
            <Button
              key={color}
              onClick={() => handleSettingChange('textColor', color)}
              className={cn(
                'capitalize',
                settings.textColor === color
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-[#19232d] hover:bg-[#4c535b]'
              )}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full mr-2 inline-block',
                  color === 'white' && 'bg-white',
                  color === 'yellow' && 'bg-yellow-400',
                  color === 'green' && 'bg-green-400',
                  color === 'cyan' && 'bg-cyan-400'
                )}
              />
              {color}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium mb-3">Preview</label>
        <div
          className={cn(
            'p-4 rounded-lg text-center',
            settings.background === 'solid' && 'bg-black',
            settings.background === 'semi-transparent' && 'bg-black/70',
            settings.background === 'transparent' && 'bg-transparent border border-gray-600',
            settings.fontSize === 'small' && 'text-sm',
            settings.fontSize === 'medium' && 'text-base',
            settings.fontSize === 'large' && 'text-xl',
            settings.fontSize === 'extra-large' && 'text-2xl',
            settings.textColor === 'white' && 'text-white',
            settings.textColor === 'yellow' && 'text-yellow-400',
            settings.textColor === 'green' && 'text-green-400',
            settings.textColor === 'cyan' && 'text-cyan-400'
          )}
        >
          This is how your captions will appear
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Done
        </Button>
      </div>
    </div>
  );
}