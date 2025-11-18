import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icons } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { name: '儀表板', path: '/', icon: Icons.Dashboard },
  { name: '願景與目標', path: '/plan', icon: Icons.Goal },
  { name: '每週執行', path: '/execute', icon: Icons.Execution },
  { name: '檢視與評分', path: '/review', icon: Icons.Review },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="flex items-center justify-center h-16 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Icons.Calendar className="w-6 h-6 text-red-500" />
            <span className="text-xl font-bold tracking-wider">12WY PVS</span>
          </div>
        </div>
        
        <nav className="mt-6 px-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-red-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 text-center">
            策略 (Strategy) • 緩衝 (Buffer) • 自由 (Breakout)
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
          <button 
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center ml-auto gap-4">
             {/* Header placeholder for user profile or quick actions */}
             <span className="text-sm text-gray-500 hidden md:block">第 12 週，共 12 週</span>
             <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                M
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;