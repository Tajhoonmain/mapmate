import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
      {/* Hero Status Section */}
      <section className="mb-12 relative overflow-hidden rounded-[2rem] p-8 bg-surface-container-low border border-outline-variant/10">
        <div className="relative z-10">
          <span className="text-secondary font-label text-xs font-bold tracking-[0.2em] uppercase mb-2 block">Prototype Real</span>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface mb-4 leading-tight">Where are we<br/><span className="text-primary">heading</span> today?</h1>
          <p className="text-on-surface-variant max-w-md font-body">Navigate building-to-building. Currently mapping structural paths.</p>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none bg-gradient-to-l from-primary/20 to-transparent"></div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {/* Start Navigation */}
        <div className="md:col-span-4 group relative overflow-hidden bg-surface-container-high rounded-[2.5rem] p-1 shadow-[0_0_40px_rgba(0,0,0,0.4)] transition-all hover:translate-y-[-4px]">
          <div className="h-full w-full bg-surface-container-high rounded-[2.4rem] p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-12">
              <div className="bg-primary/10 p-4 rounded-2xl">
                <span className="material-symbols-outlined text-primary text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>near_me</span>
              </div>
              <span className="text-on-surface-variant text-sm font-medium bg-surface-container-lowest px-4 py-2 rounded-full">Explore Live Zones</span>
            </div>
            <div>
              <h2 className="text-3xl font-headline font-bold text-on-surface mb-2">Start Navigation</h2>
              <p className="text-on-surface-variant mb-8 max-w-xs">Initialize real-time camera tracking and find your path across campus.</p>
              <Link to="/destination" className="w-full py-4 bg-gradient-to-br from-primary to-primary-dim text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                <span>GO NOW</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
          <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-secondary rounded-full"></div>
        </div>

        {/* Select Environment */}
        <div className="md:col-span-2 group flex flex-col bg-surface-container-high rounded-[2.5rem] p-8 transition-all hover:bg-surface-container-highest">
          <div className="bg-tertiary/10 w-fit p-3 rounded-xl mb-6">
            <span className="material-symbols-outlined text-tertiary">layers</span>
          </div>
          <h3 className="text-xl font-headline font-bold text-on-surface mb-2">Set Base Model</h3>
          <p className="text-on-surface-variant text-sm mb-8">Mount .npy points array.</p>
          <div className="mt-auto space-y-3">
            <Link to="/environment" className="w-full block text-center py-3 bg-surface-container shadow-md border-b-2 border-primary rounded-xl text-sm font-medium hover:bg-surface-container-highest transition-colors">
              Manage Models
            </Link>
          </div>
        </div>

        {/* Recent Journeys */}
        <div className="md:col-span-3 bg-surface-container-low rounded-[2.5rem] p-8 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-lg">Mapped Locales</h3>
            <span className="material-symbols-outlined text-on-surface-variant">location_on</span>
          </div>
          <ul className="space-y-4">
            <li className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">domain</span>
              </div>
              <div className="flex-1 border-b border-outline-variant/10 pb-3">
                <p className="text-sm font-medium">Admin Entrance</p>
                <p className="text-xs text-on-surface-variant">Live</p>
              </div>
            </li>
            <li className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">import_contacts</span>
              </div>
              <div className="flex-1 border-b border-outline-variant/10 pb-3">
                <p className="text-sm font-medium">Library Entrance</p>
                <p className="text-xs text-on-surface-variant">Live</p>
              </div>
            </li>
            <li className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">apartment</span>
              </div>
              <div className="flex-1 border-b border-outline-variant/10 pb-3">
                <p className="text-sm font-medium">Brabers Entrance</p>
                <p className="text-xs text-on-surface-variant">Live</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
