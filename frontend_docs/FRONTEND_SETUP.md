# Frontend Integration Setup

The backend handles model inference and navigation automatically.
Just ensure your frontend application runs on the same Wi-Fi network as the laptop running this backend.

## Example JavaScript Fetch
```javascript
// Localize
const formData = new FormData();
formData.append('file', imageBlob);
const locres = await fetch('http://192.168.1.X:8000/localize', {
    method: 'POST',
    body: formData
});
const locationData = await locres.json();

// Navigate
const navres = await fetch('http://192.168.1.X:8000/navigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        current_zone: locationData.zone,
        destination: "Lecture Hall 2"
    })
});
const navData = await navres.json();
```
