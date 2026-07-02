from datetime import datetime, date, timedelta
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, Attendance, Employee, Log
from auth import get_current_admin
from services.face_service import recognize_face, load_all_encodings, decode_base64_image
from config import FACE_CONFIDENCE_THRESHOLD

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

class RecognizeRequest(BaseModel):
    image: str
    camera_device: Optional[str] = None
    ip_address: Optional[str] = None


@router.post("/recognize")
def recognize(request: RecognizeRequest, db: Session = Depends(get_db)):
    image_bytes = decode_base64_image(request.image)

    employees = db.query(Employee.employee_id, Employee.employee_name).filter(
        Employee.is_active == True
    ).all()

    if not employees:
        return {
            "success": False,
            "recognized": False,
            "message": "No registered employees found. Please contact admin.",
        }

    emp_list = [{"employee_id": e.employee_id, "employee_name": e.employee_name} for e in employees]
    registered_encodings = load_all_encodings(emp_list)

    if not registered_encodings:
        return {
            "success": False,
            "recognized": False,
            "message": "No face encodings found. Please contact admin.",
        }

    result = recognize_face(image_bytes, registered_encodings)

    if not result["recognized"]:
        log = Log(
            log_type="failed_attempt",
            employee_id=result.get("employee_id"),
            employee_name=result.get("employee_name"),
            message=result["message"],
            confidence_score=result.get("confidence"),
            ip_address=request.ip_address,
        )
        db.add(log)
        db.commit()
        return {
            "success": True,
            "recognized": False,
            "message": result["message"],
            "confidence": result.get("confidence", 0),
            "attendance_marked": False,
        }

    today = date.today()
    current_time = datetime.now().strftime("%H:%M:%S")

    existing = db.query(Attendance).filter(
        Attendance.employee_id == result["employee_id"],
        Attendance.attendance_date == today,
    ).first()

    if existing:
        log = Log(
            log_type="recognition",
            employee_id=result["employee_id"],
            employee_name=result["employee_name"],
            message="Face recognized but attendance already marked for today",
            confidence_score=result["confidence"],
            ip_address=request.ip_address,
        )
        db.add(log)
        db.commit()
        return {
            "success": True,
            "recognized": True,
            "employee_id": result["employee_id"],
            "employee_name": result["employee_name"],
            "confidence": result["confidence"],
            "attendance_marked": False,
            "message": "Attendance Already Recorded Today",
            "status": "already_marked",
        }

    att = Attendance(
        employee_id=result["employee_id"],
        employee_name=result["employee_name"],
        attendance_date=today,
        attendance_time=datetime.now().time(),
        status="Present",
        confidence_score=result["confidence"],
        camera_device=request.camera_device,
        ip_address=request.ip_address,
    )
    db.add(att)

    log = Log(
        log_type="recognition",
        employee_id=result["employee_id"],
        employee_name=result["employee_name"],
        message=f"Attendance marked - Present at {current_time}",
        confidence_score=result["confidence"],
        ip_address=request.ip_address,
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "recognized": True,
        "employee_id": result["employee_id"],
        "employee_name": result["employee_name"],
        "confidence": result["confidence"],
        "attendance_marked": True,
        "message": "Attendance Marked Successfully",
        "status": "present",
        "time": current_time,
    }


@router.get("/today")
def get_today_attendance(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    today = date.today()
    attendance = db.query(Attendance).filter(
        Attendance.attendance_date == today
    ).order_by(Attendance.attendance_time.desc()).all()

    total_employees = db.query(func.count(Employee.id)).filter(
        Employee.is_active == True
    ).scalar() or 0

    total_present = db.query(func.count(Attendance.id)).filter(
        Attendance.attendance_date == today
    ).scalar() or 0

    return {
        "success": True,
        "date": str(today),
        "total_employees": total_employees,
        "total_present": total_present,
        "total_absent": total_employees - total_present,
        "attendance": [
            {
                "id": a.id,
                "employee_id": a.employee_id,
                "employee_name": a.employee_name,
                "attendance_date": str(a.attendance_date),
                "attendance_time": str(a.attendance_time),
                "status": a.status,
                "confidence_score": float(a.confidence_score) if a.confidence_score else None,
                "camera_device": a.camera_device,
            }
            for a in attendance
        ],
    }


@router.get("/reports")
def get_attendance_reports(
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
    start_date: str = Query(None),
    end_date: str = Query(None),
    department: str = Query(None),
    employee_id: str = Query(None),
    month: int = Query(None),
    year: int = Query(None),
):
    from sqlalchemy import text
    q = db.query(Attendance)
    if start_date and end_date:
        q = q.filter(
            Attendance.attendance_date.between(
                datetime.strptime(start_date, "%Y-%m-%d").date(),
                datetime.strptime(end_date, "%Y-%m-%d").date(),
            )
        )
    if employee_id:
        q = q.filter(Attendance.employee_id == employee_id)
    if month and year:
        q = q.filter(
            func.month(Attendance.attendance_date) == month,
            func.year(Attendance.attendance_date) == year,
        )
    elif year:
        q = q.filter(func.year(Attendance.attendance_date) == year)

    q = q.order_by(Attendance.attendance_date.desc(), Attendance.attendance_time.desc())
    records = q.all()

    return {
        "success": True,
        "reports": [
            {
                "employee_id": r.employee_id,
                "employee_name": r.employee_name,
                "attendance_date": str(r.attendance_date),
                "attendance_time": str(r.attendance_time),
                "status": r.status,
                "confidence_score": float(r.confidence_score) if r.confidence_score else None,
            }
            for r in records
        ],
        "total_records": len(records),
    }


@router.get("/stats")
def get_attendance_stats(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    today = date.today()

    total_employees = db.query(func.count(Employee.id)).filter(
        Employee.is_active == True
    ).scalar() or 0

    today_present = db.query(func.count(Attendance.id)).filter(
        Attendance.attendance_date == today
    ).scalar() or 0

    week_ago = today - timedelta(days=7)
    weekly_rows = db.query(
        Attendance.attendance_date, func.count(Attendance.id).label("count")
    ).filter(
        Attendance.attendance_date >= week_ago,
        Attendance.attendance_date <= today,
    ).group_by(Attendance.attendance_date).order_by(Attendance.attendance_date).all()

    six_months_ago = today - timedelta(days=180)
    monthly_rows = db.query(
        func.date_format(Attendance.attendance_date, "%Y-%m").label("month"),
        func.count(Attendance.id).label("count"),
    ).filter(
        Attendance.attendance_date >= six_months_ago,
    ).group_by("month").order_by("month").all()

    recent_logs = db.query(Log).filter(Log.log_type != "failed_attempt").order_by(Log.created_at.desc()).limit(20).all()

    today_success = db.query(func.count(Log.id)).filter(
        Log.log_type == "recognition",
        func.date(Log.created_at) == today,
    ).scalar() or 0

    today_failed = db.query(func.count(Log.id)).filter(
        Log.log_type == "failed_attempt",
        func.date(Log.created_at) == today,
    ).scalar() or 0

    total_attempts = today_success + today_failed
    success_rate = round(today_success / total_attempts * 100, 2) if total_attempts > 0 else 0

    return {
        "success": True,
        "stats": {
            "total_employees": total_employees,
            "present_today": today_present,
            "absent_today": total_employees - today_present,
            "recognition_success_rate": success_rate,
            "weekly_data": [
                {"attendance_date": str(r.attendance_date), "count": r.count}
                for r in weekly_rows
            ],
            "monthly_data": [
                {"month": r.month, "count": r.count}
                for r in monthly_rows
            ],
            "recent_logs": [
                {
                    "id": l.id,
                    "log_type": l.log_type,
                    "employee_id": l.employee_id,
                    "employee_name": l.employee_name,
                    "message": l.message,
                    "confidence_score": float(l.confidence_score) if l.confidence_score else None,
                    "created_at": str(l.created_at),
                }
                for l in recent_logs
            ],
        },
    }


@router.get("/export")
def export_attendance(
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
    format: str = Query("csv"),
    start_date: str = Query(None),
    end_date: str = Query(None),
    department: str = Query(None),
):
    from datetime import datetime
    q = db.query(Attendance)
    if start_date and end_date:
        q = q.filter(
            Attendance.attendance_date.between(
                datetime.strptime(start_date, "%Y-%m-%d").date(),
                datetime.strptime(end_date, "%Y-%m-%d").date(),
            )
        )
    q = q.order_by(Attendance.attendance_date.desc(), Attendance.attendance_time.desc())
    records = q.all()

    data = [
        {
            "employee_id": r.employee_id,
            "employee_name": r.employee_name,
            "date": str(r.attendance_date),
            "time": str(r.attendance_time),
            "status": r.status,
            "confidence": float(r.confidence_score) if r.confidence_score else "",
        }
        for r in records
    ]

    if format == "csv":
        import csv, io
        output = io.StringIO()
        writer = csv.writer(output)
        if data:
            writer.writerow(data[0].keys())
            for row in data:
                writer.writerow(row.values())
        csv_content = output.getvalue()
        output.close()
        return {"success": True, "format": "csv", "data": csv_content}

    return {"success": True, "format": "json", "data": data}
