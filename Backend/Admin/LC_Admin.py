"""
LC_Admin.py
---------------------------------
Admin Building localization module
Uses:
- ORB feature matching
- 2D–3D correspondences
- PnP for camera pose
- Pre-aligned Admin → Campus transform

Logs rvec, tvec, 2D & 3D points for reprojection evaluation
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
TRANSFORM_PATH = THIS_DIR.parent.parent / "transform_admin.json"
LOG_DIR = THIS_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

# =========================================================
# CAMERA
# =========================================================
CAMERA_MATRIX = np.array([[1200, 0, 640],
                          [0, 1200, 360],
                          [0, 0, 1]], dtype=np.float32)
# FIX: Explicitly set datatype to match CAMERA_MATRIX
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
def localize_admin_with_pose(image_path: str):

    img = cv2.imread(image_path)
    if img is None:
        return {"success": False, "building": "Admin", "reason": "Image not readable"}, None, None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    orb = cv2.ORB_create(nfeatures=5000)
    kp2d, des2d = orb.detectAndCompute(gray, None)

    if des2d is None or len(kp2d) < 10:
        return {"success": False, "building": "Admin", "reason": "Insufficient features"}, None, None

    des2d = des2d.astype(np.uint8)

    # =====================================================
    # STRICT MUTUAL MATCHING (Cross-Check)
    # =====================================================
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    raw_matches = bf.match(des2d, descriptors_3d)

    # Filter out anything that isn't a near-perfect visual match
    good = [m for m in raw_matches if m.distance < 50]

    if len(good) < 8:
        return {
            "success": False,
            "building": "Admin",
            "reason": f"Not enough strict matches. Found: {len(good)}",
            "matches": len(good)
        }, None, None

    # Keep only the top 100 absolute best matches for RANSAC
    good = sorted(good, key=lambda x: x.distance)[:100]

    # =====================================================
    # STRICT C++-FRIENDLY POINT ALLOCATION
    # =====================================================
    # 1. Pre-allocate exact shapes
    pts_2d_raw = np.zeros((len(good), 2), dtype=np.float32)
    pts_3d_raw = np.zeros((len(good), 3), dtype=np.float32)

    # 2. Fill arrays directly by index
    for i, m in enumerate(good):
        pts_2d_raw[i] = kp2d[m.queryIdx].pt
        pts_3d_raw[i] = points_3d[m.trainIdx]

    # 3. Filter bad points (NaNs or Infs)
    valid_mask = np.isfinite(pts_3d_raw).all(axis=1) & np.isfinite(pts_2d_raw).all(axis=1)
    pts_2d = pts_2d_raw[valid_mask]
    pts_3d = pts_3d_raw[valid_mask]

    if len(pts_2d) < 6:
        return {
            "success": False, 
            "building": "Admin",
            "reason": "Too few valid points after filtering NaNs"
        }, None, None

    # 4. Force contiguous memory (Standard N,2 and N,3 shapes)
    pts_2d = np.ascontiguousarray(pts_2d)
    pts_3d = np.ascontiguousarray(pts_3d)

    # 5. Fix camera matrix and distortion coefficients format
    cam_mat = np.ascontiguousarray(CAMERA_MATRIX, dtype=np.float32)
    dist_c = np.zeros(4, dtype=np.float32) # Flat 1D array is safest for OpenCV

    # --- DEBUG PRINTS --- 
    # If it crashes again, look at your terminal to see what these printed!
    print(f"🚀 DEBUG PNP: pts_3d shape={pts_3d.shape}, pts_2d shape={pts_2d.shape}")
    print(f"🚀 DEBUG PNP: cam_mat shape={cam_mat.shape}, dist_c shape={dist_c.shape}")
    
    # 🚨 HARD FAILSAFE: Prevent OpenCV crash if points dropped below 6
    if pts_3d.shape[0] < 6 or pts_2d.shape[0] < 6:
        return {
            "success": False, 
            "building": "Admin",
            "reason": f"PnP failed: Only {pts_3d.shape[0]} valid points survived. Need 6+."
        }, None, None
    
    # =====================================================
    # PNP POSE ESTIMATION (UPGRADED SOLVER)
    # =====================================================
    ok, rvec, tvec, inliers = cv2.solvePnPRansac(
        pts_3d,
        pts_2d,
        cam_mat,
        dist_c,
        reprojectionError=15.0,
        confidence=0.99,          # 🔥 INCREASED to 99% confidence
        iterationsCount=1000,     # 🔥 INCREASED from 100 to 1000 attempts
        flags=cv2.SOLVEPNP_EPNP   # 🔥 ADDED: Best solver for building walls
    )

    # Safe fallback if inliers is exactly None
    if inliers is None:
        inliers = []

    if not ok or len(inliers) < 4:
        return {
            "success": False,
            "building": "Admin", 
            "reason": f"PnP failed. Inliers found: {len(inliers)}",
            "inliers": int(len(inliers))
        }, None, None

    R_cam, _ = cv2.Rodrigues(rvec)
    cam_pos = (-R_cam.T @ tvec).flatten()

    x, z = cam_pos[0], cam_pos[2]
    pt = np.array([x, z, 1.0], dtype=np.float32)
    cam_map = transform_matrix @ pt

    confidence = min(1.0, len(inliers) / 80)

    result = {
        "success": True,
        "building": "Admin",
        "map_x": float(cam_map[0]),
        "map_y": float(cam_map[1]),
        "confidence": float(confidence),
        "matches": len(good),
        "inliers": int(len(inliers))
    }

    log_localization(image_path, result, rvec, tvec)

    return result, rvec, tvec

# =========================================================
# WRAPPER
# =========================================================
def localize_admin(image_path: str):
    result, _, _ = localize_admin_with_pose(image_path)
    return result
