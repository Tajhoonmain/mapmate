import sys
import os
from pathlib import Path
import logging

class EnvironmentManager:
    def __init__(self):
        # MVP: Only Library and Admin are currently mapped for localization
        self.available_environments = ["Admin", "Library"]
        self.loaded_environment = None
        self.backend_dir = Path(r"c:\8th semester\fyp\bismillah\Backend")
        if str(self.backend_dir) not in sys.path:
            sys.path.append(str(self.backend_dir))
        
        self.active_module = None

    def get_environments(self):
        return self.available_environments

    def load_environment(self, env_name: str):
        if env_name not in self.available_environments:
            raise ValueError(f"Environment '{env_name}' not found or indoor mapping not yet available.")
            
        env_folder = self.backend_dir / env_name
        if not env_folder.exists() or not any(env_folder.glob("LC_*.py")):
            raise ValueError(f"Module for {env_name} unavailable or missing data.")

        # Dynamically load the module
        try:
            if env_name == "Admin":
                from Admin import LC_Admin
                self.active_module = LC_Admin
            elif env_name == "Library":
                from Library import LC_Lib
                self.active_module = LC_Lib
                
            logging.info(f"Loaded datasets and module for {env_name}")
            self.loaded_environment = env_name
            return {"status": "loaded", "environment": env_name}
        except Exception as e:
            raise RuntimeError(f"Failed to load environment {env_name}: {str(e)}")
            
    def get_current_environment(self):
        return self.loaded_environment
        
    def get_active_module(self):
        return self.active_module
