import os
import random
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import Base, DBProduct, DBCartItem, DBComment, DBSavedItem
from dotenv import load_dotenv

load_dotenv()

# Veritabanı bağlantısı
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./market.db")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_dummyjson_products():
    print("SİSTEM: 1. Tablolar kontrol ediliyor...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("SİSTEM: 2. Eski veriler temizleniyor...")
    db.query(DBCartItem).delete()
    db.query(DBComment).delete()
    db.query(DBSavedItem).delete()
    db.query(DBProduct).delete()
    db.commit()

    print("SİSTEM: 3. DummyJSON'dan 150+ ürün çekiliyor...")
    url = "https://dummyjson.com/products?limit=150"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        added_count = 0

        for item in data.get('products', []):
            try:
                # Kategori ve Resim formatını güvenli bir şekilde alalım
                raw_category = str(item.get('category', 'general')).replace('-', ' ').title()
                
                # Resim yoksa çökmemsi için varsayılan bir resim atayalım
                images = item.get('images', [])
                thumbnail = item.get('thumbnail')
                image_url = thumbnail if thumbnail else (images[0] if images else 'https://via.placeholder.com/400')

                sales = random.randint(0, 5000)
                is_discounted = 1 if random.random() < 0.25 else 0
                discount_rate = random.choice([10, 15, 20, 30, 50]) if is_discounted == 1 else 0

                new_product = DBProduct(
                    name=str(item.get('title'))[:250],
                    category=raw_category,
                    price=float(item.get('price', 19.99)),
                    image=image_url,
                    sales_count=sales,           
                    description=str(item.get('description', 'A premium product.')),
                    is_discounted=is_discounted, 
                    discount_rate=discount_rate,
                    stock=random.randint(10, 200) # Stok eklemeyi unutmadık!
                )
                db.add(new_product)
                added_count += 1
            except Exception as e:
                # Bir üründe hata çıkarsa sistemi çökertmek yerine o ürünü atla
                continue

        db.commit()
        print(f"BAŞARILI! {added_count} adet geniş kataloglu ürün mağazaya eklendi.")

    except Exception as e:
        print(f"HATA: Veriler çekilemedi. Detay: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_dummyjson_products()