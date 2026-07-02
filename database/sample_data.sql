USE face_attendance;

INSERT INTO admin (username, email, password_hash, full_name) VALUES
('admin', 'admin@faceattendance.com', '$2b$12$LJ3m4ys3Lz6dYx9Yx9Yx9uYx9Yx9Yx9Yx9Yx9Yx9Yx9Yx9Yx9e', 'System Administrator');

INSERT INTO employees (employee_id, employee_name, department, designation, phone, email, joining_date) VALUES
('EMP001', 'Alice Johnson', 'Engineering', 'Senior Developer', '+1-555-0101', 'alice@company.com', '2023-01-15'),
('EMP002', 'Bob Smith', 'Marketing', 'Marketing Lead', '+1-555-0102', 'bob@company.com', '2023-03-01'),
('EMP003', 'Charlie Brown', 'Sales', 'Sales Executive', '+1-555-0103', 'charlie@company.com', '2023-06-10'),
('EMP004', 'Diana Prince', 'HR', 'HR Manager', '+1-555-0104', 'diana@company.com', '2022-11-20'),
('EMP005', 'Eve Davis', 'Finance', 'Accountant', '+1-555-0105', 'eve@company.com', '2023-02-14'),
('EMP006', 'Frank Miller', 'Engineering', 'Frontend Developer', '+1-555-0106', 'frank@company.com', '2023-08-05'),
('EMP007', 'Grace Lee', 'Design', 'UX Designer', '+1-555-0107', 'grace@company.com', '2023-04-22'),
('EMP008', 'Henry Wilson', 'Operations', 'Operations Manager', '+1-555-0108', 'henry@company.com', '2022-09-15'),
('EMP009', 'Ivy Chen', 'Engineering', 'Backend Developer', '+1-555-0109', 'ivy@company.com', '2023-07-01'),
('EMP010', 'Jack Taylor', 'Support', 'Support Lead', '+1-555-0110', 'jack@company.com', '2023-05-12');

INSERT INTO attendance (employee_id, employee_name, attendance_date, attendance_time, status, confidence_score, camera_device) VALUES
('EMP001', 'Alice Johnson', CURDATE(), '09:00:00', 'Present', 97.50, 'Webcam'),
('EMP002', 'Bob Smith', CURDATE(), '09:15:00', 'Present', 96.80, 'Webcam'),
('EMP003', 'Charlie Brown', CURDATE(), '09:30:00', 'Present', 95.20, 'Webcam'),
('EMP004', 'Diana Prince', CURDATE(), '08:55:00', 'Present', 98.10, 'Webcam'),
('EMP005', 'Eve Davis', CURDATE(), '10:00:00', 'Late', 94.50, 'Webcam'),
('EMP006', 'Frank Miller', CURDATE(), '09:10:00', 'Present', 96.00, 'Webcam');

INSERT INTO logs (log_type, employee_id, employee_name, message, confidence_score) VALUES
('recognition', 'EMP001', 'Alice Johnson', 'Attendance marked - Present', 97.50),
('recognition', 'EMP002', 'Bob Smith', 'Attendance marked - Present', 96.80),
('recognition', 'EMP003', 'Charlie Brown', 'Attendance marked - Present', 95.20),
('failed_attempt', NULL, NULL, 'Unknown person attempted recognition', NULL),
('recognition', 'EMP004', 'Diana Prince', 'Attendance marked - Present', 98.10);
