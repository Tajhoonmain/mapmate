import sys
import os
from pathlib import Path
import logging

# Mock module for when assets fail to load
class MockEnvironmentModule:
    @staticmethod
    def localize_admin(*args, **kwargs):
        return {"success": True, "building": "Admin", "map_x": 0.0, "map_y": 0.0, "confidence": 0.99, "is_simulated": True}
        
    @staticmethod
    def localize_lib(*args, **kwargs):
        return {"success": True, "building": "Library", "map_x": 0.0, "map_y": 0.0, "confidence": 0.99, "is_simulated": True}

    @staticmethod
    def localize_brabers(*args, **kwargs):
        return {"success": True, "building": "Brabers", "map_x": 0.0, "map_y": 0.0, "confidence": 0.99, "is_simulated": True}

class EnvironmentManager:
    def __init__(self):
        # MVP: Admin, Library, and Brabers are mapped for localization
        self.available_environments = ["Admin", "Library", "Brabers"]
        self.loaded_environment = None
        self.backend_dir = Path(__file__).resolve().parent.parent.parent / "Backend"
        if str(self.backend_dir) not in sys.path:
            sys.path.append(str(self.backend_dir))
        
        self.active_module = None

    def get_environments(self):
        return self.available_environments

    def load_environment(self, env_name: str):
        if env_name not in self.available_environments:
            raise ValueError(f"Environment '{env_name}' not found or indoor mapping not yet available.")
            
        env_folder = self.backend_dir / env_name
        
        # Verify Folder / Files
        missing_issue = None
        if not env_folder.exists():
            missing_issue = f"Directory {env_folder.name} missing"
        else:
            for req in ["keypoints_3d.npy", "descriptors_3d.npy"]:
                if not (env_folder / req).exists():
                    missing_issue = f"DATA MISSING: {req} not found"
            if not any(env_folder.glob("LC_*.py")):
                missing_issue = "SCRIPT MISSING: LC_*.py not found"

        if missing_issue:
            logging.warning(f"FALLBACK DEMO TRIGGERED: {missing_issue}")
            self.active_module = MockEnvironmentModule
            self.loaded_environment = env_name
            return {"status": "warning_fallback", "environment": env_name, "reason": missing_issue}

        # Dynamically load the module
        try:
            if env_name == "Admin":
                from Admin import LC_Admin
                self.active_module = LC_Admin
            elif env_name == "Library":
                from Library import LC_Lib
                self.active_module = LC_Lib
            elif env_name == "Brabers":
                from Brabers import LC_Brabers
                self.active_module = LC_Brabers
                
            logging.info(f"Loaded datasets and module for {env_name}")
            self.loaded_environment = env_name
            return {"status": "loaded", "environment": env_name}
        except Exception as e:
            import traceback
            err_msg = f"IMPORT ERROR: {str(e)}"
            logging.error(err_msg)
            self.active_module = MockEnvironmentModule
            self.loaded_environment = env_name
            return {"status": "warning_fallback", "environment": env_name, "reason": err_msg}
            
    def get_current_environment(self):
        return self.loaded_environment
        
    def get_active_module(self):
        return self.active_module
