import json
import os

class NavigationEngine:
    def __init__(self, graph_path, rooms_path):
        with open(graph_path, 'r') as f:
            self.graph = json.load(f)
        with open(rooms_path, 'r') as f:
            self.rooms = json.load(f)

    def get_zone_by_room(self, room_id):
        normalized_search = room_id.upper().replace(" ", "")
        if "LECTUREHALL" in normalized_search:
            normalized_search = normalized_search.replace("LECTUREHALL", "LH")
        
        for key, zone in self.rooms.items():
            normalized_key = key.upper().replace(" ", "")
            if "LECTUREHALL" in normalized_key:
                normalized_key = normalized_key.replace("LECTUREHALL", "LH")
            if normalized_key == normalized_search:
                return zone
        return None

    def calculate_path(self, start_zone, target_room):
        end_zone = self.get_zone_by_room(target_room)
        
        if end_zone is None:
            return None, "Target room not found", 0

        start_zone = int(start_zone)
        end_zone = int(end_zone)
        
        # Linear hallway shortest path
        if start_zone < end_zone:
            path = list(range(start_zone, end_zone + 1))
            instruction = "Move straight"
        elif start_zone > end_zone:
            path = list(range(start_zone, end_zone - 1, -1))
            instruction = "Turn around"
        else:
            path = [start_zone]
            instruction = "Arrived"

        return path, instruction, len(path) - 1
