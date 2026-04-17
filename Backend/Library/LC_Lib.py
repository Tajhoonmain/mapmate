"""
LC_Lib.py
---------------------------------
Library Building localization module
Uses:
- ORB feature matching
- 2D–3D correspondences
- PnP for camera pose
- Pre-aligned Library → Campus transform
"""

import cv2
import json
import numpy as np
from pathlib import Path
import datetime

# =========================================================
# PATHS
# =========================================================
THIS_DIR = Path(__file__).resolve().parent
KEYPOINTS_3D_PATH = THIS_DIR / "keypoints_3d.npy"
DESCRIPTORS_3D_PATH = THIS_DIR / "descriptors_3d.npy"
TRANSFORM_PATH = THIS_DIR.parent.parent / "transform_library.json"
LOG_DIR = THIS_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

# =========================================================
# CAMERA
# =========================================================
CAMERA_MATRIX = np.array([[1200, 0, 640],
                          [0, 1200, 360],
                          [0, 0, 1]], dtype=np.float32)
DIST_COEFFS = np.zeros((4, 1), dtype=np.float32)

# =========================================================
# LOAD DATA
# =========================================================
points_3d = np.load(KEYPOINTS_3D_PATH)
descriptors_3d = np.load(DESCRIPTORS_3D_PATH).astype(np.uint8)

with open(TRANSFORM_PATH, "r") as f:
    T = json.load(f)

transform_matrix = np.array(T["transform_matrix"], dtype=np.float32)

# =========================================================
# LOGGING
# =========================================================
def log_localization(image_path, result, rvec, tvec):
    try:
        log_file = LOG_DIR / "localization_results.json"

        entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "image_path": image_path,
            "result": result,
            "rvec": rvec.flatten().tolist() if rvec is not None else None,
            "tvec": tvec.flatten().tolist() if tvec is not None else None,
        }

        if log_file.exists():
            with open(log_file, "r") as f:
                data = json.load(f)
        else:
            data = []
        data.append(entry)
        with open(log_file, "w") as f:
            json.dump(data, f, indent=2)

    except Exception as e:
        print("Logging failed:", e)

# =========================================================
# CORE FUNCTION
# =========================================================
def localize_lib_with_pose(image_path: str):

    img = cv2.imread(image_path)
    if img is None:
        return {"success": False, "building": "Library", "reason": "Image not readable"}, None, None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    orb = cv2.ORB_create(nfeatures=5000)
    kp2d, des2d = orb.detectAndCompute(gray, None)

    if des2d is None or len(kp2d) < 10:
        return {"success": False, "building": "Library", "reason": "Insufficient features"}, None, None

    des2d = des2d.astype(np.uint8)

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    raw_matches = bf.match(des2d, descriptors_3d)
    good = [m for m in raw_matches if m.distance < 50]

    if len(good) < 8:
        return {"success": False, "building": "Library", "reason": f"Not enough strict matches. Found: {len(good)}"}, None, None

    good = sorted(good, key=lambda x: x.distance)[:100]

    pts_2d_raw = np.zeros((len(good), 2), dtype=np.float32)
    pts_3d_raw = np.zeros((len(good), 3), dtype=np.float32)

    for i, m in enumerate(good):
        pts_2d_raw[i] = kp2d[m.queryIdx].pt
        pts_3d_raw[i] = points_3d[m.trainIdx]

    valid_mask = np.isfinite(pts_3d_raw).all(axis=1) & np.isfinite(pts_2d_raw).all(axis=1)
    pts_2d = pts_2d_raw[valid_mask]
    pts_3d = pts_3d_raw[valid_mask]

    if len(pts_2d) < 6:
        return {"success": False, "building": "Library", "reason": "Too few valid points after filtering NaNs"}, None, None

    pts_2d = np.ascontiguousarray(pts_2d)
    pts_3d = np.ascontiguousarray(pts_3d)

    cam_mat = np.ascontiguousarray(CAMERA_MATRIX, dtype=np.float32)
    dist_c = np.zeros(4, dtype=np.float32)

    if pts_3d.shape[0] < 6 or pts_2d.shape[0] < 6:
        return {"success": False, "building": "Library", "reason": f"PnP failed: Only {pts_3d.shape[0]} valid points."}, None, None
    
    ok, rvec, tvec, inliers = cv2.solvePnPRansac(
        pts_3d, pts_2d, cam_mat, dist_c,
        reprojectionError=15.0, confidence=0.99, iterationsCount=1000, flags=cv2.SOLVEPNP_EPNP
    )

    if inliers is None:
        inliers = []

    if not ok or len(inliers) < 4:
        return {"success": False, "building": "Library", "reason": f"PnP failed. Inliers: {len(inliers)}"}, None, None

    R_cam, _ = cv2.Rodrigues(rvec)
    cam_pos = (-R_cam.T @ tvec).flatten()

    x, z = cam_pos[0], cam_pos[2]
    pt = np.array([x, z, 1.0], dtype=np.float32)
    cam_map = transform_matrix @ pt

    confidence = min(1.0, len(inliers) / 80)

    result = {
        "success": True,
        "building": "Library",
        "map_x": float(cam_map[0]),
        "map_y": float(cam_map[1]),
        "confidence": float(confidence)
    }

    log_localization(image_path, result, rvec, tvec)
    return result, rvec, tvec

def localize_lib(image_path: str):
    result, _, _ = localize_lib_with_pose(image_path)
    return result
