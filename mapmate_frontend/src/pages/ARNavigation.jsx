import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ARNavigation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const navData = state?.navData;

  const [posData, setPosData] = useState({
    confidence: null,
    distance: navData?.distance || 100,
    instruct: navData?.instructions?.[0] || "Turn right",
  });
  const [sensorStatus, setSensorStatus] = useState("Calibrating...");
  const [localizeResult, setLocalizeResult] = useState(null);
  const [localizeError, setLocalizeError]   = useState(null);
  const [isLocalizing, setIsLocalizing]     = useState(false);

  const fileInputRef  = useRef(null);
  const arrowRef      = useRef(null);
  const videoRef      = useRef(null);
  const streamRef     = useRef(null);

  // AR Sensor & Smoothing References
  const rotationTarget  = useRef(0);
  const tiltTarget      = useRef(30);
  const currentInterp   = useRef({ rot: 0, tilt: 30 });
  const isUsingSensors  = useRef(false);

  // Fallback pointer-drag for desktop
  const handlePointerMove = (x, y) => {
    if (isUsingSensors.current) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    rotationTarget.current = ((x / w) * 200) - 100;
    tiltTarget.current     = ((y / h) * 80)  - 20;
    setSensorStatus("Manual Override Active");
  };

  const requestSensorAccess = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm === 'granted') { isUsingSensors.current = true; setSensorStatus("Sensors Locked"); }
        else setSensorStatus("Sensor Access Denied");
      } catch { setSensorStatus("Sensor Request Failed"); }
    } else {
      isUsingSensors.current = true;
      setSensorStatus("Sensors Locked");
    }
  };

  // Arrow animation loop
  useEffect(() => {
    let rafId;
    const update = () => {
      currentInterp.current.rot  += (rotationTarget.current - currentInterp.current.rot)  * 0.12;
      currentInterp.current.tilt += (tiltTarget.current     - currentInterp.current.tilt) * 0.08;
      if (arrowRef.current)
        arrowRef.current.style.transform =
          `perspective(800px) rotateX(${currentInterp.current.tilt}deg) rotateZ(${currentInterp.current.rot}deg)`;
      rafId = requestAnimationFrame(update);
    };
    update();

    const handleOrientation = (e) => {
      isUsingSensors.current = true;
      setSensorStatus("Sensors Locked");
      let heading = e.webkitCompassHeading || (360 - e.alpha);
      if (heading == null) return;
      let rot = ((0 - heading + 540) % 360) - 180;
      rotationTarget.current = rot;
      let tilt = e.beta ? e.beta - 60 : 0;
      tiltTarget.current = Math.max(-40, Math.min(70, tilt));
    };
    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // ── Live camera via getUserMedia (mobile/desktop) ─────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.warn("Camera not available:", err.message);
        setSensorStatus("Camera unavailable – upload mode");
      }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Core: send real image bytes to /localize ──────────────────────────────
  const sendFileToLocalize = async (file) => {
    if (!file) return;
    setIsLocalizing(true);
    setLocalizeError(null);

    console.log(`[Frontend] Sending file="${file.name}" size=${file.size} type=${file.type}`);

    const formData = new FormData();
    // Append the raw file object — browser multipart sends original bytes, no re-encoding
    formData.append("file", file, file.name || "photo.jpg");

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/localize`, {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type manually — browser sets it automatically with the correct boundary
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error(`Non-JSON response: ${text.slice(0, 200)}`); }

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      console.log("[Frontend] Localize response:", data);
      setLocalizeResult(data);

      if (data.status === "success" || data.status === "warning_fallback") {
        setPosData(prev => ({
          confidence: data.confidence,
          distance:   Math.max(0, parseFloat((prev.distance - 2.5).toFixed(1))),
          instruct:   prev.distance < 10 ? "You have arrived!" : prev.instruct,
        }));
      }
    } catch (err) {
      console.error("[Frontend] Localize error:", err);
      setLocalizeError(err.message);
    } finally {
      setIsLocalizing(false);
    }
  };

  // Capture frame from live video stream
  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setLocalizeError("Camera not ready. Use the upload button instead.");
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);   // ← draws real video frame, not a black rect

    canvas.toBlob((blob) => {
      if (!blob) { setLocalizeError("Failed to capture frame."); return; }
      // Wrap blob in a File so we can log the size
      const f = new File([blob], "camera_frame.jpg", { type: "image/jpeg" });
      sendFileToLocalize(f);
    }, 'image/jpeg', 0.92);
  };

  // File-picker fallback (for testing: pick your exact smoke-test image)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) sendFileToLocalize(file);
  };

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
      {/* Hidden file input for upload fallback */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
             className="hidden" onChange={handleFileChange} />

      {/* Live Camera Feed (replaces static image) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video ref={videoRef} autoPlay playsInline muted
               className="w-full h-full object-cover grayscale-[0.3] brightness-[0.4]"
               style={{ display: 'block' }} />
        {/* Fallback static hallway image while camera loads */}
        <img alt="Hallway" className="w-full h-full object-cover grayscale-[0.3] brightness-[0.4] absolute inset-0"
             style={{ display: videoRef.current?.videoWidth ? 'none' : 'block' }}
             src="https://lh3.googleusercontent.com/aida-public/AB6AXuBW5aPjea_TtLOZHl-p_PRifL6jxeO_7QjeEZiG2hWvE-3ZR5auS04P6yCrd-uNbE4f61pRjKqja8nrQYj1LY1-WP8Y6YmRFTrf0AXgpk3FODkLBRzrSdoU0ExvOS1tBICJueyeE0OPDUH3qnET0pH55Cby-W6_RSzVsd0B5QbccstOg-NaHR9VfXqCyAa_8D59K0GVA3-aIvVhictwire2ftJmO_gQLhaNebFwBcid0QAwssHFiIv1pJ92pGKMFTj_D4wPX-8rieM"/>
        <div className="absolute inset-0 ar-grid-overlay opacity-20 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(rgba(143,245,255,0.1) 1px,transparent 1px)", backgroundSize: "40px 40px" }}/>
      </div>

      {/* Top HUD Info */}
      <div className="absolute top-16 pointer-events-auto z-10 w-full flex flex-col items-center gap-4">
        {typeof DeviceOrientationEvent !== 'undefined' &&
         typeof DeviceOrientationEvent.requestPermission === 'function' && (
          <button onClick={requestSensorAccess}
                  className="bg-secondary/20 border border-secondary/50 text-secondary text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-widest backdrop-blur-md active:scale-95">
            Calibrate Compass
          </button>
        )}

        <div className="bg-surface-container-high/80 backdrop-blur-xl p-6 rounded-xl shadow-[0_0_15px_rgba(143,245,255,0.3)] flex items-center gap-6 border-l-4 border-secondary max-w-sm w-[90%]">
          <div className="flex flex-col flex-1 pl-2">
            <span className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em] mb-1">Instruction</span>
            <span className="font-headline text-3xl font-bold text-on-surface">{posData.instruct}</span>
          </div>
          <div className="h-12 w-[1px] bg-outline-variant/30"/>
          <div className="flex flex-col items-end pr-2">
            <span className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em] mb-1">In</span>
            <span className="font-headline text-3xl font-bold text-primary">{Math.round(posData.distance)}m</span>
          </div>
        </div>
      </div>

      {/* Dynamic AR Arrow */}
      <div className="relative flex flex-col items-center justify-center transform group z-10 w-full h-full pointer-events-none mt-[10vh]">
        <div className={`absolute w-64 h-64 bg-primary/20 blur-[100px] rounded-full transition-opacity duration-500 ${posData.distance < 10 ? 'animate-pulse bg-secondary/30' : ''}`}/>
        <div ref={arrowRef} className="relative flex flex-col items-center will-change-transform origin-bottom" style={{ transition: 'none' }}>
          <span className="material-symbols-outlined text-[180px] text-primary drop-shadow-[0_0_40px_rgba(143,245,255,1)] leading-none"
                style={{ fontVariationSettings: "'wght' 300" }}>arrow_upward</span>
          <div className="absolute -bottom-6 bg-primary text-on-primary px-5 py-2 rounded-full font-headline font-black text-xl shadow-[0_10px_30px_rgba(143,245,255,0.5)]">
            {Math.round(posData.distance)}m
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="absolute bottom-10 w-full max-w-xl px-6 pointer-events-auto z-10">
        <div className="bg-surface-container-highest/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-outline-variant/10 space-y-4">

          {/* Localize controls */}
          <div className="flex gap-3">
            {/* Capture from live camera */}
            <button onClick={captureFromCamera} disabled={isLocalizing}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary/20 border border-secondary/40 text-secondary font-bold text-sm active:scale-95 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-base">camera</span>
              {isLocalizing ? "Localizing…" : "Capture & Localize"}
            </button>

            {/* Upload exact test image */}
            <button onClick={() => fileInputRef.current?.click()} disabled={isLocalizing}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-surface-container border border-outline-variant/20 text-on-surface-variant font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                    title="Upload image file (use this to test with your smoke-test image)">
              <span className="material-symbols-outlined text-base">upload_file</span>
              Upload
            </button>
          </div>

          {/* Localize Result */}
          {localizeError && (
            <div className="bg-error-container/80 text-on-error-container p-3 rounded-xl text-xs font-mono break-all">
              <p className="font-bold mb-1">⚠ Error</p>{localizeError}
            </div>
          )}
          {localizeResult && !localizeError && (
            <div className="bg-surface-container/80 p-3 rounded-xl text-xs space-y-1">
              <p className="font-bold text-on-surface">
                📍 {localizeResult.zone_label || localizeResult.room || `Zone ${localizeResult.zone}`}
                <span className="ml-2 text-secondary">{Math.round((localizeResult.confidence||0)*100)}%</span>
              </p>
              <p className="text-on-surface-variant">Source: {localizeResult.source || localizeResult.status}</p>
              {localizeResult.debug && (
                <details className="mt-1 text-on-surface-variant/70">
                  <summary className="cursor-pointer">Debug info</summary>
                  <pre className="mt-1 overflow-auto max-h-28 text-[10px]">{JSON.stringify(localizeResult.debug, null, 2)}</pre>
                </details>
              )}
            </div>
          )}

          {/* Confidence bar + status */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isUsingSensors.current ? 'bg-secondary' : 'bg-surface-variant'}`}/>
                {sensorStatus}
              </span>
              <h2 className="font-headline text-xl font-bold text-on-surface">Tracking Locked</h2>
            </div>
            <button onClick={() => navigate('/destination')}
                    className="bg-error-container hover:bg-error-dim text-on-error-container px-6 py-3 rounded-2xl font-headline font-bold transition-all active:scale-95 flex items-center gap-2">
              STOP
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant w-12">
              {posData.confidence ? Math.round(posData.confidence * 100) : '--'}%
            </span>
            <div className="h-1.5 flex-1 bg-surface-container rounded-full overflow-hidden">
              <div className={`h-full ${posData.confidence > 0.5 ? 'w-[75%] bg-gradient-to-r from-secondary to-green-400' : 'w-[45%] bg-gradient-to-r from-error to-error-dim'} rounded-full transition-all duration-500`}/>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
