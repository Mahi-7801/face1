# AI Face Recognition Employee Attendance System

## Project Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- MySQL with PHPMyAdmin
- Webcam

### Database Setup
1. Open PHPMyAdmin (http://localhost/phpmyadmin)
2. Import `database/schema.sql` to create tables
3. Optionally import `database/sample_data.sql` for test data

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Backend runs on http://localhost:8000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

### Default Admin Login
- Username: admin
- Password: (set up via registration endpoint)

### Attendance Screen
- Navigate to http://localhost:5173/attendance
- No login required
- Stand in front of webcam for automatic recognition

### API Endpoints
- `POST /api/auth/login` - Admin login
- `POST /api/employees/register` - Register employee with face image
- `GET /api/employees/` - List all employees
- `POST /api/attendance/recognize` - Recognize face from webcam frame
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/stats` - Dashboard statistics
- `GET /api/attendance/reports` - Attendance reports with filters
- `GET /api/attendance/export` - Export attendance data

### Face Recognition Workflow
1. Admin registers employee with HD face image
2. Python backend validates image (single face, good quality)
3. Face encoding is generated and stored
4. Employee stands in front of webcam at attendance screen
5. Live frame is captured and sent to backend
6. Backend compares with stored encodings
7. If confidence >= 95%, attendance is marked (once per day)
8. Failed attempts are logged
