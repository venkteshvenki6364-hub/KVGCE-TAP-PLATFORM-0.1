# KVGCE TAP — Activity Tracking & Management System

KVGCE TAP is an integrated full-stack application built for **KVG College of Engineering**.

## Directory Structure
```
KVGCE-TAP/
├── frontend/     # React 19 + Vite Frontend Application
├── backend/      # FastAPI Python REST API Backend & Data Store
├── database/     # Seed Data & Database Documentation
└── docs/         # System Architecture & API Specification Docs
```

## Quick Start Guide

### 1. Run FastAPI Backend
```powershell
cd backend
python -m uvicorn app.main:app --port 8000
```
API Health Check: `http://localhost:8000/api/health`

### 2. Run React Frontend
```powershell
cd frontend
npm run dev
```
Local Web URL: `http://localhost:5173`

## Demo Credentials (Password: `Password123!`)
- **Student**: `student@kvgce.edu.in`
- **Faculty**: `faculty@kvgce.edu.in`
- **Admin**: `admin@kvgce.edu.in`
