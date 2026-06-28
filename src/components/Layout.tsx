import { NavLink } from 'react-router-dom';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-x-hidden">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-amber-400 shrink-0">Amberesque</h1>
            
            {/* Desktop nav - hidden on mobile */}
            <nav className="hidden md:flex gap-1">
              <NavLink to="/" className={({ isActive }) =>
                `px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`
              }>
                Avatar Builder
              </NavLink>
              <NavLink to="/playsheet" className={({ isActive }) =>
                `px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`
              }>
                Avatar Playsheet
              </NavLink>
              <NavLink to="/resolver" className={({ isActive }) =>
                `px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`
              }>
                Attribute Test Resolver
              </NavLink>
              <NavLink to="/combat" className={({ isActive }) =>
                `px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`
              }>
                Combat Damage Resolver
              </NavLink>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://storage.googleapis.com/amberesque/Amberesque.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded transition-colors"
              >
                📖 Rules
              </a>
              
              {/* Hamburger button - visible only on mobile */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
          
          {/* Mobile nav dropdown */}
          {menuOpen && (
            <nav className="md:hidden flex flex-col gap-1 pt-3 pb-1">
              <NavLink to="/" onClick={() => setMenuOpen(false)} className={({ isActive }) =>
                `px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`
              }>
                Avatar Builder
              </NavLink>
              <NavLink to="/playsheet" onClick={() => setMenuOpen(false)} className={({ isActive }) =>
                `px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`
              }>
                Avatar Playsheet
              </NavLink>
              <NavLink to="/resolver" onClick={() => setMenuOpen(false)} className={({ isActive }) =>
                `px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`
              }>
                Attribute Test Resolver
              </NavLink>
              <NavLink to="/combat" onClick={() => setMenuOpen(false)} className={({ isActive }) =>
                `px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`
              }>
                Combat Damage Resolver
              </NavLink>
            </nav>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}