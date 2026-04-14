import os
import random
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
# main.py içindeki modelleri ve Base'i içe aktarıyoruz
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
    print("--- NÜKLEER OPERASYON BAŞLADI: Tam Veritabanı Sıfırlama ---")
    
    # 1. HER ŞEYİ SİL (Tablo yapılarını sıfırlamak için şart)
    print("Eski tablolar imha ediliyor...")
    Base.metadata.drop_all(bind=engine)
    
    # 2. YENİ YAPILARLA TEKRAR OLUŞTUR
    print("Yeni tablolar (Tarih sütunlarıyla) inşa ediliyor...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 3. ÜRÜNLERİ BAS
        print("100 yeni ürün enjekte ediliyor...")
        products = generate_mock_products()
        for p in products:
            db.add(DBProduct(**p))
        
        db.commit()
        print(f"--- BAŞARI: Dükkan sıfırlandı ve 100 ürün eklendi! ---")
    except Exception as e:
        print(f"KRİTİK HATA: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()