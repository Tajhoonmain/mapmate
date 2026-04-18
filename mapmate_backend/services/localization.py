import os
import tempfile

class LocalizationService:
    def __init__(self, env_manager):
        self.env_manager = env_manager
        
    def localize(self, image_bytes: bytes) -> dict:
        current_env = self.env_manager.get_current_environment()
        active_module = self.env_manager.get_active_module()
        
        if not current_env or not active_module:
             return {"status": "failed", "error": "No environment loaded"}
             
        try:
            # Save the multipart upload to a temporary file for OpenCV to read
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            tmp.write(image_bytes)
            tmp.close()
            
            # Find which localize function to call
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
            elif current_env == "Brabers":
                res = active_module.localize_brabers(tmp.name)
            else:
                return {"status": "failed", "error": "Localization module undefined for this environment."}
            
            # Clean up
            os.unlink(tmp.name)

            if res and res.get("success"):
                return {
                    "status": "success",
                    "position": [res.get("map_x", 0.0), res.get("map_y", 0.0)],
                    "confidence": res.get("confidence", 0.0),
                    "environment": current_env
                }
            else:
                reason = res.get("reason", "Unknown failure") if res else "No response"
                # Fallback to a warning simulation if localization mathematically fails but we need a demo output
                return {
                    "status": "warning_fallback", 
                    "position": [10.5, 20.3],
                    "confidence": 0.45,
                    "environment": current_env,
                    "error": f"Localization mathematically failed: {reason}. Returning mock coords."
                }
                
        except Exception as e:
            return {"status": "failed", "error": str(e)}
