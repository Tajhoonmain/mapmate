import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ARNavigation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const navData = state?.navData;
  const [posData, setPosData] = useState({ confidence: null, distance: navData?.distance || 100, instruct: navData?.instructions?.[0] || "Turn right" });
  const [sensorStatus, setSensorStatus] = useState("Calibrating...");
  
  const canvasRef = useRef(null);
  const arrowRef = useRef(null);
  
  // AR Sensor & Smoothing References
  const rotationTarget = useRef(0);
  const tiltTarget = useRef(30); // Default perspective tilt
  const currentInterp = useRef({ rot: 0, tilt: 30 });
  const isUsingSensors = useRef(false);

  // Fallback for Desktop / Touch Drag Simulation
  const handlePointerMove = (x, y) => {
    if (isUsingSensors.current) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    rotationTarget.current = ((x / w) * 200) - 100; // Simulated heading (-100 to 100 deg)
    tiltTarget.current = ((y / h) * 80) - 20;       // Simulated tilt
    setSensorStatus("Manual Override Active");
  };

  const requestSensorAccess = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          isUsingSensors.current = true;
          setSensorStatus("Sensors Locked");
        } else {
          setSensorStatus("Sensor Access Denied");
        }
      } catch (err) {
        setSensorStatus("Sensor Request Failed");
      }
    } else {
      isUsingSensors.current = true;
      setSensorStatus("Sensors Locked");
    }
  };

  useEffect(() => {
    let animationFrameId;

    // Smooth Transformation Loop (30+ FPS)
    const updateArrow = () => {
       // Interpolation (Low-Pass Filter for smooth movement)
       currentInterp.current.rot += (rotationTarget.current - currentInterp.current.rot) * 0.12;
       currentInterp.current.tilt += (tiltTarget.current - currentInterp.current.tilt) * 0.08;
       
       if (arrowRef.current) {
          arrowRef.current.style.transform = `perspective(800px) rotateX(${currentInterp.current.tilt}deg) rotateZ(${currentInterp.current.rot}deg)`;
       }
       animationFrameId = requestAnimationFrame(updateArrow);
    };
    updateArrow();

    // Device Orientation Listener
    const handleOrientation = (e) => {
       isUsingSensors.current = true;
       setSensorStatus("Sensors Locked");
       
       // Calculate Heading. Prioritize absolute compass if available.
       let heading = e.webkitCompassHeading || (360 - e.alpha);
       if (heading == null) return;
       
       // Mock route bearing toward destination (Assume target is North = 0 for prototype)
       const route_bearing = 0; 
       
       // Arrow rotation = Route Bearing - Phone Heading
       let arrow_rotation = route_bearing - heading;
       
       // Normalize difference to -180...180 range to prevent UI wrap-around spinning
       arrow_rotation = ((arrow_rotation + 540) % 360) - 180;
       rotationTarget.current = arrow_rotation;
       
       // Tilt perspective (Beta goes from -180 to 180. 90 is standing up straight).
       // We map phone posture into arrow perspective.
       let targetTilt = e.beta ? e.beta - 60 : 0; 
       tiltTarget.current = Math.max(-40, Math.min(70, targetTilt));
    };

    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
       window.removeEventListener("deviceorientation", handleOrientation, true);
       cancelAnimationFrame(animationFrameId);
    }
  }, []);

  // Backend Tracking Simulation Loop
  useEffect(() => {
    if (!navData) return;

    const simulateCameraCaptureAndLocalize = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 100, 100);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const formData = new FormData();
        formData.append("file", blob, "camera_frame.jpg");

        try {
          const res = await fetch("http://localhost:8000/localize", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data && (data.status === "success" || data.status === "warning_fallback")) {
            setPosData(prev => {
              const newDist = Math.max(0, parseFloat((prev.distance - 2.5).toFixed(1)));
              return {
                confidence: data.confidence,
                distance: newDist,
                instruct: newDist < 10 ? "You have arrived!" : prev.instruct
              };
            });
          }
        } catch (e) {
          console.error("Localization error", e);
        }
      }, 'image/jpeg');
    };

    const interval = setInterval(simulateCameraCaptureAndLocalize, 3000);
    simulateCameraCaptureAndLocalize();

    return () => clearInterval(interval);
  }, [navData]);

  if (!navData) {
    return (
        <div className="h-screen w-full flex items-center justify-center text-center">
           <div>
               <h2 className="text-2xl font-bold mb-4">No Navigation Data</h2>
               <button onClick={() => navigate('/destination')} className="bg-primary px-6 py-2 text-on-primary rounded-lg font-bold">Go Back</button>
           </div>
        </div>
    );
  }

  return (
    <main 
      className="relative h-screen flex flex-col items-center justify-center overflow-hidden touch-none"
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
    >
      <canvas ref={canvasRef} width="100" height="100" className="hidden" />

      {/* Camera View */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img alt="Hallway" className="w-full h-full object-cover grayscale-[0.3] brightness-[0.4]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBW5aPjea_TtLOZHl-p_PRifL6jxeO_7QjeEZiG2hWvE-3ZR5auS04P6yCrd-uNbE4f61pRjKqja8nrQYj1LY1-WP8Y6YmRFTrf0AXgpk3FODkLBRzrSdoU0ExvOS1tBICJueyeE0OPDUH3qnET0pH55Cby-W6_RSzVsd0B5QbccstOg-NaHR9VfXqCyAa_8D59K0GVA3-aIvVhictwire2ftJmO_gQLhaNebFwBcid0QAwssHFiIv1pJ92pGKMFTj_D4wPX-8rieM"/>
        <div className="absolute inset-0 ar-grid-overlay opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(143, 245, 255, 0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      </div>
      
      {/* Top HUD Info */}
      <div className="absolute top-16 pointer-events-auto z-10 w-full flex flex-col items-center gap-4">
         {/* iOS Permission Button if needed */}
         {typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' && (
            <button onClick={requestSensorAccess} className="bg-secondary/20 border border-secondary/50 text-secondary text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-widest backdrop-blur-md active:scale-95">
                Calibrate Compass
            </button>
         )}

        <div className="bg-surface-container-high/80 backdrop-blur-xl p-6 rounded-xl shadow-[0_0_15px_rgba(143,245,255,0.3)] flex items-center gap-6 border-l-4 border-secondary max-w-sm w-[90%]">
          <div className="flex flex-col flex-1 pl-2">
            <span className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em] mb-1">Instruction</span>
            <span className="font-headline text-3xl font-bold text-on-surface">{posData.instruct}</span>
          </div>
          <div className="h-12 w-[1px] bg-outline-variant/30"></div>
          <div className="flex flex-col items-end pr-2">
            <span className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em] mb-1">In</span>
            <span className="font-headline text-3xl font-bold text-primary">{Math.round(posData.distance)}m</span>
          </div>
        </div>
      </div>

      {/* Dynamic AR Arrow Sub-system */}
      <div className="relative flex flex-col items-center justify-center transform group z-10 w-full h-full pointer-events-none mt-[10vh]">
        <div className={`absolute w-64 h-64 bg-primary/20 blur-[100px] rounded-full transition-opacity duration-500 ${posData.distance < 10 ? 'animate-pulse bg-secondary/30' : ''}`}></div>
        
        {/* Dynamic Rotation Container */}
        <div ref={arrowRef} className="relative flex flex-col items-center will-change-transform origin-bottom" style={{ transition: 'none' }}>
          <span className="material-symbols-outlined text-[180px] text-primary drop-shadow-[0_0_40px_rgba(143,245,255,1)] leading-none" style={{ fontVariationSettings: "'wght' 300" }}>arrow_upward</span>
          
          <div className="absolute -bottom-6 bg-primary text-on-primary px-5 py-2 rounded-full font-headline font-black text-xl shadow-[0_10px_30px_rgba(143,245,255,0.5)]">
            {Math.round(posData.distance)}m
          </div>
        </div>
      </div>

      {/* Bottom Tracking Status Panel */}
      <div className="absolute bottom-10 w-full max-w-xl px-6 pointer-events-auto z-10">
        <div className="bg-surface-container-highest/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-outline-variant/10">
          <div className="flex items-center justify-between gap-6 mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${isUsingSensors.current ? 'bg-secondary' : 'bg-surface-variant'}`}></span>
                 {sensorStatus}
              </span>
              <h2 className="font-headline text-xl font-bold text-on-surface">Tracking Locked</h2>
            </div>
            <button onClick={() => navigate('/destination')} className="bg-error-container hover:bg-error-dim text-on-error-container px-6 py-3 rounded-2xl font-headline font-bold transition-all active:scale-95 flex items-center gap-2">
               STOP
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant w-12">{posData.confidence ? Math.round(posData.confidence * 100) : '--'}%</span>
            <div className="h-1.5 flex-1 bg-surface-container rounded-full overflow-hidden">
                <div className={`h-full ${posData.confidence > 0.5 ? 'w-[75%] bg-gradient-to-r from-secondary to-green-400' : 'w-[45%] bg-gradient-to-r from-error to-error-dim'} rounded-full transition-all duration-500`}></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
