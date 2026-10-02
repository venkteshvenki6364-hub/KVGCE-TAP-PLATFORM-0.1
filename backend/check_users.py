import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["kvgce_tap"]
    users = await db.users.find({}, {"_id": 0, "email": 1, "full_name": 1, "student_id": 1, "role": 1, "department": 1, "semester": 1, "academics": 1}).to_list(length=100)
    print(f"Total Users Found in DB: {len(users)}")
    for u in users:
        print(f"Name: {u.get('full_name')} | Email: {u.get('email')} | USN/ID: {u.get('student_id')} | Role: {u.get('role')} | Dept: {u.get('department')} | Sem: {u.get('semester')}")

if __name__ == "__main__":
    asyncio.run(check_users())
