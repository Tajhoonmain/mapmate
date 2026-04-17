import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DestinationInput() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [navData, setNavData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: query })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Navigation failed');
      }
      setNavData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-20 pb-32 px-6 max-w-2xl mx-auto min-h-screen flex flex-col relative z-10">
      <section className="mt-4 space-y-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-primary/60">near_me</span>
          </div>
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl py-5 pl-12 pr-14 focus:outline-none focus:ring-1 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant font-medium text-lg transition-all shadow-inner" 
            placeholder="Where to next?" 
            type="text" 
          />
          <div className="absolute inset-y-0 right-4 flex items-center gap-2">
            <button onClick={handleSearch} className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary hover:bg-secondary/20 transition-all active:scale-90">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>

        {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-xl border border-error/20">
              <p className="font-bold">System Warning</p>
              <p className="text-sm">{error}</p>
            </div>
        )}

        {/* Navigation UI / Results */}
        {loading ? (
           <div className="bg-surface-container-high rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 relative border border-primary/5">
             <span className="text-xs font-label uppercase tracking-widest text-primary/60 font-semibold">Processing Path</span>
             <div className="animate-pulse w-8 h-8 rounded-full bg-primary/40"></div>
           </div>
        ) : navData ? (
           <div className="bg-surface-container-high rounded-2xl p-6 relative border-l-4 border-primary">
             <div className="flex justify-between items-start mb-6">
                 <div>
                     <h3 className="text-xl font-headline font-black text-primary">Path Acquired</h3>
                     <p className="text-sm text-on-surface-variant mt-1">Total Distance: {navData.distance}m</p>
                 </div>
                 <span className="material-symbols-outlined text-3xl text-secondary">check_circle</span>
             </div>
             
             <div className="space-y-4">
                 {navData.instructions.map((inst, idx) => (
                     <div key={idx} className="flex gap-4 items-center bg-surface-container p-4 rounded-xl border border-outline-variant/10">
                         <span className="material-symbols-outlined text-primary">arrow_upward</span>
                         <span className="font-medium">{inst}</span>
                     </div>
                 ))}
             </div>
             
             <button onClick={() => navigate('/ar', { state: { navData } })} className="mt-8 w-full py-4 bg-primary text-on-primary font-bold rounded-xl active:scale-95 transition-transform flex justify-center gap-2">
                 Begin AR Navigation <span className="material-symbols-outlined">camera</span>
             </button>
           </div>
        ) : (
          <div className="bg-surface-container-high rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden border border-primary/5 shadow-[0_0_40px_rgba(143,245,255,0.03)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
            <div className="text-center space-y-1">
              <span className="text-xs font-label uppercase tracking-widest text-primary/60 font-semibold">Listening Now</span>
              <h2 className="text-2xl font-headline font-medium text-on-surface">"Take me to the Library..."</h2>
            </div>
            
            <div className="flex items-center justify-center gap-1 h-12">
              <div className="voice-wave-bar h-4 opacity-40"></div>
              <div className="voice-wave-bar h-8 opacity-60"></div>
              <div className="voice-wave-bar h-12 opacity-90"></div>
              <div className="voice-wave-bar h-10 opacity-100 shadow-[0_0_10px_rgba(143,245,255,0.5)]"></div>
              <div className="voice-wave-bar h-6 opacity-80"></div>
              <div className="voice-wave-bar h-9 opacity-95"></div>
              <div className="voice-wave-bar h-5 opacity-50"></div>
              <div className="voice-wave-bar h-7 opacity-70"></div>
              <div className="voice-wave-bar h-11 opacity-90 shadow-[0_0_10px_rgba(143,245,255,0.5)]"></div>
              <div className="voice-wave-bar h-6 opacity-40"></div>
            </div>
          </div>
        )}
      </section>

      {!navData && !loading && (
          <section className="mt-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="font-headline text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              Available Destinations
              <span className="h-[1px] flex-1 bg-outline-variant/20"></span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setQuery("Library Entrance"); handleSearch(); }} className="col-span-2 bg-surface-container-high p-6 rounded-2xl flex items-center justify-between group hover:bg-surface-bright transition-all duration-300 text-left border-l-4 border-primary">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shadow-lg">
                    <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>local_library</span>
                  </div>
                  <div>
                    <p className="font-headline text-xl font-bold text-on-surface group-hover:text-primary transition-colors">Library Entrance</p>
                    <p className="text-on-surface-variant text-sm font-medium">Campus Map Mode</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">arrow_forward</span>
              </button>

              <button onClick={() => { setQuery("Admin Entrance"); handleSearch(); }} className="col-span-2 bg-surface-container-high p-6 rounded-2xl flex items-center justify-between group hover:bg-surface-bright transition-all duration-300 text-left border-l-4 border-primary">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shadow-lg">
                    <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>business</span>
                  </div>
                  <div>
                    <p className="font-headline text-xl font-bold text-on-surface group-hover:text-primary transition-colors">Admin Entrance</p>
                    <p className="text-on-surface-variant text-sm font-medium">Campus Map Mode</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">arrow_forward</span>
              </button>
              
              <div className="col-span-2 bg-surface-container-low p-5 rounded-2xl flex flex-col gap-4 text-center opacity-70">
                <div className="mx-auto w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined">construction</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-on-surface">Indoor Waypoints</p>
                  <p className="text-on-surface-variant text-xs mt-1">Room-to-room internal routing coming in v2.0</p>
                </div>
              </div>

            </div>
          </section>
      )}
      
      {/* Map Background Preview */}
      <div className="fixed inset-0 -z-10 opacity-10 pointer-events-none">
        <img className="w-full h-full object-cover grayscale brightness-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyEPQy-IcsEOBkgVlq_F3bf1D47BmW9UMBe1iv5yKZarVO9wSeSgwJ8yuhSrU0V07dFNLGIPZAQU1dEXQpyYRjNc9PyOAd36knShiF8sAZDXrgM7CWgNPbnZqnN5h2w27Dvwo8NNFZXuCENAiKznKI3NOcpOPwOAp2QU-HMpa9UF0vq0Up_8yNFvUyZMZhCeG2rNRGSLIMtRwkzOnIhDJ-mOmVCYnYpxEqfxkJ6v2Rmi5kHB31Zc-82FMzUQWSd4lLHunK-URTZEg" alt="Map outline"/>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
      </div>
    </main>
  );
}
