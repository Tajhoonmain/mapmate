import { useState, useRef } from 'react';

export default function StreamlitReplica() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
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

    const API_URL = import.meta.env.VITE_API_URL || '';

    try {
      let detected_building = null;
      let localized_position = null;

      // --- 1. INTELLIGENT BUILDING DETECTION ---
      // We test the image against known map models to find the user's current location
      const testEnvs = ["Admin", "Library"];
      
      for (const env of testEnvs) {
        // Load the environment model
        await fetch(`${API_URL}/select-environment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ environment: env })
        });

        // Test localization
        const formData = new FormData();
        formData.append("file", image);
        
        try {
          const locRes = await fetch(`${API_URL}/localize`, {
            method: 'POST',
            body: formData
          });
          
          if (locRes.ok) {
            const locData = await locRes.json();
            if (locData.success || locData.status === "warning_fallback") {
              detected_building = env;
              localized_position = `X: ${locData.map_x?.toFixed(1)}, Y: ${locData.map_y?.toFixed(1)}`;
              break; // Found the building!
            }
          }
        } catch (e) {
            console.warn(`Failed recognizing in ${env}`, e);
        }
      }

      if (!detected_building) {
        throw new Error("Could not detect building from image. Features unmatched.");
      }

      // --- 2. ROUTING CALCULATION ---
      // Ensure backend knows we are navigating the full map
      const navRes = await fetch(`${API_URL}/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: `${destination} Entrance` })
      });

      if (!navRes.ok) {
         throw new Error("Failed to calculate route to destination.");
      }

      const navData = await navRes.json();

      setResult({
        detected_building,
        localized_position,
        route_path: `${detected_building} Entrance → Campus Path → ${destination} Entrance`,
        instructions: navData.instructions || ["Proceed directly to destination."]
      });

    } catch (err) {
      setError(err.message || "An error occurred during processing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-on-surface p-6 font-body">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* 1. Hero Header */}
        <header className="text-center pt-10 pb-4">
          <h1 className="text-5xl md:text-6xl font-headline font-black tracking-tight drop-shadow-sm">
            Map<span className="text-primary">Mate</span>
          </h1>
          <p className="text-on-surface-variant font-medium mt-3 uppercase tracking-widest text-sm">
            AI Campus Navigation System
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: Input Controls */}
          <div className="space-y-8">
            
            {/* 2. Upload Card */}
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-[2rem] p-6 shadow-sm">
              <h2 className="font-headline font-bold text-xl mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_a_photo</span>
                Where are you?
              </h2>
              
              <div 
                className={`min-h-[240px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 transition-all overflow-hidden relative cursor-pointer ${preview ? 'border-primary/50' : 'border-outline-variant/40 hover:border-primary/50 hover:bg-surface-container'}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
                
                {preview ? (
                  <img src={preview} alt="Upload preview" className="absolute inset-0 w-full h-full object-cover z-0 opacity-80" />
                ) : (
                  <div className="text-center z-10 opacity-70 pointer-events-none">
                    <span className="material-symbols-outlined text-4xl mb-2">upload_file</span>
                    <p className="font-medium text-sm">Click or drop image</p>
                    <p className="text-xs mt-1">Capture your surroundings</p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Destination Selector */}
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-[2rem] p-6 shadow-sm">
              <h2 className="font-headline font-bold text-xl mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                Where to?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDestination('Admin')}
                  className={`py-4 rounded-xl font-bold flex flex-col items-center gap-2 border-2 transition-all ${destination === 'Admin' ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/20 hover:border-primary/50'}`}
                >
                  <span className="material-symbols-outlined">business</span>
                  Admin
                </button>
                <button 
                  onClick={() => setDestination('Library')}
                  className={`py-4 rounded-xl font-bold flex flex-col items-center gap-2 border-2 transition-all ${destination === 'Library' ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/20 hover:border-primary/50'}`}
                >
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>local_library</span>
                  Library
                </button>
              </div>
            </div>

            {/* 4. CTA Button */}
            <button 
              onClick={handleLocalizeAndNavigate}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dim text-on-primary py-5 rounded-[2rem] font-headline font-black text-xl flex justify-center items-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin hidden">sync</span>
                  <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>Localize & Navigate <span className="material-symbols-outlined">route</span></>
              )}
            </button>
            
            {error && (
              <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-medium border border-error/20 flex gap-3 items-start">
                 <span className="material-symbols-outlined text-error">warning</span>
                 <p>{error}</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="h-full">
            <div className={`h-full bg-surface-container-high rounded-[2rem] p-8 border border-outline-variant/10 shadow-xl transition-all duration-500 overflow-hidden relative ${result ? 'opacity-100 translate-y-0' : 'opacity-80'}`}>
              
               {!result && !loading && (
                 <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-50 space-y-4">
                    <span className="material-symbols-outlined text-6xl">travel_explore</span>
                    <p className="text-center font-medium max-w-[200px]">Awaiting image input to calculate vector transforms.</p>
                 </div>
               )}

               {loading && (
                 <div className="h-full flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                       <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                       <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary opacity-50 text-xl">blur_on</span>
                    </div>
                    <div className="text-center">
                      <p className="font-headline font-bold text-lg animate-pulse text-primary">Running ORB Extractor...</p>
                      <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">Estimating Camera Pose</p>
                    </div>
                 </div>
               )}

               {result && !loading && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                      <span className="font-headline font-black text-2xl text-primary">Route Resolved</span>
                      <span className="material-symbols-outlined text-3xl text-secondary">check_circle</span>
                    </div>

                    <div className="space-y-6">
                       <div>
                         <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-1">Detected Building</p>
                         <p className="font-headline text-2xl font-bold bg-primary/10 w-fit px-4 py-1.5 rounded-lg text-primary">{result.detected_building}</p>
                       </div>
                       
                       <div>
                         <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-1">Current Location</p>
                         <p className="font-medium text-lg flex items-center gap-2">
                           <span className="material-symbols-outlined text-secondary">my_location</span>
                           {result.localized_position}
                         </p>
                       </div>

                       <div className="bg-surface px-5 py-4 rounded-2xl border border-outline-variant/10">
                         <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-3">Path Geometry</p>
                         <p className="font-bold text-on-surface flex items-center flex-wrap gap-2">
                            <span className="bg-surface-container-high px-3 py-1 rounded text-sm">{result.detected_building}</span>
                            <span className="material-symbols-outlined text-on-surface-variant text-sm">arrow_forward</span>
                            <span className="bg-surface-container-high px-3 py-1 rounded text-sm text-primary">{destination}</span>
                         </p>
                       </div>

                       <div>
                         <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-3">Directions</p>
                         <ul className="space-y-3">
                            {result.instructions.map((inst, idx) => (
                              <li key={idx} className="flex gap-4 items-start bg-surface-container-low p-4 rounded-xl border border-outline-variant/5">
                                 <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{idx + 1}</div>
                                 <span className="font-medium">{inst}</span>
                              </li>
                            ))}
                         </ul>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
