# API Usage for Frontend Development

Base URL: `http://<YOUR_PC_IP>:8000`

### 1. Localize (Upload Image)
`POST /localize`
- **Body**: Form-data with key `file` containing the image.
- **Response**:
```json
{
  "zone": 4,
  "confidence": 0.91,
  "status": "ok"
}
```

### 2. Navigate (Get Route)
`POST /navigate`
- **Body** (JSON):
```json
{
  "current_zone": 4,
  "destination": "Lecture Hall 2"
}
```
- **Response**:
```json
{
  "path": [4, 5, 6, 7],
  "next_step": "Move straight",
  "zones_remaining": 3
}
```

### 3. Rooms Directory
`GET /rooms`
Returns a JSON object mapping human-readable rooms to zones.
