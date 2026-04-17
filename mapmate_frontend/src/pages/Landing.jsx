import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <main className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden z-10 px-6">
      <div className="absolute inset-0 z-0">
        <img className="w-full h-full object-cover grayscale-[0.5] opacity-20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyEPQy-IcsEOBkgVlq_F3bf1D47BmW9UMBe1iv5yKZarVO9wSeSgwJ8yuhSrU0V07dFNLGIPZAQU1dEXQpyYRjNc9PyOAd36knShiF8sAZDXrgM7CWgNPbnZqnN5h2w27Dvwo8NNFZXuCENAiKznKI3NOcpOPwOAp2QU-HMpa9UF0vq0Up_8yNFvUyZMZhCeG2rNRGSLIMtRwkzOnIhDJ-mOmVCYnYpxEqfxkJ6v2Rmi5kHB31Zc-82FMzUQWSd4lLHunK-URTZEg" alt="Campus Map Outline"/>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center space-y-8">
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(143,245,255,0.2)]">
          FYP Production Prototype
        </div>

        <h1 className="text-6xl md:text-8xl font-headline font-black text-on-surface tracking-tighter leading-tight drop-shadow-xl">
          Map<span className="text-primary">Mate</span>
        </h1>
        
        <p className="text-lg md:text-2xl font-body text-on-surface-variant max-w-2xl mt-4 leading-relaxed bg-surface-container/50 p-6 rounded-2xl backdrop-blur-sm border border-outline-variant/10">
          The next generation of purely offline, high-precision AR Indoor Navigation utilizing Computer Vision point-cloud topologies.
        </p>

        <div className="pt-8 flex flex-col md:flex-row gap-6 w-full justify-center">
          <Link to="/dashboard" className="px-12 py-5 bg-primary text-on-primary font-headline font-black text-xl rounded-2xl active:scale-95 transition-all shadow-[0_0_40px_rgba(143,245,255,0.4)] hover:shadow-[0_0_60px_rgba(143,245,255,0.6)] flex items-center justify-center gap-3">
            Start Demo <span className="material-symbols-outlined">rocket_launch</span>
          </Link>
          
          <a href="#about" className="px-12 py-5 border-2 border-outline-variant text-on-surface font-headline font-bold text-xl rounded-2xl hover:bg-surface-container active:scale-95 transition-all flex items-center justify-center gap-3">
            Read Sensors <span className="material-symbols-outlined">memory</span>
          </a>
        </div>
      </div>

      <div id="about" className="relative z-10 max-w-5xl mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 pb-32">
        <div className="bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 hover:border-primary/50 transition-colors">
           <span className="material-symbols-outlined text-4xl text-primary mb-4" style={{fontVariationSettings: "'FILL' 1"}}>view_in_ar</span>
           <h3 className="text-xl font-bold font-headline mb-2">Live AR Guidance</h3>
           <p className="text-on-surface-variant text-sm leading-relaxed">Dynamic sensor-driven UI overlays path arrows directly onto your tracked physical orientation in 3D space.</p>
        </div>
        <div className="bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 hover:border-secondary/50 transition-colors">
           <span className="material-symbols-outlined text-4xl text-secondary mb-4" style={{fontVariationSettings: "'FILL' 1"}}>wifi_off</span>
           <h3 className="text-xl font-bold font-headline mb-2">Pure Offline</h3>
           <p className="text-on-surface-variant text-sm leading-relaxed">Precomputed OpenCV descriptor weights calculate PnP pose transformations instantly without any server lag.</p>
        </div>
        <div className="bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 hover:border-tertiary/50 transition-colors">
           <span className="material-symbols-outlined text-4xl text-tertiary mb-4" style={{fontVariationSettings: "'FILL' 1"}}>business</span>
           <h3 className="text-xl font-bold font-headline mb-2">Mapped Structures</h3>
           <p className="text-on-surface-variant text-sm leading-relaxed">Demonstrating full algorithmic alignment running natively against the Library and Admin structural bounds.</p>
        </div>
      </div>
    </main>
  );
}
