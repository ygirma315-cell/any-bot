'use client';

import React from 'react';

interface RgbAtmosphereProps {
  activeTab?: 'services' | 'order' | 'payment';
}

export const RgbAtmosphere: React.FC<RgbAtmosphereProps> = ({ activeTab = 'services' }) => {
  return (
    <div className="rgb-atmosphere-container">
      {/* Orb 1: Vibrant Soft Emerald & Cyan */}
      <div
        className="rgb-orb orb-1"
        style={{
          opacity: activeTab === 'services' ? 0.95 : 0.7
        }}
      />

      {/* Orb 2: Vibrant Soft Violet & Indigo */}
      <div
        className="rgb-orb orb-2"
        style={{
          opacity: activeTab === 'order' ? 0.95 : 0.75
        }}
      />

      {/* Orb 3: Vibrant Soft Rose & Magenta */}
      <div
        className="rgb-orb orb-3"
        style={{
          opacity: activeTab === 'payment' ? 0.95 : 0.75
        }}
      />

      {/* Orb 4: Soft Amber & Sunburst */}
      <div
        className="rgb-orb orb-4"
        style={{
          opacity: activeTab === 'payment' ? 0.85 : 0.65
        }}
      />

      {/* Center Flowing Ambient Beam */}
      <div className="rgb-orb orb-center" />
    </div>
  );
};
