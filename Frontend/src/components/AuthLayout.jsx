
import React from 'react';
import { useLocation } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
  const location = useLocation();
  const isLogin = location.pathname === '/login' || location.pathname === '/';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 bg-grid-pattern text-slate-900 p-3 sm:p-4 relative overflow-hidden font-['Plus_Jakarta_Sans']">

      {/* Background Soft Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Auth Container */}
      <div className="w-full max-w-md p-5 sm:p-7 bg-white rounded-xl shadow-sm border border-slate-100">

        {/* Top */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] text-slate-500 font-medium">
            CloudDrive Web App
          </span>
        </div>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit'] tracking-tight">
            {title}
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            {subtitle}
          </p>
        </div>

        {/* Form */}
        <div>
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
          <p>
            © {new Date().getFullYear()} CloudDrive Inc.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="#privacy"
              onClick={(e) => e.preventDefault()}
              className="hover:text-slate-900 transition"
            >
              Privacy
            </a>

            <a
              href="#terms"
              onClick={(e) => e.preventDefault()}
              className="hover:text-slate-900 transition"
            >
              Terms
            </a>

            <a
              href="#support"
              onClick={(e) => e.preventDefault()}
              className="hover:text-slate-900 transition"
            >
              Support
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;

