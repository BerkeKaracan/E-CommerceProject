import os
import random  
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import Base, DBProduct, DBCartItem, DBComment, DBSavedItem
from dotenv import load_dotenv

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def import_diverse_products():
    db = SessionLocal()
    
    print("SYSTEM: Purging old data...")
    db.query(DBCartItem).delete()
    db.query(DBComment).delete()
    db.query(DBSavedItem).delete()
    db.query(DBProduct).delete()
    db.commit()

    print("SYSTEM: Fetching 150+ diverse items from DummyJSON...")
    
    url = "https://dummyjson.com/products?limit=150"
    response = requests.get(url)
    
    if response.status_code != 200:
        print("ERROR: Failed to fetch data!")
        return

    data = response.json()
    products_to_add = []
    
    print("SYSTEM: Populating database with items, calculating dynamic discounts and sales...")

    for item in data.get('products', []):
        try:
            raw_category = str(item.get('category', 'general')).replace('-', ' ').title()
            image_url = item.get('thumbnail') or (item.get('images')[0] if item.get('images') else 'https://via.placeholder.com/400')
            
            sales = random.randint(0, 5000)
            is_discounted = 1 if random.random() < 0.25 else 0
            discount_rate = random.choice([10, 15, 20, 30, 50]) if is_discounted == 1 else 0

            products_to_add.append(DBProduct(
                name=str(item.get('title'))[:250],
                category=raw_category,
                price=float(item.get('price', 19.99)),
                image=image_url,
                sales_count=sales,           
                description=str(item.get('description')),
                is_discounted=is_discounted, 
                discount_rate=discount_rate  
            ))
        except Exception as e:
            continue

    db.add_all(products_to_add)
    db.commit()
    
    print(f"SUCCESS: {len(products_to_add)} premium products successfully added with real images and dynamic stats!")
    db.close()

if __name__ == "__main__":
    import_diverse_products()