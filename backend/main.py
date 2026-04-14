import os
from typing import List
from datetime import datetime, timedelta
import jwt
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv(dotenv_path="../.env")
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
  DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- JWT AYARLARI (VIP KART) ---
SECRET_KEY = "market-cok-gizli-anahtar" # Şimdilik böyle kalabilir, ileride .env içine alacağız
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # Kart 7 gün boyunca geçerli olsun

# --- VERİTABANI MODELLERİ ---
class DBProduct(Base):
  __tablename__ = "Product"
  id = Column(Integer, primary_key=True, index=True)
  name = Column(String)
  category = Column(String)
  price = Column(Float)
  image = Column(String)

class DBUser(Base):
  __tablename__ = "User"
  id = Column(Integer, primary_key=True, index=True)
  name = Column(String)
  email = Column(String, unique=True, index=True)
  hashed_password = Column(String)

Base.metadata.create_all(bind=engine)

# --- PYDANTIC ŞEMALARI ---
class ProductSchema(BaseModel):
  id: int
  name: str
  category: str
  price: float
  image: str
  class Config:
    from_attributes = True

class UserCreate(BaseModel):
  name: str
  email: str
  password: str

class UserResponse(BaseModel):
  id: int
  name: str
  email: str
  class Config:
    from_attributes = True

# YENİ: Giriş Yapma Şeması
class UserLogin(BaseModel):
  email: str
  password: str

app = FastAPI(title="Market Backend API")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=False,
  allow_methods=["*"],
  allow_headers=["*"]
)

def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()

# YENİ: VIP Kart (Token) Üretme Fonksiyonu
def create_access_token(data: dict):
  to_encode = data.copy()
  expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  to_encode.update({"exp": expire})
  encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  return encoded_jwt

@app.get("/")
def health_check():
  return {"status": "online", "message": "Market Backend is running on FastAPI"}

@app.get("/api/products", response_model=List[ProductSchema])
def get_products(db: Session = Depends(get_db)):
  products = db.query(DBProduct).all()
  return products

@app.post("/api/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
  existing_user = db.query(DBUser).filter(DBUser.email == user.email).first()
  if existing_user:
    raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanımda.")
  
  hashed_pw = pwd_context.hash(user.password)
  new_user = DBUser(name=user.name, email=user.email, hashed_password=hashed_pw)
  db.add(new_user)
  db.commit()
  db.refresh(new_user)
  return new_user

# YENİ: GİRİŞ YAP (LOGIN) ENDPOINT'İ
@app.post("/api/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
  # 1. E-posta sistemde var mı?
  db_user = db.query(DBUser).filter(DBUser.email == user.email).first()
  if not db_user:
    raise HTTPException(status_code=400, detail="E-posta veya şifre hatalı.")
  
  # 2. Şifre doğru mu? (Gönderilen şifreyi, veritabanındaki karmaşık hash ile kıyasla)
  if not pwd_context.verify(user.password, db_user.hashed_password):
    raise HTTPException(status_code=400, detail="E-posta veya şifre hatalı.")
  
  # 3. Şifre doğruysa VIP Kartını (JWT) oluştur ve gönder
  access_token = create_access_token(data={"sub": str(db_user.id)})
  
  return {
    "access_token": access_token, 
    "token_type": "bearer",
    "user": {
      "id": db_user.id,
      "name": db_user.name,
      "email": db_user.email
    }
  }