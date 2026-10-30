import React from 'react';
import { UploadCloud } from 'lucide-react';

const DragDropOverlay = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 bg-blue-600/10 backdrop-blur-xs border-4 border-dashed border-blue-500 rounded-2xl m-4 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
      <div className="p-6 rounded-3xl bg-white shadow-2xl flex flex-col items-center gap-3 border border-blue-100 max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center animate-bounce">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
          Drop files to upload them to My Drive
        </h3>
        <p className="text-xs text-slate-500">
          Your files will be uploaded securely to your cloud workspace.
        </p>
      </div>
    </div>
  );
};

export default DragDropOverlay;

