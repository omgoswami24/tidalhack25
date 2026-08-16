import React from 'react';

// Oculon mark: surveillance eye inside a camera targeting frame
const OculonLogo = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="oculonStroke" x1="0" y1="0" x2="48" y2="48">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <radialGradient id="oculonIris" cx="50%" cy="42%" r="65%">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="55%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </radialGradient>
    </defs>

    {/* targeting-frame corner brackets */}
    <path d="M4 12 V7 a3 3 0 0 1 3-3 h5" stroke="url(#oculonStroke)" strokeWidth="3" strokeLinecap="round" />
    <path d="M36 4 h5 a3 3 0 0 1 3 3 v5" stroke="url(#oculonStroke)" strokeWidth="3" strokeLinecap="round" />
    <path d="M44 36 v5 a3 3 0 0 1 -3 3 h-5" stroke="url(#oculonStroke)" strokeWidth="3" strokeLinecap="round" />
    <path d="M12 44 H7 a3 3 0 0 1 -3-3 v-5" stroke="url(#oculonStroke)" strokeWidth="3" strokeLinecap="round" />

    {/* eye outline */}
    <path
      d="M8 24 C13 15.5 18.5 11.5 24 11.5 C29.5 11.5 35 15.5 40 24 C35 32.5 29.5 36.5 24 36.5 C18.5 36.5 13 32.5 8 24 Z"
      stroke="url(#oculonStroke)"
      strokeWidth="3"
      strokeLinejoin="round"
    />

    {/* iris */}
    <circle cx="24" cy="24" r="7.5" fill="url(#oculonIris)" />
    <circle cx="24" cy="24" r="7.5" stroke="#22d3ee" strokeWidth="1" opacity="0.6" />

    {/* pupil + glint */}
    <circle cx="24" cy="24" r="3" fill="#0b1220" />
    <circle cx="25.8" cy="22.2" r="1.2" fill="#e0f2fe" />

    {/* reticle ticks */}
    <path d="M24 13.5 v3 M24 31.5 v3 M31.5 24 h3 M13.5 24 h3" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default OculonLogo;
