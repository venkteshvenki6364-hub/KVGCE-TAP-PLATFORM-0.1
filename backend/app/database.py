import os
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
from app.config import settings

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "db_store.json")

class InMemoryDatabase:
    """Fallback high-performance persistent JSON document store for non-Mongo environments."""
    def __init__(self):
        self.collections: Dict[str, List[Dict[str, Any]]] = {}
        self._load_from_file()

    def _load_from_file(self):
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    self.collections = json.load(f)
            except Exception:
                self.collections = {}

    def _save_to_file(self):
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        try:
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(self.collections, f, indent=2)
        except Exception as e:
            print("Error saving database file:", e)

    def get_collection(self, name: str):
        if name not in self.collections:
            self.collections[name] = []
        return InMemoryCollection(self.collections[name], self._save_to_file)

class InMemoryCollection:
    def __init__(self, data_list: List[Dict[str, Any]], save_callback):
        self.data = data_list
        self.save_callback = save_callback

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for item in self.data:
            match = True
            for k, v in query.items():
                if k == "$or":
                    or_match = any(
                        all(item.get(sub_k) == sub_v for sub_k, sub_v in cond.items())
                        for cond in v
                    )
                    if not or_match:
                        match = False
                        break
                elif item.get(k) != v:
                    match = False
                    break
            if match:
                return dict(item)
        return None

    async def find(self, query: Dict[str, Any] = None, sort=None, limit=0) -> List[Dict[str, Any]]:
        results = []
        query = query or {}
        for item in self.data:
            match = True
            for k, v in query.items():
                if k == "$or":
                    or_match = any(
                        all(item.get(sub_k) == sub_v for sub_k, sub_v in cond.items())
                        for cond in v
                    )
                    if not or_match:
                        match = False
                        break
                elif item.get(k) != v:
                    match = False
                    break
            if match:
                results.append(dict(item))
        
        if limit and limit > 0:
            results = results[:limit]
        return results

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        if "created_at" not in doc_copy:
            doc_copy["created_at"] = datetime.utcnow().isoformat()
        self.data.append(doc_copy)
        self.save_callback()
        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        item = await self.find_one(query)
        if not item:
            return
        if "$set" in update:
            for k, v in update["$set"].items():
                item[k] = v
        if "$push" in update:
            for k, v in update["$push"].items():
                if k not in item or not isinstance(item[k], list):
                    item[k] = []
                item[k].append(v)
        for idx, orig in enumerate(self.data):
            if orig["_id"] == item["_id"]:
                self.data[idx] = item
                break
        self.save_callback()

    async def delete_one(self, query: Dict[str, Any]):
        item = await self.find_one(query)
        if item:
            self.data[:] = [x for x in self.data if x["_id"] != item["_id"]]
            self.save_callback()

    async def count_documents(self, query: Dict[str, Any]) -> int:
        res = await self.find(query)
        return len(res)

class DatabaseManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.use_fallback = False
        self.fallback_db = InMemoryDatabase()

    async def connect_to_database(self):
        try:
            self.client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
            await self.client.admin.command('ping')
            self.db = self.client[settings.DB_NAME]
            self.use_fallback = False
            print(f"Connected successfully to MongoDB database: {settings.DB_NAME}")
        except Exception as e:
            print(f"MongoDB connection timeout/not available on {settings.MONGO_URI}. Initializing embedded database store.")
            self.use_fallback = True

    def get_collection(self, name: str):
        if self.use_fallback or self.db is None:
            return self.fallback_db.get_collection(name)
        return self.db[name]

db_manager = DatabaseManager()

def get_db_collection(collection_name: str):
    return db_manager.get_collection(collection_name)
