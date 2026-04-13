import os
from typing import List
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
  DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBProduct(Base):
  __tablename__ = "Product"
  id= Column(Integer, primary_key=True, index=True)
  name= Column(String)
  category= Column(String)
  price = Column(Float)
  image = Column(String)

Base.metadata.create_all(bind=engine)

class ProductSchema(BaseModel):
  id: int
  name: str
  category: str
  price: float
  image: str

  class Config:
    from_attributes = True

app = FastAPI(title= "Market Backend API")

app.add_middleware(
  CORSMiddleware,
  allow_origins= ["*"],
  allow_credentials= True,
  allow_methods = ["*"],
  allow_headers = ["*"]
)

def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()

@app.get("/")
def health_check():
  return {
    "status": "online",
    "message": "Market Backend is running on FastAPI"
  }

@app.get("/api/products", response_model = List[ProductSchema])
def get_products(db: Session = Depends(get_db)):
  products = db.query(DBProduct).all()
  return products
