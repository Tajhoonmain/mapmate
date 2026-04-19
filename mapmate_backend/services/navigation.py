import networkx as nx
import math
import json
from pathlib import Path

class NavigationService:
    def __init__(self, env_manager):
        self.env_manager = env_manager
        
        self.graphs = {}
        
        # Campus-level graph connecting major building entrances for MVP
        G_campus = nx.Graph()
        G_campus.add_node("Admin Entrance", pos=(0, 0))
        G_campus.add_node("Main Walkway", pos=(20, 10))
        G_campus.add_node("Library Entrance", pos=(40, 20)) 
        
        G_campus.add_edge("Admin Entrance", "Main Walkway", weight=22.3)
        G_campus.add_edge("Main Walkway", "Library Entrance", weight=22.3)
        
        # Currently all queries use the campus graph to route between entrances
        self.graphs["Admin"] = G_campus
        self.graphs["Library"] = G_campus
        
        # Load Brabers rooms
        self.rooms_file = Path(__file__).resolve().parent.parent.parent / "Backend" / "rooms.json"
        
    def _get_brabers_zone(self, destination: str) -> int:
        try:
            rooms = json.loads(self.rooms_file.read_text())
            for room, zone in rooms.items():
                if destination.lower() in room.lower():
                    return zone
        except:
            pass
        raise ValueError(f"Could not find '{destination}' in Brabers directory.")

    def find_closest_node(self, G, keyword):
        keyword = keyword.lower()
        if "admin" in keyword:
            return "Admin Entrance"
        elif "library" in keyword or "lib" in keyword:
            return "Library Entrance"
        return list(G.nodes())[-1]

    def get_path(self, destination: str, current_zone: int = None) -> dict:
        current_env = self.env_manager.get_current_environment()
        if not current_env:
            raise ValueError("No environment loaded. Please select an initial environment first.")
            
        # ── Brabers Specialized 1D Navigation ───────────────────────────
        if current_env == "Brabers":
            if current_zone is None:
                current_zone = 0
            
            dest_zone = self._get_brabers_zone(destination)
            
            if current_zone == dest_zone:
                 return {
                    "path": [current_zone],
                    "instructions": [f"You are already at {destination}"],
                    "next_step": "You have arrived.",
                    "zones_remaining": 0,
                    "distance": 0.0
                 }
                 
            # Create a path array e.g. from 2 to 5 -> [2, 3, 4, 5]
            step = 1 if dest_zone > current_zone else -1
            path_zones = list(range(current_zone, dest_zone + step, step))
            
            direction = "forward" if step == 1 else "backward"
            nav_instruction = f"Proceed {direction} down the corridor towards {destination}"
            
            return {
                "path": path_zones,
                "instructions": [nav_instruction],
                "next_step": nav_instruction,
                "zones_remaining": abs(dest_zone - current_zone),
                "distance": 0.0
            }

        # ── Legacy Admin/Library 2D Navigation ────────────────────────
        G = self.graphs.get(current_env, self.graphs["Admin"])
        
        start_node = f"{current_env} Entrance"
        target_node = self.find_closest_node(G, destination)
        
        if start_node not in G.nodes():
            start_node = list(G.nodes())[0] # Failsafe
            
        if start_node == target_node:
            return {
                "path": [], 
                "distance": 0.0,
                "instructions": [f"You are already at {target_node}"],
                "next_step": "You have arrived.",
                "zones_remaining": 0
            }
        
        try:
            shortest_path = nx.astar_path(G, start_node, target_node, heuristic=lambda u, v: math.dist(G.nodes[u]['pos'], G.nodes[v]['pos']))
            
            instructions = []
            total_dist = 0
            
            for i, node in enumerate(shortest_path):
                if i > 0:
                    prev_node = shortest_path[i-1]
                    dist = G[prev_node][node]['weight']
                    total_dist += dist
                    instructions.append(f"Proceed towards {node}")
            
            instructions.append(f"Destination ahead: {target_node}")

            # Note: For frontend compatibility we just pass empty paths since StreamlitReplica doesn't map legacy Admin coordinates
            return {
                "path": [],
                "distance": round(total_dist, 2),
                "instructions": instructions,
                "next_step": instructions[0] if instructions else "Proceed",
                "zones_remaining": len(shortest_path) - 1
            }
        except nx.NetworkXNoPath:
            raise ValueError(f"No valid route mapped to {destination} yet.")
