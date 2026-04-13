import os
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class DBProduct(Base):
    __tablename__ = "Product"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
    price = Column(Float)
    image = Column(String)

Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    products = [
        {"name": "T-Shirt Blue Adidas", "category": "men's clothing", "price": 49.99, "image": "/t-shirt.png"},
        {"name": "Sony Wireless Headphones", "category": "electronics", "price": 199.9, "image": "/airphone.png"},
        {"name": "Gold Plated Necklace", "category": "jewelery", "price": 250.0, "image": "/necklace.png"},
        {"name": "Running Shoes Nike", "category": "shoes", "price": 129.5, "image": "/product.png"},
        {"name": "Leather Jacket Retro", "category": "men's clothing", "price": 340.0, "image": "/jacket.png"},
        {"name": "Floral Summer Dress", "category": "women's clothing", "price": 89.99, "image": "/summer_dress.png"},
        {"name": "Smartwatch Pro Series", "category": "electronics", "price": 299.0, "image": "/smartwatch.png"},
        {"name": "Diamond Ring 14k", "category": "jewelery", "price": 899.99, "image": "/ring.png"},
    ]
    
    print("--- Starting Database Seeding ---")
    try:
        db.query(DBProduct).delete()
        for p in products:
            db.add(DBProduct(**p))
        db.commit()
        print("--- SUCCESS: All products added to Supabase! ---")
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()