# KVGCE-TAP Coding Lab Setup Guide (Judge0 CE Integration)

This document provides instructions for running the **KVGCE-TAP Coding Lab** with the self-hosted **Judge0 CE** code execution engine.

---

## 1. System Requirements

- **Docker Desktop** (version 20.10+ with Docker Compose v2)
- **Node.js** (v18 or v20+)
- **Python** (v3.10+)

---

## 2. Architecture Overview

```
React Coding Lab (Port 5173)
       │
       ▼
KVGCE-TAP FastAPI Backend (Port 8000)
       │
       ▼
Judge0 Service Adapter (`app/services/judge0_service.py`)
       │
       ▼
Judge0 CE Docker Container (Port 2358)
       │
       ▼
Isolated Sandbox / Compiler Workers (Java, Python, C++, C, Go, Rust, etc.)
```

---

## 3. Environment Variables

### Backend Configuration (`backend/.env`)

```env
JUDGE0_BASE_URL=http://127.0.0.1:2358
JUDGE0_AUTH_TOKEN=
MONGO_URI=mongodb://localhost:27017/kvgce_tap
```

### Frontend Configuration (`kvg-tap/.env`)

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## 4. Starting Judge0 CE Execution Engine

1. Navigate to the `judge0` directory:
   ```bash
   cd "d:\KVGCE-TAP PLATFORM 0.1\judge0"
   ```

2. Start the Judge0 services using Docker Compose:
   ```bash
   docker compose up -d
   ```

3. Verify Judge0 container health:
   ```bash
   docker compose ps
   curl http://127.0.0.1:2358/health
   curl http://127.0.0.1:2358/languages
   ```

---

## 5. Starting Backend Server

1. Navigate to the backend directory:
   ```bash
   cd "d:\KVGCE-TAP PLATFORM 0.1\backend"
   ```

2. Activate environment and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

4. Verify backend + Judge0 health check endpoint:
   ```bash
   curl http://127.0.0.1:8000/api/coding/health
   ```

---

## 6. Starting Frontend Application

1. Navigate to the frontend directory:
   ```bash
   cd "d:\KVGCE-TAP PLATFORM 0.1\kvg-tap"
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   `http://localhost:5173/student/coding`

---

## 7. Verifying End-to-End Execution Flow

### Test 1: Java Execution

**Code:**
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World from Judge0");
    }
}
```

- **Selected Language:** Java (OpenJDK 13)
- **Click:** Compile & Run
- **Expected Output:** `Hello World from Judge0`

### Test 2: Java Input (Stdin)

**Code:**
```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(n * 2);
    }
}
```

- **Stdin:** `10`
- **Expected Output:** `20`

### Test 3: Python Execution

**Code:**
```python
n = int(input())
print(f"Result: {n * 3}")
```

- **Stdin:** `5`
- **Expected Output:** `Result: 15`

---

## 8. Troubleshooting Network & Service Issues

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `Judge0 service unavailable` | Docker container not running on port 2358 | Run `docker compose up -d` inside `/judge0` |
| `ERR_CONNECTION_REFUSED` | FastAPI server down | Ensure uvicorn is running on `127.0.0.1:8000` |
| `Language Mismatch` | Code selected doesn't match compiler | Select correct language from dropdown |
