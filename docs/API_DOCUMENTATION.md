# KVGCE TAP — API Documentation

## Auth Endpoints (`/api/auth`)
- `POST /api/auth/login`: Authenticate with email/USN and password.
- `POST /api/auth/register`: Register new user account.
- `GET /api/auth/me`: Get current authenticated user details.
- `POST /api/auth/logout`: Revoke session.

## Student Endpoints (`/api/students`)
- `GET /api/students/dashboard`: Student dashboard metrics, skills, assessments.
- `GET /api/students/profile`: Get profile details.
- `PUT /api/students/profile`: Update profile info.

## Faculty Endpoints (`/api/faculty`)
- `GET /api/faculty/dashboard`: Faculty analytics and pending tasks.
- `GET /api/faculty/students`: List department students.
- `PUT /api/faculty/activities/{id}/verify`: Approve/Reject student activity.
- `POST /api/faculty/feedback`: Submit feedback for student.

## Admin Endpoints (`/api/admin`)
- `GET /api/admin/dashboard`: Admin overview statistics.
- `GET /api/admin/users`: List all platform users.
- `POST /api/admin/users`: Create user account.
- `PUT /api/admin/users/{email}/toggle-status`: Activate/Deactivate user.
- `DELETE /api/admin/users/{email}`: Delete user.

## Assessments (`/api/assessments`)
- `GET /api/assessments`: List active tests.
- `POST /api/assessments/{id}/attempt`: Evaluate quiz attempt.
- `POST /api/assessments/coding/submit`: Submit coding solution.

## AI Assistant (`/api/ai`)
- `POST /api/ai/chat`: Interactive career chatbot prompt.
- `GET /api/ai/student-analysis`: Placement readiness score breakdown.
