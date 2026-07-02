import os
import cv2
import numpy as np
import pickle
from PIL import Image
from io import BytesIO
import base64
from config import ENCODING_DIR, UPLOAD_DIR, FACE_CONFIDENCE_THRESHOLD

try:
    import insightface
    from insightface.app import FaceAnalysis
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=0, det_size=(640, 640))
    INSIGHT_AVAILABLE = True
    print("[FaceService] InsightFace loaded successfully")
except Exception as e:
    print(f"[FaceService] InsightFace init warning: {e}")
    INSIGHT_AVAILABLE = False
    app = None


def get_embedding(img_array: np.ndarray):
    if not INSIGHT_AVAILABLE or app is None:
        raise RuntimeError("InsightFace not available")
    faces = app.get(img_array)
    if len(faces) == 0:
        return None, "No face detected"
    if len(faces) > 1:
        return None, f"Multiple faces detected ({len(faces)})"
    face = faces[0]
    embedding = face.normed_embedding
    bbox = face.bbox.astype(int)
    return {"embedding": embedding, "bbox": bbox.tolist(), "det_score": float(face.det_score)}, None


def validate_face_image(image_bytes: bytes) -> dict:
    try:
        image = Image.open(BytesIO(image_bytes))
        image = image.convert("RGB")
        img_array = np.array(image)

        if img_array.shape[0] < 200 or img_array.shape[1] < 200:
            return {"valid": False, "message": "Image resolution too low. Minimum 200x200 pixels required."}

        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 50:
            return {"valid": False, "message": "Image is too blurry. Please upload a clearer image."}

        result, err = get_embedding(img_array)
        if result is None:
            return {"valid": False, "message": err}
        return {"valid": True, "message": "Image validated successfully.", "face_info": result}

    except RuntimeError as e:
        return {"valid": False, "message": str(e)}
    except Exception as e:
        return {"valid": False, "message": f"Error processing image: {str(e)}"}


def generate_face_encoding(image_bytes: bytes) -> dict:
    try:
        image = Image.open(BytesIO(image_bytes))
        image = image.convert("RGB")
        img_array = np.array(image)

        result, err = get_embedding(img_array)
        if result is None:
            return {"success": False, "message": err}

        return {"success": True, "encoding": result["embedding"], "det_score": result["det_score"]}

    except RuntimeError as e:
        return {"success": False, "message": str(e)}
    except Exception as e:
        return {"success": False, "message": f"Error generating encoding: {str(e)}"}


def save_encoding(employee_id: str, encoding: np.ndarray) -> str:
    encoding_path = os.path.join(ENCODING_DIR, f"{employee_id}.pkl")
    with open(encoding_path, "wb") as f:
        pickle.dump(encoding, f)
    return encoding_path


def load_encoding(employee_id: str):
    encoding_path = os.path.join(ENCODING_DIR, f"{employee_id}.pkl")
    if not os.path.exists(encoding_path):
        return None
    with open(encoding_path, "rb") as f:
        return pickle.load(f)


def load_all_encodings(employees: list) -> list:
    encoding_data = []
    for emp in employees:
        encoding = load_encoding(emp["employee_id"])
        if encoding is not None:
            encoding_data.append({
                "employee_id": emp["employee_id"],
                "employee_name": emp["employee_name"],
                "encoding": encoding,
            })
    return encoding_data


def recognize_face(image_bytes: bytes, registered_encodings: list) -> dict:
    try:
        image = Image.open(BytesIO(image_bytes))
        image = image.convert("RGB")
        img_array = np.array(image)

        result, err = get_embedding(img_array)
        if result is None:
            return {"recognized": False, "message": err}

        live_embedding = result["embedding"]
        best_match = None
        best_similarity = -1.0

        for reg in registered_encodings:
            stored = reg["encoding"]
            if isinstance(stored, bytes):
                stored = pickle.loads(stored)
            similarity = float(np.dot(live_embedding, stored))
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = reg

        if best_match is None:
            return {"recognized": False, "message": "No registered employees found."}

        confidence = round(best_similarity * 100, 2)
        threshold = FACE_CONFIDENCE_THRESHOLD * 100

        if best_similarity >= FACE_CONFIDENCE_THRESHOLD:
            return {
                "recognized": True,
                "employee_id": best_match["employee_id"],
                "employee_name": best_match["employee_name"],
                "confidence": confidence,
                "similarity": round(best_similarity, 4),
                "message": "Face recognized successfully.",
            }
        else:
            return {
                "recognized": False,
                "employee_id": best_match["employee_id"],
                "employee_name": best_match["employee_name"],
                "confidence": confidence,
                "similarity": round(best_similarity, 4),
                "message": f"Confidence too low ({confidence}%). Minimum required: {threshold}%.",
            }

    except RuntimeError as e:
        return {"recognized": False, "message": str(e)}
    except Exception as e:
        return {"recognized": False, "message": f"Error during recognition: {str(e)}"}


def decode_base64_image(base64_string: str) -> bytes:
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    return base64.b64decode(base64_string)


def compress_image(image_bytes: bytes, quality: int = 85) -> bytes:
    image = Image.open(BytesIO(image_bytes))
    buffer = BytesIO()
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")
    image.save(buffer, format="JPEG", quality=quality, optimize=True)
    return buffer.getvalue()
