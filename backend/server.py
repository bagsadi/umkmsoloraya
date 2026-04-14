from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import uuid
import bcrypt
import jwt
import requests
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# CORS
frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('CORS_ORIGINS', '*'))
origins = [frontend_url] if frontend_url != '*' else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# JWT config
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Tidak terautentikasi")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token tidak valid")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User tidak ditemukan")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token kedaluwarsa")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid")

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "umkm-directory"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# Models
class LoginInput(BaseModel):
    email: str
    password: str

class UMKMCreate(BaseModel):
    nama: str
    kategori: str
    deskripsi: str
    alamat: str = ""
    telepon: str = ""
    harga_range: str = ""
    rating: float = 0
    badges: List[str] = []
    image_url: str = ""

class UMKMUpdate(BaseModel):
    nama: Optional[str] = None
    kategori: Optional[str] = None
    deskripsi: Optional[str] = None
    alamat: Optional[str] = None
    telepon: Optional[str] = None
    harga_range: Optional[str] = None
    rating: Optional[float] = None
    badges: Optional[List[str]] = None
    image_url: Optional[str] = None

# Seed admin
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@umkm.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

# Seed demo UMKM data
async def seed_umkm():
    count = await db.umkm.count_documents({})
    if count > 0:
        return
    demo_data = [
        {"nama": "Warung Nasi Padang Bu Ani", "kategori": "kuliner", "deskripsi": "Warung nasi padang autentik dengan cita rasa khas Minang. Menyediakan berbagai lauk pauk seperti rendang, gulai, dan sambalado.", "alamat": "Jl. Merdeka No. 45, Jakarta Selatan", "telepon": "081234567890", "harga_range": "Rp 15.000 - Rp 35.000", "rating": 4.8, "badges": ["viral", "best_seller"], "image_url": "https://images.unsplash.com/photo-1539755530862-00f623c00f52?w=600"},
        {"nama": "Bakso Mercon Pak Joko", "kategori": "kuliner", "deskripsi": "Bakso pedas level 1-10 dengan kuah kaldu sapi yang gurih. Tersedia juga mie ayam dan pangsit goreng.", "alamat": "Jl. Sudirman No. 12, Bandung", "telepon": "081234567891", "harga_range": "Rp 12.000 - Rp 25.000", "rating": 4.5, "badges": ["termurah"], "image_url": "https://images.unsplash.com/photo-1555126634-323283e090fa?w=600"},
        {"nama": "Batik Cirebon Asli", "kategori": "fashion", "deskripsi": "Koleksi batik tulis dan cap Cirebon dengan motif mega mendung, taman arum, dan motif khas lainnya.", "alamat": "Jl. Kartini No. 8, Cirebon", "telepon": "081234567892", "harga_range": "Rp 150.000 - Rp 2.500.000", "rating": 4.9, "badges": ["best_seller"], "image_url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"},
        {"nama": "Streetwear Lokal ID", "kategori": "fashion", "deskripsi": "Brand fashion lokal dengan desain kekinian. Menyediakan kaos, hoodie, dan aksesoris streetwear.", "alamat": "Jl. Braga No. 25, Bandung", "telepon": "081234567893", "harga_range": "Rp 89.000 - Rp 350.000", "rating": 4.3, "badges": ["viral"], "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600"},
        {"nama": "Kerajinan Rotan Nusantara", "kategori": "handmade", "deskripsi": "Produk kerajinan rotan berkualitas tinggi mulai dari tas, lampu hias, hingga furnitur mini.", "alamat": "Jl. Kerajinan No. 3, Cirebon", "telepon": "081234567894", "harga_range": "Rp 75.000 - Rp 1.500.000", "rating": 4.7, "badges": ["best_seller"], "image_url": "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=600"},
        {"nama": "Clay Art Studio", "kategori": "handmade", "deskripsi": "Studio keramik dan clay art yang menerima custom order untuk dekorasi rumah dan souvenir.", "alamat": "Jl. Seni No. 15, Yogyakarta", "telepon": "081234567895", "harga_range": "Rp 50.000 - Rp 500.000", "rating": 4.6, "badges": ["termurah"], "image_url": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600"},
        {"nama": "EventKu Organizer", "kategori": "jasa_event", "deskripsi": "Jasa event organizer profesional untuk pernikahan, ulang tahun, dan acara korporat.", "alamat": "Jl. Gatot Subroto No. 50, Jakarta", "telepon": "081234567896", "harga_range": "Rp 5.000.000 - Rp 50.000.000", "rating": 4.8, "badges": ["viral", "best_seller"], "image_url": "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600"},
        {"nama": "Dekorasi Impian", "kategori": "jasa_event", "deskripsi": "Spesialis dekorasi untuk semua jenis acara dengan tema modern dan tradisional.", "alamat": "Jl. Pemuda No. 22, Surabaya", "telepon": "081234567897", "harga_range": "Rp 3.000.000 - Rp 30.000.000", "rating": 4.4, "badges": [], "image_url": "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600"},
        {"nama": "Bengkel Jaya Motor", "kategori": "jasa_otomotif", "deskripsi": "Bengkel motor dan mobil dengan layanan servis berkala, tune up, dan perbaikan mesin.", "alamat": "Jl. Raya Bogor No. 100, Depok", "telepon": "081234567898", "harga_range": "Rp 50.000 - Rp 5.000.000", "rating": 4.5, "badges": ["termurah"], "image_url": "https://images.unsplash.com/photo-1645445522156-9ac06bc7a767?w=600"},
        {"nama": "Auto Detailing Pro", "kategori": "jasa_otomotif", "deskripsi": "Layanan detailing mobil premium: coating, polishing, dan interior cleaning.", "alamat": "Jl. Industri No. 7, Tangerang", "telepon": "081234567899", "harga_range": "Rp 200.000 - Rp 3.000.000", "rating": 4.7, "badges": ["viral"], "image_url": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600"},
        {"nama": "Kopi Nusantara", "kategori": "kuliner", "deskripsi": "Kedai kopi dengan biji kopi single origin dari berbagai daerah di Indonesia. Manual brew dan espresso.", "alamat": "Jl. Diponegoro No. 18, Malang", "telepon": "081234567800", "harga_range": "Rp 15.000 - Rp 45.000", "rating": 4.6, "badges": ["viral"], "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600"},
        {"nama": "Rajut Cantik", "kategori": "handmade", "deskripsi": "Produk rajutan tangan berkualitas: tas rajut, boneka, dan aksesoris rajut custom.", "alamat": "Jl. Melati No. 5, Solo", "telepon": "081234567801", "harga_range": "Rp 35.000 - Rp 250.000", "rating": 4.4, "badges": ["termurah"], "image_url": "https://images.unsplash.com/photo-1582131503261-fca1d1c0589f?w=600"},
    ]
    for item in demo_data:
        item["id"] = str(uuid.uuid4())
        item["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.umkm.insert_many(demo_data)
    logger.info(f"Seeded {len(demo_data)} UMKM entries")

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await seed_admin()
    await seed_umkm()
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.warning(f"Storage init failed (will retry on upload): {e}")
    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write(f"## Admin\n- Email: {os.environ.get('ADMIN_EMAIL', 'admin@umkm.com')}\n- Password: {os.environ.get('ADMIN_PASSWORD', 'admin123')}\n- Role: admin\n\n")
        f.write("## Auth Endpoints\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n\n")
        f.write("## UMKM Endpoints\n- GET /api/umkm\n- POST /api/umkm (admin)\n- PUT /api/umkm/{id} (admin)\n- DELETE /api/umkm/{id} (admin)\n- POST /api/upload (admin)\n- GET /api/files/{path}\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Auth endpoints
@api_router.post("/auth/login")
async def login(response: Response, input: LoginInput):
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "user"), "token": access_token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Berhasil logout"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

# Upload endpoint
@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    await get_current_user(request)
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    return {"path": result["path"], "size": result.get("size", len(data))}

@api_router.get("/files/{path:path}")
async def download_file(path: str):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception:
        raise HTTPException(status_code=404, detail="File tidak ditemukan")

# UMKM endpoints
@api_router.get("/umkm")
async def list_umkm(
    page: int = Query(1, ge=1),
    limit: int = Query(9, ge=1, le=50),
    search: str = Query("", description="Search by name"),
    kategori: str = Query("", description="Filter by category"),
    badge: str = Query("", description="Filter by badge"),
    sort: str = Query("terbaru", description="Sort: terbaru, rating, nama")
):
    query = {}
    if search:
        query["nama"] = {"$regex": search, "$options": "i"}
    if kategori:
        query["kategori"] = kategori
    if badge:
        query["badges"] = badge
    
    sort_field = [("created_at", -1)]
    if sort == "rating":
        sort_field = [("rating", -1)]
    elif sort == "nama":
        sort_field = [("nama", 1)]
    
    total = await db.umkm.count_documents(query)
    skip = (page - 1) * limit
    items = await db.umkm.find(query, {"_id": 0}).sort(sort_field).skip(skip).limit(limit).to_list(limit)
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total + limit - 1) // limit)
    }

@api_router.get("/umkm/{umkm_id}")
async def get_umkm(umkm_id: str):
    item = await db.umkm.find_one({"id": umkm_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="UMKM tidak ditemukan")
    return item

@api_router.post("/umkm")
async def create_umkm(request: Request, input: UMKMCreate):
    await get_current_user(request)
    doc = input.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.umkm.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/umkm/{umkm_id}")
async def update_umkm(request: Request, umkm_id: str, input: UMKMUpdate):
    await get_current_user(request)
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Tidak ada data untuk diupdate")
    result = await db.umkm.update_one({"id": umkm_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="UMKM tidak ditemukan")
    updated = await db.umkm.find_one({"id": umkm_id}, {"_id": 0})
    return updated

@api_router.delete("/umkm/{umkm_id}")
async def delete_umkm(request: Request, umkm_id: str):
    await get_current_user(request)
    result = await db.umkm.delete_one({"id": umkm_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="UMKM tidak ditemukan")
    return {"message": "UMKM berhasil dihapus"}

@api_router.get("/stats")
async def get_stats(request: Request):
    await get_current_user(request)
    total = await db.umkm.count_documents({})
    pipeline = [{"$group": {"_id": "$kategori", "count": {"$sum": 1}}}]
    kategori_stats = await db.umkm.aggregate(pipeline).to_list(100)
    return {
        "total_umkm": total,
        "kategori_stats": {item["_id"]: item["count"] for item in kategori_stats}
    }

@api_router.get("/")
async def root():
    return {"message": "UMKM Directory API"}

app.include_router(api_router)
