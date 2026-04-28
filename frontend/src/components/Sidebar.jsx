import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Send, 
  ShieldCheck, 
  History, 
  Home,
  Menu,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Send Money', path: '/send', icon: Send },
  { name: 'Verify', path: '/verify', icon: ShieldCheck },
  { name: 'Audit Logs', path: '/logs', icon: History },
];

export default function Sidebar({ isOpen, toggle }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggle}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-slate-900/50 backdrop-blur-2xl border-r border-white/10 z-50 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 indigo-gradient rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="text-white" size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight">Antigravity</span>
            </div>
            <button onClick={toggle} className="lg:hidden text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && toggle()}
                className={({ isActive }) => cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <item.icon size={22} className={cn(
                  "transition-colors",
                  "group-hover:text-indigo-400"
                )} />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-6">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
              <p className="text-sm text-indigo-300 font-medium relative z-10">Production Ready</p>
              <p className="text-xs text-indigo-300/60 mt-1 relative z-10">Digital Signing System v1.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
