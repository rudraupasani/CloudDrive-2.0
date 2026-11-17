import React from 'react';
import { Link } from 'react-router-dom';
import DriveLogo from './DriveLogo';

const AuthLayout = ({
  children,
  title,
  subtitle,
  image = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop"
}) => {
  return (
    <div className="h-screen w-screen flex bg-white font-['Plus_Jakarta_Sans'] select-none overflow-hidden">
      {/* ========================================================================= */}
      {/* LEFT HALF: FULL-HEIGHT AUTH FORM CONTAINER                                */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 bg-white overflow-hidden">
        {/* Top Branding */}
        <div className="flex items-center justify-between shrink-0">
          <Link to="/" className="flex items-center gap-2.5 active:scale-98 transition">
            <DriveLogo size="sm" />
            <span className="font-bold text-xl text-slate-900 tracking-tight font-['Outfit']">
              CloudDrive
            </span>
          </Link>
        </div>

        {/* Center: Form Area */}
        <div className="my-auto max-w-md w-full mx-auto py-2">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Outfit'] tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {subtitle}
            </p>
          </div>

          {/* Form Content */}
          {children}
        </div>

        {/* Bottom Legal */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>© {new Date().getFullYear()} CloudDrive Inc.</span>
          <div className="flex items-center gap-4">
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-600 transition">
              Privacy
            </a>
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-600 transition">
              Terms
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT HALF: FULL-HEIGHT CURATED ONLINE IMAGE                              */}
      {/* ========================================================================= */}
      <div className="hidden lg:block lg:w-1/2 h-full relative overflow-hidden bg-slate-950">
        <img
          src={image}
          alt="Cloud Workspace"
          className="absolute inset-0 w-full h-full object-cover filter brightness-95"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/20" />
      </div>
    </div>
  );
};

export default AuthLayout;
