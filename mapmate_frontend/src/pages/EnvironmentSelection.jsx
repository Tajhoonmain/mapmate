import { useState } from 'react';

export default function EnvironmentSelection() {
  const [activeEnv, setActiveEnv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = async (envName) => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/select-environment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: envName })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load environment');
      }
      setActiveEnv(envName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto relative z-10">
      <section className="mb-12">
        <div className="flex flex-col gap-2">
          <span className="font-headline text-tertiary font-medium tracking-widest text-xs uppercase">Synthetic Navigation Shell</span>
          <h1 className="font-headline text-4xl md:text-6xl font-black text-on-surface tracking-tighter max-w-2xl leading-[0.9]">Select Your Environment</h1>
          <p className="text-on-surface-variant text-lg mt-4 max-w-md font-body">Choose a mapped zone to initialize your high-fidelity indoor HUD guidance.</p>
        </div>
      </section>
      
      {error && (
            <div className="mb-8 bg-error-container text-on-error-container p-4 rounded-xl border border-error/20">
              <p className="font-bold">System Warning</p>
              <p className="text-sm">{error}</p>
            </div>
      )}

      {loading && (
          <div className="mb-8 bg-surface-container-high text-primary p-4 rounded-xl flex gap-3 items-center">
              <span className="material-symbols-outlined animate-spin">sync</span>
              <p className="text-sm font-bold">Allocating memory and loading dataset weights...</p>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {/* Admin Card */}
        <div onClick={() => handleSelect('Admin')} className={`md:col-span-3 group relative overflow-hidden rounded-xl bg-surface-container-high p-8 flex flex-col justify-between min-h-[320px] transition-all hover:bg-surface-container-highest cursor-pointer ${activeEnv === 'Admin' ? 'border-2 border-secondary' : ''}`}>
          <div className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-40">
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNEoa1p3IYaIjgOuvF1RbxX6uDBWuvN2OgS4di8rPsQeK2X9T_46GDaXQ9Z7p5VjmE1vuT1U8ZYyWCkfXonySrgZIKdRAFHd6XpbQ2rHasWc6Et0QDtULeiZgQ5VUVj5NlM4Kkvw0dAfiQaQl-cvfSyKLjVpMqNvhSZ2cleyelAoC78PqMB9udU7boZRp_F7nWCpkpuiu7a74-BFzhNeKEyTwHWDJFrTXIMM3mDnN2dkFnB-q_XhbElHd7xNuAeza0cGCra7FcdRk" alt="Admin"/>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className={`text-secondary px-3 py-1 rounded-full flex items-center gap-2 ${activeEnv === 'Admin' ? 'bg-secondary/20' : 'bg-surface/50 text-surface-variant'}`}>
                <span className={`w-2 h-2 rounded-full ${activeEnv === 'Admin' ? 'bg-secondary' : 'bg-surface-variant'}`}></span>
                <span className="text-[10px] font-bold tracking-widest uppercase">{activeEnv === 'Admin' ? 'Active' : 'Standby'}</span>
              </div>
              <span className="material-symbols-outlined text-primary">arrow_outward</span>
            </div>
            <div className="mt-8">
              <h3 className="font-headline text-4xl font-black text-on-surface">Admin</h3>
              <p className="text-on-surface-variant font-body mt-1 uppercase text-xs tracking-widest font-medium">Central Operations & Registry</p>
            </div>
          </div>
        </div>

        {/* Library Card */}
        <div onClick={() => handleSelect('Library')} className={`md:col-span-3 group relative overflow-hidden rounded-xl bg-surface-container-high p-8 flex flex-col justify-between transition-all hover:bg-surface-container-highest cursor-pointer ${activeEnv === 'Library' ? 'border-2 border-secondary' : ''}`}>
          <div className="absolute inset-0 opacity-10">
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyHlRiLd8M0Xz4WNTVIF5473puG_IqFNbRG8cy_K9am-bWBKWD6RaSFAWAKXMb1CpbvYvPZ1JAbG5APnOu3CRFSvf04A4Nd4gSVyCLolOVNeqBA-ySi-E8vryXg2cPI4_0_UEdjFkReTmS04ZNlZhWyBaGlnuMMBcIDEAaDavALkJl0U_JRIf4h7qq4lMesN9nYNZyojDeujg5KgrukKIL1c9hvuUyFXur93xJdidn1SVG31n_9wfidfohXoH2ipg4zgBfey0GDH8" alt="Library"/>
          </div>
          <div className="relative z-10">
            <div className={`text-secondary w-fit px-3 py-1 rounded-full flex items-center gap-2 ${activeEnv === 'Library' ? 'bg-secondary/20' : 'bg-surface/50 text-surface-variant'}`}>
              <span className={`w-2 h-2 rounded-full ${activeEnv === 'Library' ? 'bg-secondary' : 'bg-surface-variant'}`}></span>
              <span className="text-[10px] font-bold tracking-widest uppercase">{activeEnv === 'Library' ? 'Active' : 'Standby'}</span>
            </div>
            <h3 className="font-headline text-4xl font-bold mt-8">Library</h3>
            <p className="text-on-surface-variant font-body text-xs mt-1 uppercase tracking-widest font-medium">Main Archive Wing</p>
          </div>
        </div>

        {/* Brabers Card */}
        <div onClick={() => handleSelect('Brabers')} className={`md:col-span-3 group relative overflow-hidden rounded-xl bg-surface-container-high p-8 flex flex-col justify-between transition-all hover:bg-surface-container-highest cursor-pointer ${activeEnv === 'Brabers' ? 'border-2 border-secondary' : ''}`}>
          <div className="absolute inset-0 opacity-10">
            <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1541886121406-8d194bea9e0e?auto=format&fit=crop&q=80&w=1000" alt="Brabers"/>
          </div>
          <div className="relative z-10">
            <div className={`text-secondary w-fit px-3 py-1 rounded-full flex items-center gap-2 ${activeEnv === 'Brabers' ? 'bg-secondary/20' : 'bg-surface/50 text-surface-variant'}`}>
              <span className={`w-2 h-2 rounded-full ${activeEnv === 'Brabers' ? 'bg-secondary' : 'bg-surface-variant'}`}></span>
              <span className="text-[10px] font-bold tracking-widest uppercase">{activeEnv === 'Brabers' ? 'Active' : 'Standby'}</span>
            </div>
            <h3 className="font-headline text-4xl font-bold mt-8">Brabers</h3>
            <p className="text-on-surface-variant font-body text-xs mt-1 uppercase tracking-widest font-medium">Engineering Labs Building</p>
          </div>
        </div>

      </div>
    </main>
  );
}
