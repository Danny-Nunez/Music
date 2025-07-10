'use client';

import React from 'react';
import { useRive } from '@rive-app/react-canvas';

interface AnimatedLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function AnimatedLogo({ width = 32, height = 32, className = '' }: AnimatedLogoProps) {
  const { RiveComponent } = useRive({
    src: '/beatbox_loader.riv',
    autoplay: true,
    shouldDisableRiveListeners: true,
  });

  return (
    <div 
      className={`${className} inline-block`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {RiveComponent && React.createElement(RiveComponent as any, {
        width,
        height,
        style: { 
          width: '100%', 
          height: '100%'
        }
      })}
    </div>
  );
} 