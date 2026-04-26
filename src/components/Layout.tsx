import { NavLink } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-amber-400">Amberesque</h1>
            <nav className="flex gap-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`
                }
              >
                Avatar Builder
              </NavLink>
              <NavLink
                to="/playsheet"
                className={({ isActive }) =>
                  `px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`
                }
              >
                Avatar Playsheet
              </NavLink>
              <NavLink
                to="/resolver"
                className={({ isActive }) =>
                  `px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`
                }
              >
                Attribute Test Resolver
              </NavLink>
              <NavLink
                to="/combat"
                className={({ isActive }) =>
                  `px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`
                }
              >
                Combat Damage Resolver
              </NavLink>
            </nav>
            <a
              href="https://storage.googleapis.com/amberesque/Amberesque.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded transition-colors"
            >
              📖 Rules
            </a>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}