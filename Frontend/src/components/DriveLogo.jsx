import React from 'react';

const DriveLogo = ({ size = 'md', animated = true }) => {
  const dimensions = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  }[size] || 'w-10 h-10';

  return (
    <div className={`relative flex items-center justify-center ${dimensions} ${animated ? 'transition-transform duration-300 hover:scale-105' : ''}`}>
      {/* Background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-green-500 to-amber-500 rounded-full blur-md opacity-30 group-hover:opacity-60 transition duration-500"></div>

      {/* Modern Google Drive Triangle SVG */}
      <svg
        className="w-full h-full relative z-10 drop-shadow-md"
        viewBox="0 0 87.3 78"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.6 66.85L22.95 38.55H79.8L63.45 66.85H6.6Z"
          fill="#4285F4"
        />
        <path
          d="M43.65 11.15L60 39.45L22.95 38.55L6.6 66.85L43.65 11.15Z"
          fill="#0F9D58"
        />
        <path
          d="M43.65 11.15L60 39.45H79.8L63.45 11.15H43.65Z"
          fill="#F4B400"
        />
        <path
          d="M60 39.45L79.8 39.45L63.45 66.85L43.65 66.85L60 39.45Z"
          fill="#EA4335"
          opacity="0.95"
        />
      </svg>
    </div>
  );
};

export default DriveLogo;
