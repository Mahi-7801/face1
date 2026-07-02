import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = f"mysql+pymysql://{os.getenv('DATABASE_USER', 'root')}:{os.getenv('DATABASE_PASSWORD', '')}@{os.getenv('DATABASE_HOST', 'localhost')}:{os.getenv('DATABASE_PORT', '3307')}/{os.getenv('DATABASE_NAME', 'face_attendance')}"

JWT_SECRET = os.getenv("JWT_SECRET", "face-attendance-jwt-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, os.getenv("UPLOAD_DIR", "../uploads"))
ENCODING_DIR = os.path.join(BASE_DIR, os.getenv("ENCODING_DIR", "../encodings"))

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

FACE_CONFIDENCE_THRESHOLD = float(os.getenv("FACE_CONFIDENCE_THRESHOLD", "0.55"))
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(ENCODING_DIR, exist_ok=True)
