import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, Check, Loader2, UploadCloud } from 'lucide-react';

const DriveUploadWidget = ({ uploading, fileName, uploadSuccess, uploadError, onDismiss }) => {
  const [minimized, setMinimized] = useState(false);

  if (!uploading && !uploadSuccess && !uploadError) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Widget Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          ) : uploadSuccess ? (
            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
              ✓
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold">
              !
            </div>
          )}
          <span className="text-xs font-semibold">
            {uploading
              ? 'Uploading 1 item'
              : uploadSuccess
              ? '1 upload complete'
              : 'Upload error'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={minimized ? 'Expand' : 'Minimize'}
          >
            {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Widget Body */}
      {!minimized && (
        <div className="p-3.5 bg-white divide-y divide-slate-100">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5 overflow-hidden pr-2">
              <UploadCloud className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-medium text-slate-800 truncate">
                {fileName || 'Document upload'}
              </span>
            </div>

            <div className="shrink-0">
              {uploading ? (
                <span className="text-[11px] text-blue-600 font-medium">Processing...</span>
              ) : uploadSuccess ? (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </span>
              ) : (
                <span className="text-[11px] text-red-600 font-medium">Failed</span>
              )}
            </div>
          </div>

          {/* Progress Animation Bar */}
          {uploading && (
            <div className="pt-2">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4 transition-all duration-300" />
              </div>
            </div>
          )}

          {uploadError && (
            <div className="pt-2 text-[11px] text-red-600">
              {uploadError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriveUploadWidget;

