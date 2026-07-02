from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, Admin
from auth import hash_password, verify_password, create_access_token, get_current_admin

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class AdminCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str = None

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(
        (Admin.username == request.username) | (Admin.email == request.username)
    ).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(request.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"id": admin.id, "username": admin.username, "role": "admin"})
    return {
        "success": True,
        "token": token,
        "admin": {
            "id": admin.id,
            "username": admin.username,
            "email": admin.email,
            "full_name": admin.full_name,
        },
    }

@router.post("/register")
def register_admin(admin_data: AdminCreate, db: Session = Depends(get_db)):
    existing = db.query(Admin).filter(
        (Admin.username == admin_data.username) | (Admin.email == admin_data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    hashed_pw = hash_password(admin_data.password)
    admin = Admin(
        username=admin_data.username,
        email=admin_data.email,
        password_hash=hashed_pw,
        full_name=admin_data.full_name,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return {"success": True, "message": "Admin created successfully", "id": admin.id}

@router.get("/me")
def get_me(admin: dict = Depends(get_current_admin)):
    return admin
