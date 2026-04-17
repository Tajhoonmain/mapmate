import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="bg-background text-on-surface min-h-screen selection:bg-primary/30">
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 shadow-[0_0_20px_rgba(143,245,255,0.06)]">
        <Link to="/dashboard" className="flex items-center gap-3">
          <span className="material-symbols-outlined text-cyan-400" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
          <span className="text-2xl font-black text-cyan-400 tracking-tighter font-headline">MapMate</span>
        </Link>
        <div className="flex items-center gap-4">
          {path === '/environment' && (
            <button className="text-zinc-500 hover:bg-zinc-800/50 transition-colors p-2 rounded-xl active:scale-95 duration-200">
              <span className="material-symbols-outlined">search</span>
            </button>
          )}
          <button className="text-zinc-500 hover:bg-zinc-800/50 transition-colors p-2 rounded-xl active:scale-95 duration-200">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      <Outlet />

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md rounded-3xl bg-zinc-900/70 backdrop-blur-2xl flex justify-around items-center h-20 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50">
        <Link to="/dashboard" className={`flex flex-col items-center gap-1 group active:scale-90 duration-150 ${path === '/dashboard' ? 'bg-cyan-500/20 text-cyan-400 rounded-2xl p-3 shadow-[0_0_15px_rgba(143,245,255,0.3)]' : 'text-zinc-500 p-3 hover:text-cyan-200 transition-all'}`}>
          <span className="material-symbols-outlined" style={path === '/dashboard' ? { fontVariationSettings: "'FILL' 1" } : {}}>home_max</span>
        </Link>
        <Link to="/destination" className={`flex flex-col items-center gap-1 group active:scale-90 duration-150 ${path === '/destination' ? 'bg-cyan-500/20 text-cyan-400 rounded-2xl p-3 shadow-[0_0_15px_rgba(143,245,255,0.3)]' : 'text-zinc-500 p-3 hover:text-cyan-200 transition-all'}`}>
          <span className="material-symbols-outlined" style={path === '/destination' ? { fontVariationSettings: "'FILL' 1" } : {}}>near_me</span>
        </Link>
        <Link to="/environment" className={`flex flex-col items-center gap-1 group active:scale-90 duration-150 ${path === '/environment' ? 'bg-cyan-500/20 text-cyan-400 rounded-2xl p-3 shadow-[0_0_15px_rgba(143,245,255,0.3)]' : 'text-zinc-500 p-3 hover:text-cyan-200 transition-all'}`}>
          <span className="material-symbols-outlined" style={path === '/environment' ? { fontVariationSettings: "'FILL' 1" } : {}}>layers</span>
        </Link>
        <Link to="#" className="flex flex-col items-center gap-1 group active:scale-90 duration-150 text-zinc-500 p-3 hover:text-cyan-200 transition-all">
          <span className="material-symbols-outlined">settings</span>
        </Link>
      </nav>

      {/* Shared Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px]"></div>
      </div>
    </div>
  );
}
