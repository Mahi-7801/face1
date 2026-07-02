import os
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from database import get_db, Employee, Log
from auth import get_current_admin
from services.face_service import validate_face_image, generate_face_encoding, save_encoding, compress_image
from config import UPLOAD_DIR

router = APIRouter(prefix="/api/employees", tags=["Employees"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@router.get("/")
def list_employees(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    employees = db.query(Employee).order_by(Employee.created_at.desc()).all()
    return {"success": True, "employees": [e.__dict__ for e in employees]}


@router.get("/{employee_id}")
def get_employee(employee_id: str, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    emp = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "employee": emp.__dict__}


@router.post("/register")
async def register_employee(
    employee_id: str = Form(...),
    employee_name: str = Form(...),
    department: str = Form(...),
    designation: str = Form(...),
    phone: str = Form(None),
    email: str = Form(None),
    joining_date: str = Form(None),
    face_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    existing = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    file_ext = os.path.splitext(face_image.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    image_bytes = await face_image.read()

    validation = validate_face_image(image_bytes)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail=validation["message"])

    encoding_result = generate_face_encoding(image_bytes)
    if not encoding_result["success"]:
        raise HTTPException(status_code=400, detail=encoding_result["message"])

    filename = f"{employee_id}_{uuid.uuid4().hex}{file_ext}"
    image_path = os.path.join(UPLOAD_DIR, filename)
    with open(image_path, "wb") as f:
        f.write(image_bytes)

    encoding_path = save_encoding(employee_id, encoding_result["encoding"])

    compressed = compress_image(image_bytes)
    comp_filename = f"{employee_id}_compressed.jpg"
    comp_path = os.path.join(UPLOAD_DIR, comp_filename)
    with open(comp_path, "wb") as f:
        f.write(compressed)

    jd = None
    if joining_date:
        try:
            jd = datetime.strptime(joining_date, "%Y-%m-%d").date()
        except ValueError:
            pass

    emp = Employee(
        employee_id=employee_id,
        employee_name=employee_name,
        department=department,
        designation=designation,
        phone=phone,
        email=email,
        joining_date=jd,
        face_image_path=f"uploads/{filename}",
        face_encoding_path=f"encodings/{employee_id}.pkl",
    )
    db.add(emp)

    log = Log(
        log_type="registration",
        employee_id=employee_id,
        employee_name=employee_name,
        message=f"Employee {employee_name} registered successfully",
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Employee registered successfully",
        "employee_id": employee_id,
    }


@router.put("/{employee_id}")
async def update_employee(
    employee_id: str,
    employee_name: str = Form(None),
    department: str = Form(None),
    designation: str = Form(None),
    phone: str = Form(None),
    email: str = Form(None),
    joining_date: str = Form(None),
    face_image: UploadFile = File(None),
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    emp = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if employee_name:
        emp.employee_name = employee_name
    if department:
        emp.department = department
    if designation:
        emp.designation = designation
    if phone:
        emp.phone = phone
    if email:
        emp.email = email
    if joining_date:
        try:
            emp.joining_date = datetime.strptime(joining_date, "%Y-%m-%d").date()
        except ValueError:
            pass

    if face_image:
        image_bytes = await face_image.read()
        validation = validate_face_image(image_bytes)
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=validation["message"])

        encoding_result = generate_face_encoding(image_bytes)
        if not encoding_result["success"]:
            raise HTTPException(status_code=400, detail=encoding_result["message"])

        file_ext = os.path.splitext(face_image.filename)[1].lower()
        filename = f"{employee_id}_{uuid.uuid4().hex}{file_ext}"
        image_path = os.path.join(UPLOAD_DIR, filename)
        with open(image_path, "wb") as f:
            f.write(image_bytes)

        encoding_path = save_encoding(employee_id, encoding_result["encoding"])
        emp.face_image_path = f"uploads/{filename}"
        emp.face_encoding_path = f"encodings/{employee_id}.pkl"

    db.commit()
    return {"success": True, "message": "Employee updated successfully"}


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    emp = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if emp.face_image_path:
        img_path = os.path.join(os.path.dirname(UPLOAD_DIR), emp.face_image_path)
        if os.path.exists(img_path):
            os.remove(img_path)

    enc_path = os.path.join(ENCODING_DIR if "ENCODING_DIR" in dir() else "../encodings", f"{employee_id}.pkl")
    # simple removal of encoding file
    enc_full = os.path.join(os.path.dirname(UPLOAD_DIR), "encodings", f"{employee_id}.pkl")
    if os.path.exists(enc_full):
        os.remove(enc_full)

    log = Log(
        log_type="system",
        employee_id=employee_id,
        employee_name=emp.employee_name,
        message=f"Employee {emp.employee_name} deleted",
    )
    db.add(log)
    db.delete(emp)
    db.commit()

    return {"success": True, "message": "Employee deleted successfully"}
