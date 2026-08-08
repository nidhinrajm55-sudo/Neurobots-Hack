import os
import certifi
import uuid
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = "devinsight"

class MockCursor:
    def __init__(self, data):
        self.data = data
        
    def sort(self, key, direction=1):
        # direction 1 = ascending, -1 = descending
        reverse = (direction == -1)
        self.data.sort(key=lambda x: x.get(key, 0), reverse=reverse)
        return self
        
    def limit(self, n):
        self.data = self.data[:n]
        return self
        
    def __iter__(self):
        return iter(self.data)
        
    def __list__(self):
        return self.data

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.data = []
        
    def insert_one(self, doc):
        if '_id' not in doc:
            doc['_id'] = str(uuid.uuid4())
        self.data.append(doc)
        return type('obj', (object,), {'inserted_id': doc['_id']})
        
    def find_one(self, query=None):
        query = query or {}
        for doc in self.data:
            match = True
            for k, v in query.items():
                # Handle simple $gte
                if isinstance(v, dict):
                    for op, val in v.items():
                        if op == '$gte':
                            # Ensure types match for comparison (datetime vs str)
                            # In main.py timestamp is datetime object when stored, 
                            # but filtering might start with datetime
                            doc_val = doc.get(k)
                            if isinstance(doc_val, str):
                                try:
                                    doc_val = datetime.fromisoformat(doc_val.replace('Z', '+00:00'))
                                except:
                                    pass
                            elif doc_val is None:
                                doc_val = datetime.now()  # fallback for testing
                            if not (doc_val >= val):
                                match = False
                        elif op == '$lte':
                            doc_val = doc.get(k)
                            if isinstance(doc_val, str):
                                try:
                                    doc_val = datetime.fromisoformat(doc_val.replace('Z', '+00:00'))
                                except:
                                    pass
                            elif doc_val is None:
                                doc_val = datetime.now()  # fallback for testing
                            if not (doc_val <= val):
                                match = False
                        # Add other ops if needed
                elif doc.get(k) != v:
                    match = False
            if match:
                return doc
        return None
        
    def find(self, query=None):
        query = query or {}
        results = []
        for doc in self.data:
            match = True
            for k, v in query.items():
                # Handle simple $gte
                if isinstance(v, dict):
                    for op, val in v.items():
                        if op == '$gte':
                            # Ensure types match for comparison (datetime vs str)
                            # In main.py timestamp is datetime object when stored, 
                            # but filtering might start with datetime
                            doc_val = doc.get(k)
                            if isinstance(doc_val, str):
                                try:
                                    doc_val = datetime.fromisoformat(doc_val.replace('Z', '+00:00'))
                                except:
                                    pass
                            elif doc_val is None:
                                doc_val = datetime.now()  # fallback for testing
                            if not (doc_val >= val):
                                match = False
                        elif op == '$lte':
                            doc_val = doc.get(k)
                            if isinstance(doc_val, str):
                                try:
                                    doc_val = datetime.fromisoformat(doc_val.replace('Z', '+00:00'))
                                except:
                                    pass
                            elif doc_val is None:
                                doc_val = datetime.now()  # fallback for testing
                            if not (doc_val <= val):
                                match = False
                        # Add other ops if needed
                elif doc.get(k) != v:
                    match = False
            if match:
                results.append(doc)
        return MockCursor(results)
    
    def update_one(self, query, update):
        query = query or {}
        update_data = update.get('$set', {})
        for doc in self.data:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                doc.update(update_data)
                return type('obj', (object,), {'matched_count': 1, 'modified_count': 1})
        return type('obj', (object,), {'matched_count': 0, 'modified_count': 0})

class MockDatabase:
    def __init__(self):
        self.collections = {}
        print("⚠️  USING IN-MEMORY MOCK DATABASE (MongoDB unavailable) ⚠️")
        
    def __getattr__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

# Try to connect to real Mongo (Atlas then Local), fall back to Mock
try:
    print(f"🔄 Attempting connection to MongoDB Atlas...")
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    client.server_info() # trigger connection check
    db = client[DB_NAME]
    print("✅ Connected to real MongoDB Atlas")
except Exception as e:
    print(f"⚠️ Atlas connection failed ({e})")
    try:
        print("🔄 Falling back to Local MongoDB (mongodb://localhost:27017)...")
        client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
        client.server_info()
        db = client[DB_NAME]
        print("✅ Connected to Local MongoDB (localhost:27017)")
    except Exception as e2:
        print(f"⚠️ Local MongoDB connection failed ({e2})")
        db = MockDatabase()
