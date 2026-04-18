import os
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import Base, DBProduct, DBCartItem, DBComment, DBSavedItem
from dotenv import load_dotenv

# Veritabanı Bağlantısı
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def import_diverse_products():
    db = SessionLocal()
    
    print("SİSTEM: Eski kadın butiği (ASOS) imha ediliyor... 💥")
    db.query(DBCartItem).delete()
    db.query(DBComment).delete()
    db.query(DBSavedItem).delete()
    db.query(DBProduct).delete()
    db.commit()

    print("SİSTEM: DummyJSON'dan 150+ kusursuz karışım (Teknoloji, Giyim, Takı) çekiliyor...")
    
    # DummyJSON'dan 150 ürün çekiyoruz
    url = "https://dummyjson.com/products?limit=150"
    response = requests.get(url)
    
    if response.status_code != 200:
        print("HATA: Veriler çekilemedi!")
        return

    data = response.json()
    products_to_add = []
    
    print("SİSTEM: Ganimetler kendi veritabanımıza işleniyor...")

    for item in data.get('products', []):
        try:
            # Kategoriyi biraz daha derli toplu yapalım
            raw_category = str(item.get('category', 'general')).replace('-', ' ').title()
            
            # Resimlerden en net olanını al (thumbnail genelde kare ve nettir)
            image_url = item.get('thumbnail') or (item.get('images')[0] if item.get('images') else 'https://via.placeholder.com/400')
            
            products_to_add.append(DBProduct(
                name=str(item.get('title'))[:250],
                category=raw_category,
                price=float(item.get('price', 19.99)),
                image=image_url,
                sales_count=0,
                description=str(item.get('description'))
            ))
        except Exception as e:
            continue

    db.add_all(products_to_add)
    db.commit()
    
    print(f"BÜYÜK ZAFER: {len(products_to_add)} adet ultra çeşitli ürün (Telefon, Saat, Giyim) dükkana kalıcı olarak dizildi!")
    db.close()

if __name__ == "__main__":
    import_diverse_products()