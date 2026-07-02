from sqlalchemy import create_engine, Column, Integer, String, Text, Date, Time, Boolean, DECIMAL, Enum, TIMESTAMP, UniqueConstraint, Index, func
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
from config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()

class Admin(Base):
    __tablename__ = "admin"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(50), unique=True, nullable=False)
    employee_name = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    designation = Column(String(255), nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    joining_date = Column(Date)
    face_image_path = Column(String(500))
    face_encoding_path = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_employee_id", "employee_id"),
        Index("idx_department", "department"),
        Index("idx_is_active", "is_active"),
    )

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(50), nullable=False)
    employee_name = Column(String(255), nullable=False)
    attendance_date = Column(Date, nullable=False)
    attendance_time = Column(Time, nullable=False)
    status = Column(Enum("Present", "Absent", "Late", "Half-Day"), default="Present")
    confidence_score = Column(DECIMAL(5, 2))
    camera_device = Column(String(255))
    ip_address = Column(String(45))
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index("idx_att_employee_id", "employee_id"),
        Index("idx_attendance_date", "attendance_date"),
        Index("idx_att_status", "status"),
        UniqueConstraint("employee_id", "attendance_date", name="unique_attendance"),
    )

class Log(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    log_type = Column(Enum("recognition", "failed_attempt", "registration", "system", "error"), nullable=False)
    employee_id = Column(String(50))
    employee_name = Column(String(255))
    message = Column(Text, nullable=False)
    confidence_score = Column(DECIMAL(5, 2))
    image_path = Column(String(500))
    ip_address = Column(String(45))
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index("idx_log_type", "log_type"),
        Index("idx_log_created_at", "created_at"),
        Index("idx_log_employee_id", "employee_id"),
    )

def init_db():
    Base.metadata.create_all(bind=engine)
    from auth import hash_password
    session = SessionLocal()
    try:
        existing = session.query(Admin).filter(
            (Admin.username == "admin") | (Admin.email == "pmahi7801@gmail.com")
        ).first()
        if not existing:
            admin = Admin(
                username="admin",
                email="pmahi7801@gmail.com",
                password_hash=hash_password("7418520963"),
                full_name="System Administrator",
            )
            session.add(admin)
            session.commit()
            print("Default admin created (pmahi7801@gmail.com / 7418520963)")
        else:
            existing.email = "pmahi7801@gmail.com"
            existing.password_hash = hash_password("7418520963")
            session.commit()
            print("Admin credentials updated")
    except Exception as e:
        session.rollback()
        print(f"Admin creation skipped: {e}")
    finally:
        session.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
