import networkx as nx
import math

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
        
    def find_closest_node(self, G, keyword):
        keyword = keyword.lower()
        if "admin" in keyword:
            return "Admin Entrance"
        elif "library" in keyword or "lib" in keyword:
            return "Library Entrance"
        # Default fallback
        return list(G.nodes())[-1]

    def get_path(self, destination: str) -> dict:
        current_env = self.env_manager.get_current_environment()
        if not current_env:
            raise ValueError("No environment loaded. Please select an initial environment first.")
            
        G = self.graphs.get(current_env, self.graphs["Admin"])
        
        # Assuming user starts at the current environment's entrance for MVP
        start_node = f"{current_env} Entrance"
        target_node = self.find_closest_node(G, destination)
        
        if start_node == target_node:
            return {
                "path": [G.nodes[start_node]['pos']],
                "distance": 0.0,
                "instructions": [f"You are already at {target_node}"]
            }
        
        try:
            shortest_path = nx.astar_path(G, start_node, target_node, heuristic=lambda u, v: math.dist(G.nodes[u]['pos'], G.nodes[v]['pos']))
            
            path_coords = []
            instructions = []
            total_dist = 0
            
            for i, node in enumerate(shortest_path):
                path_coords.append(list(G.nodes[node]['pos']))
                if i > 0:
                    prev_node = shortest_path[i-1]
                    dist = G[prev_node][node]['weight']
                    total_dist += dist
                    instructions.append(f"Proceed towards {node}")
            
            instructions.append(f"Destination ahead: {target_node}")

            return {
                "path": path_coords,
                "distance": round(total_dist, 2),
                "instructions": instructions
            }
        except nx.NetworkXNoPath:
            raise ValueError(f"No valid route mapped to {destination} yet.")
