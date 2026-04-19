"""
localization.py — Routes uploaded image bytes to the correct localization module.

KEY FIX (2026-04-19):
  Brabers now uses hybrid_infer.run() (OCR + ResNet classifier) instead of the
  old ORB feature-matching pipeline.  The ORB code is kept for Admin / Library
  which still rely on 3-D point correspondences.

Debug images are always saved under Backend/debug_uploads/ so you can byte-
compare the upload vs the original smoke-test file.
"""
import os
import sys
import io
import hashlib
import tempfile
from pathlib import Path
from PIL import Image, ImageOps

# ── Paths ──────────────────────────────────────────────────────────────────────
_THIS_DIR   = Path(__file__).resolve().parent          # mapmate_backend/services/
_BACKEND    = _THIS_DIR.parent.parent / "Backend"      # ../Backend/
_DEBUG_DIR  = _BACKEND / "debug_uploads"
_DEBUG_DIR.mkdir(parents=True, exist_ok=True)

# Make Backend/ importable (model_infer, hybrid_infer, etc. live there)
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))


def _save_debug_image(image_bytes: bytes, label: str) -> str:
    """Save raw bytes to debug_uploads and return the path."""
    h = hashlib.md5(image_bytes).hexdigest()[:8]
    fname = f"debug_{label}_{h}.jpg"
    path  = str(_DEBUG_DIR / fname)
    with open(path, "wb") as f:
        f.write(image_bytes)
    return path


def _load_pil(image_bytes: bytes) -> Image.Image:
    """
    Load PIL image from bytes, apply EXIF-aware rotation (handles mobile
    portrait/landscape), and convert to RGB.
    Returns (pil_image, orig_size, processed_size).
    """
    raw = Image.open(io.BytesIO(image_bytes))
    orig_size = raw.size
    img = ImageOps.exif_transpose(raw).convert("RGB")
    return img, orig_size, img.size


# ── Main service ───────────────────────────────────────────────────────────────

class LocalizationService:
    def __init__(self, env_manager):
        self.env_manager = env_manager

    def localize(self, image_bytes: bytes) -> dict:
        current_env  = self.env_manager.get_current_environment()
        active_module = self.env_manager.get_active_module()

        if not current_env or not active_module:
            print("[Localize] No environment loaded. Auto-loading Brabers.")
            self.env_manager.load_environment("Brabers")
            current_env  = self.env_manager.get_current_environment()
            active_module = self.env_manager.get_active_module()
            
            if not current_env or not active_module:
                return {"status": "failed", "error": "Auto-load of default environment (Brabers) failed."}

        # ── 1. Save debug image (raw bytes, untouched) ───────────────────────
        debug_path = _save_debug_image(image_bytes, current_env)
        file_size  = len(image_bytes)

        print(f"[Localize] env={current_env} | bytes={file_size} | debug={debug_path}")

        try:
            # ── 2. Route to the correct pipeline ────────────────────────────
            if current_env == "Brabers":
                return self._localize_brabers_classifier(image_bytes, debug_path, file_size)

            # Admin / Library / others still use ORB-based pipeline via a temp file
            return self._localize_orb_pipeline(
                image_bytes, current_env, active_module, debug_path, file_size
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "status": "failed",
                "error": str(e),
                "debug": {
                    "bytes_received": file_size,
                    "debug_image": debug_path,
                },
            }

    # ── Brabers: ResNet classifier + OCR fusion ──────────────────────────────

    def _localize_brabers_classifier(self, image_bytes: bytes, debug_path: str, file_size: int) -> dict:
        """
        Use the trained ResNet18 classifier (via hybrid_infer) — identical to
        the smoke-test pipeline.  This replaces the old ORB feature-matching
        path that was incorrectly being called here.
        """
        import hybrid_infer  # Backend/hybrid_infer.py

        img, orig_size, proc_size = _load_pil(image_bytes)

        print(f"[Localize/Brabers] PIL loaded | orig={orig_size} | processed={proc_size}")

        result = hybrid_infer.run(img)   # returns: zone, room, building, confidence, source, …

        debug_info = {
            "pipeline": "hybrid_infer (OCR + ResNet classifier)",
            "bytes_received": file_size,
            "debug_image": debug_path,
            "original_resolution": f"{orig_size[0]}x{orig_size[1]}",
            "processed_resolution": f"{proc_size[0]}x{proc_size[1]}",
            "orientation_fixed": orig_size != proc_size,
            "cv_zone": result.get("cv_zone"),
            "cv_confidence": result.get("cv_confidence"),
            "all_probs": result.get("all_probs", {}),
            "ocr_tokens": result.get("ocr_tokens", []),
            "source": result.get("source"),
        }

        print(f"[Localize/Brabers] zone={result.get('zone')} conf={result.get('confidence')} source={result.get('source')}")

        status = result.get("status", "ok")
        # Map hybrid_infer statuses to frontend-expected values
        api_status = "success" if status in ("ok",) else "warning_fallback"

        return {
            "status": api_status,
            "position": [float(result.get("zone", 0)), 0.0],  # zone as x-coord for now
            "confidence": float(result.get("confidence", 0.0)),
            "environment": "Brabers",
            "zone": result.get("zone"),
            "zone_label": result.get("room", ""),
            "building": result.get("building", "Brabers"),
            "source": result.get("source", ""),
            "message": result.get("message", ""),
            "debug": debug_info,
        }

    # ── Admin / Library: ORB feature-matching pipeline ───────────────────────

    def _localize_orb_pipeline(
        self, image_bytes: bytes, current_env: str, active_module, debug_path: str, file_size: int
    ) -> dict:
        """Write bytes to a temp file so cv2.imread() can read it."""
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        try:
            tmp.write(image_bytes)
            tmp.close()

            if current_env == "Admin":
                res = active_module.localize_admin(tmp.name)
            elif current_env == "Library":
                res = active_module.localize_lib(tmp.name)
            elif current_env == "ACB":
                res = active_module.localize_acb(tmp.name)
            elif current_env == "FBS":
                res = active_module.localize_fbs(tmp.name)
            elif current_env == "MECH":
                res = active_module.localize_mech(tmp.name)
            else:
                return {"status": "failed", "error": f"Localization module undefined for {current_env}"}
        finally:
            os.unlink(tmp.name)

        debug_info = {
            "pipeline": "ORB feature-matching",
            "bytes_received": file_size,
            "debug_image": debug_path,
        }

        if res and res.get("success"):
            return {
                "status": "success",
                "position": [res.get("map_x", 0.0), res.get("map_y", 0.0)],
                "confidence": res.get("confidence", 0.0),
                "environment": current_env,
                "debug": debug_info,
            }
        else:
            reason = res.get("reason", "Unknown failure") if res else "No response"
            return {
                "status": "warning_fallback",
                "position": [10.5, 20.3],
                "confidence": 0.45,
                "environment": current_env,
                "error": f"Localization failed: {reason}",
                "debug": debug_info,
            }
