import { useState, useRef, useEffect } from 'react';

export default function StreamlitReplica() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [destination, setDestination] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  // Current user state from last localization
  const [currentZone, setCurrentZone] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  // 0. FETCH AVAILABLE ROOMS ON LOAD
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_URL}/rooms`);
        if (res.ok) {
          const rooms = await res.json();
          setAvailableRooms(Object.keys(rooms));
        }
      } catch (e) {
        console.error("Failed to fetch rooms directory", e);
      }
    };
    fetchRooms();
  }, [API_URL]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setCurrentZone(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setCurrentZone(null);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleLocalizeAndNavigate = async () => {
    if (!image) {
      setError("Please upload an image first.");
      return;
    }
    if (!destination) {
      setError("Please select a destination.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // --- 1. HYBRID LOCALIZATION CALL ---
      const formData = new FormData();
      formData.append("file", image);
      
      const locRes = await fetch(`${API_URL}/localize`, {
        method: 'POST',
        body: formData
      });
      
      if (!locRes.ok) {
        throw new Error("Localization failed. Ensure server is running.");
      }
      
      const locData = await locRes.json();
      // Backend returns "ok" (hybrid_infer) or "success"/"warning_fallback" (localization service)
      const validStatuses = ["ok", "success", "low_confidence", "warning_fallback"];
      if (!validStatuses.includes(locData.status)) {
        throw new Error(locData.error || locData.message || "Failed to identify location.");
      }

      const userZone = locData.zone;
      setCurrentZone(userZone);

      // --- 2. NAVIGATION CALL ---
      const navRes = await fetch(`${API_URL}/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            current_zone: userZone, 
            destination: destination 
        })
      });

      if (!navRes.ok) {
         throw new Error("Failed to calculate route.");
      }

      const navData = await navRes.json();

      setResult({
        building: locData.building || "Brabers",
        zone: userZone,
        room: locData.room,
        source: locData.source,
        message: locData.message,
        confidence: locData.confidence,
        path: navData.path,
        next_step: navData.next_step,
        zones_remaining: navData.zones_remaining
      });

    } catch (err) {
      setError(err.message || "An error occurred during processing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-on-surface p-4 md:p-10 font-body relative overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative">
        
        {/* Header with Version Badge */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-surface-container-low/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-outline-variant/10 shadow-sm">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter">
              Map<span className="text-primary">Mate</span> <span className="text-on-surface-variant font-light">AI</span>
            </h1>
            <p className="text-on-surface-variant font-medium uppercase tracking-[0.3em] text-[10px] mt-1">Hybrid Indoor Intelligence v2.0</p>
          </div>
          <div className="mt-4 md:mt-0 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase">System Online</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: Inputs (5 units) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Camera Input */}
            <section className="bg-surface-container-low border border-outline-variant/15 rounded-[2.5rem] p-8 shadow-sm group">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline font-black text-xl flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  Visual Input
                </h2>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none bg-surface-container px-2 py-1 rounded">ResNet18 / EasyOCR</span>
              </div>
              
              <div 
                className={`group relative aspect-video md:aspect-[4/3] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-500 overflow-hidden cursor-pointer ${preview ? 'border-primary/40 bg-black' : 'border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container'}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
                
                {preview ? (
                  <>
                    <img src={preview} alt="Upload preview" className="absolute inset-0 w-full h-full object-cover z-0 opacity-70 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 flex flex-col justify-end p-6">
                       <p className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                         <span className="material-symbols-outlined text-sm text-primary">done_all</span>
                         Frame Captured
                       </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center z-10 space-y-4 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <span className="material-symbols-outlined text-3xl">photo_camera</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm tracking-tight">Upload Scene</p>
                      <p className="text-[10px] uppercase tracking-widest font-medium mt-1">Click to browse or drop file</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Controls */}
            <section className="bg-surface-container-low border border-outline-variant/15 rounded-[2.5rem] p-8 shadow-sm">
              <h2 className="font-headline font-black text-xl mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-secondary rounded-full"></span>
                Destination
              </h2>
              
              <div className="space-y-6">
                <div className="relative">
                  <select 
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/40 appearance-none font-bold text-sm transition-all"
                  >
                    <option value="">Search Room Directory...</option>
                    {availableRooms.sort().map(room => <option key={room} value={room}>{room}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-60">search_check</span>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>

                <button 
                  onClick={handleLocalizeAndNavigate}
                  disabled={loading || !image || !destination}
                  className="w-full bg-primary hover:bg-primary-dim text-on-primary py-5 rounded-2xl font-headline font-black text-sm uppercase tracking-[0.2em] flex justify-center items-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Initialize Path <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span></>
                  )}
                </button>
              </div>
              
              {error && (
                <div className="mt-6 bg-error-container/50 backdrop-blur-sm text-on-error-container p-4 rounded-xl text-xs font-bold border border-error/10 flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
                   <span className="material-symbols-outlined text-error">report</span>
                   <p>{error}</p>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: Display (7 units) */}
          <div className="lg:col-span-7">
            <div className={`h-full bg-surface-container-high/60 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 border border-outline-variant/15 shadow-2xl transition-all duration-700 overflow-hidden relative flex flex-col ${result ? 'opacity-100' : 'opacity-60'}`}>
              
                {!result && !loading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-40 space-y-6 text-center">
                     <div className="w-24 h-24 border border-dashed border-primary/20 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                         <span className="material-symbols-outlined text-6xl">radar</span>
                     </div>
                     <div className="space-y-2">
                        <p className="font-headline font-black text-2xl tracking-tight">Scanner Standby</p>
                        <p className="text-xs uppercase tracking-[0.2em] max-w-[280px] leading-relaxed">System awaiting optical triggers and destination coordinates to project vector guidance.</p>
                     </div>
                  </div>
                )}

                {loading && (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                     <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-primary/5 border-t-primary animate-spin"></div>
                        <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary opacity-50 text-3xl animate-pulse">blur_on</span>
                     </div>
                     <div className="text-center space-y-4">
                       <div className="space-y-1">
                          <p className="font-headline font-black text-2xl text-primary tracking-tighter">Analyzing Topology...</p>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.4em] font-black">Feature Map Comparison</p>
                       </div>
                       <div className="flex justify-center gap-1 h-3 items-end">
                          {[...Array(6)].map((_, i) => (
                             <div key={i} className="w-1 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: `${i*100}ms`, height: `${40+Math.random()*60}%`}}></div>
                          ))}
                       </div>
                     </div>
                  </div>
                )}

                {result && !loading && (
                  <div className="flex-1 flex flex-col space-y-10 animate-in fade-in zoom-in-95 duration-500">
                     
                     {/* Location Badge HUD */}
                     <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                        <div className="space-y-4 flex-1">
                           <div className="flex items-center gap-3">
                              <span className="bg-secondary text-on-secondary text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">Position Locked</span>
                              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">{result.source} Active</span>
                           </div>
                           <h3 className="font-headline font-black text-4xl md:text-5xl leading-none text-on-surface tracking-tighter">
                              {result.room || `Zone ${result.zone}`}
                           </h3>
                           <p className="text-on-surface-variant font-medium flex items-center gap-2 text-sm">
                              <span className="material-symbols-outlined text-primary text-sm">stairs</span>
                              {result.building} Campus Terminal
                           </p>
                        </div>
                        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/10 text-center flex flex-col items-center min-w-[140px] shadow-sm">
                           <span className="text-[8px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2">Confidence CV</span>
                           <span className="font-headline text-4xl font-black text-primary leading-none">{(result.confidence * 100).toFixed(0)}%</span>
                        </div>
                     </div>

                     {/* Message HUD */}
                     <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-[1.5rem] relative overflow-hidden group">
                        <span className="material-symbols-outlined absolute right-[-10px] top-[-10px] text-9xl text-primary/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000">info</span>
                        <p className="text-primary font-headline font-black text-lg italic pr-12 relative z-10 leading-snug">
                           "{result.message}"
                        </p>
                     </div>

                     {/* Navigation System */}
                     <div className="space-y-6 flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className="font-headline font-black text-lg uppercase tracking-widest flex items-center gap-3">
                               <span className="material-symbols-outlined text-secondary">explore</span>
                               Guidance HUD
                            </h4>
                            <div className="flex gap-1">
                               {result.path.map((z, idx) => (
                                  <div key={idx} className={`w-3 h-1 rounded-full ${z === result.zone ? 'bg-primary' : 'bg-outline-variant/30'}`}></div>
                               ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-surface-container rounded-[2rem] p-6 border border-outline-variant/10 relative overflow-hidden group">
                               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                                  <span className="material-symbols-outlined text-4xl">turn_slight_right</span>
                               </div>
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[10px]">directions</span>
                                  Next Vector
                               </p>
                               <p className="font-headline font-black text-xl text-on-surface leading-snug">
                                  {result.next_step}
                               </p>
                           </div>

                           <div className="bg-surface-container rounded-[2rem] p-6 border border-outline-variant/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                                  <span className="material-symbols-outlined text-4xl">distance</span>
                               </div>
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[10px]">map</span>
                                  Distance to Dest
                               </p>
                               <div className="flex items-baseline gap-2">
                                  <span className="font-headline font-black text-4xl text-secondary">{result.zones_remaining}</span>
                                  <span className="font-headline font-black text-sm text-on-surface-variant uppercase tracking-widest">Zones</span>
                               </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Footer System Info */}
      <footer className="max-w-6xl mx-auto mt-12 px-6 py-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-8">
            <div className="flex flex-col">
               <span className="text-[8px] font-black uppercase tracking-[0.3em] mb-1">Architecture</span>
               <span className="text-[10px] font-bold">Hybrid CV + OCR Fusion</span>
            </div>
            <div className="w-[1px] h-6 bg-outline-variant/20"></div>
            <div className="flex flex-col">
               <span className="text-[8px] font-black uppercase tracking-[0.3em] mb-1">Neural Core</span>
               <span className="text-[10px] font-bold">PyTorch ResNet18</span>
            </div>
         </div>
         <p className="text-[10px] font-medium tracking-widest uppercase">Proprietary MapMate Mapping Protocol 2026</p>
      </footer>
    </main>
  );
}
