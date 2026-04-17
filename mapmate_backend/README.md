# MapMate Backend Setup

This is the FastAPI backend integration layer for the MapMate offline navigation system. It exposes endpoints required by the Stitch UI frontend, and connects to the CV / Graph navigation modules.

## Architecture

- **`main.py`**: App entry point, CORS configuration.
- **`api/routes.py`**: API Endpoints matching UI expectations.
- **`api/schemas.py`**: Pydantic data models for request/response validation.
- **`services/environment.py`**: Manages current environment and caches `.npy` dataset arrays.
- **`services/localization.py`**: Wrapper for OpenCV localization logic.
- **`services/navigation.py`**: Wrapper for NetworkX graph pathfinding.

*Note: The current configuration runs in simulation mode, providing valid random responses formatted precisely for the frontend if CV models and graphs aren't loaded.*

## Running the Backend

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the FastAPI Server**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The server will start at `http://localhost:8000`

## Connect Stitch UI Frontend

To connect the Stitch AI frontend to this backend:

1. Locate the API integration point in your Stitch UI codebase.
2. Set the `BASE_URL` to `http://localhost:8000` (or your deployed server URL).
3. Ensure the frontend sends requests to `/environments`, `/select-environment`, `/localize`, and `/navigate`.

## Example API Requests

### 1. GET `/environments`
```bash
curl -X GET "http://localhost:8000/environments"
```
**Response:**
```json
{
  "environments": ["Admin", "Library", "ACB", "FBS", "MECH"]
}
```

### 2. POST `/select-environment`
```bash
curl -X POST "http://localhost:8000/select-environment" \
     -H "Content-Type: application/json" \
     -d '{"environment": "Admin"}'
```
**Response:**
```json
{
  "status": "loaded",
  "environment": "Admin"
}
```

### 3. POST `/localize`
*Note: Sends image via multipart/form-data upload.*
```bash
curl -X POST "http://localhost:8000/localize" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/camera_frame.jpg"
```
**Response:**
```json
{
  "status": "success",
  "position": [42.5, 87.2],
  "confidence": 0.92,
  "environment": "Admin"
}
```

### 4. POST `/navigate`
```bash
curl -X POST "http://localhost:8000/navigate" \
     -H "Content-Type: application/json" \
     -d '{"destination": "Lecture Hall A"}'
```
**Response:**
```json
{
  "path": [
    [10.2, 5.5],
    [15.4, 8.2],
    [20.1, 14.5]
  ],
  "distance": 45.2,
  "instructions": [
    "Start moving forward",
    "Turn left",
    "Arrived at Lecture Hall A"
  ]
}
```
