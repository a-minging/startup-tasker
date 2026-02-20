'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: '任务管理',
      icon: 'fa-tasks'
    },
    {
      href: '/weekly-report',
      label: '周报',
      icon: 'fa-file-alt'
    },
    {
      href: '/pricing',
      label: '定价',
      icon: 'fa-tags'
    }
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-indigo-100/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-4xl mx-auto px-5">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-105 transition-all duration-300">
              <i className="fas fa-rocket text-sm"></i>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">创业助手</span>
              <span className="text-[10px] text-gray-400 -mt-1">Startup Assistant</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/25" />
                  )}
                  <i className={`fas ${item.icon} relative z-10 ${isActive ? 'text-white' : ''}`} />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
