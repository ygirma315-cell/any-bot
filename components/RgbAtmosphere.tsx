'use client';

import React from 'react';

interface RgbAtmosphereProps {
  activeTab?: 'services' | 'order' | 'payment';
}

export const RgbAtmosphere: React.FC<RgbAtmosphereProps> = ({ activeTab = 'services' }) => {
  return (
    <div className="rgb-atmosphere-container">
      {/* Light Source 1: Soft Cyan/Green */}
      <div
        className="rgb-orb orb-1"
        style={{
          opacity: activeTab === 'services' ? 0.9 : activeTab === 'order' ? 0.6 : 0.4
        }}
      />

      {/* Light Source 2: Soft Violet/Indigo */}
      <div
        className="rgb-orb orb-2"
        style={{
          opacity: activeTab === 'order' ? 0.95 : activeTab === 'payment' ? 0.7 : 0.5
        }}
      />

      {/* Light Source 3: Soft Pink/Rose */}
      <div
        className="rgb-orb orb-3"
        style={{
          opacity: activeTab === 'payment' ? 0.95 : activeTab === 'services' ? 0.6 : 0.7
        }}
      />

      {/* Light Source 4: Soft Amber/Gold */}
      <div
        className="rgb-orb orb-4"
        style={{
          opacity: activeTab === 'payment' ? 0.8 : 0.5
        }}
      />
    </div>
  );
};
