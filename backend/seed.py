import os
import random
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
# Import models and Base from main.py
from main import Base, DBProduct, DBUser, DATABASE_URL

load_dotenv(dotenv_path="../.env")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def generate_mock_products():
    categories = ["electronics", "men's clothing", "women's clothing", "jewelery", "shoes", "home", "sports", "books"]
    adjectives = ["Premium", "Wireless", "Smart", "Classic", "Modern", "Luxury", "Pro", "Ultra"]
    nouns = ["Headphones", "T-Shirt", "Sneakers", "Watch", "Jacket", "Backpack", "Speaker", "Monitor"]
    images = ["/t-shirt.png", "/airphone.png", "/necklace.png", "/product.png", "/jacket.png", "/summer_dress.png", "/smartwatch.png", "/ring.png"]

    products = []
    for i in range(1, 101):
        products.append({
            "name": f"{random.choice(adjectives)} {random.choice(nouns)} {random.randint(100, 999)}",
            "category": random.choice(categories),
            "price": round(random.uniform(9.99, 899.99), 2),
            "image": random.choice(images)
        })
    return products

def seed_data():
    print("--- NUCLEAR OPERATION INITIATED: Full Database Reset ---")
    
    # 1. DELETE EVERYTHING (Required to reset table structures)
    print("Destroying old tables...")
    Base.metadata.drop_all(bind=engine)
    
    # 2. RECREATE WITH NEW STRUCTURES
    print("Building new tables (with Date columns)...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 3. SEED PRODUCTS
        print("Injecting 100 new products...")
        products = generate_mock_products()
        for p in products:
            db.add(DBProduct(**p))
        
        db.commit()
        print(f"--- SUCCESS: Store reset and 100 products added! ---")
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()