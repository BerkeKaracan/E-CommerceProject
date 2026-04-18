import os
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import Base, DBProduct, DBCartItem, DBComment, DBSavedItem
from dotenv import load_dotenv

# .env dosyasını oku
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_database():
    db = SessionLocal()
    
    print("SİSTEM: Bağımlı veriler (Sepet, Favoriler, Yorumlar) temizleniyor...")
    db.query(DBCartItem).delete()
    db.query(DBComment).delete()
    db.query(DBSavedItem).delete()
    
    print("SİSTEM: Eski ürünler temizleniyor...")
    db.query(DBProduct).delete()
    db.commit()

    # KOMUTANIN YEREL CEPHANELİĞİ (Public Klasöründeki Resimler)
    images = {
        "Electronics": [
            "/airphone.png",     # Sony Kulaklık
            "/smartwatch.png"    # Akıllı Saat
        ],
        "Clothing": [
            "/jacket.png",       # Deri Ceket
            "/t-shirt.png",      # Siyah Tişört
            "/summer_dress.png"  # Yazlık Elbise
        ],
        "Shoes": [
            "/product.png"       # Pembe Sneaker
        ],
        "Accessories": [
            "/smartwatch.png",   # Saat aynı zamanda aksesuar
        ],
        "Jewelry": [
            "/ring.png",         # Pırlanta Yüzük
            "/necklace.png"      # Altın Kolye
        ]
    }

    brands = ["Aura", "Nova", "Luxe", "Zenith", "Urban", "Vanguard", "Prime", "Elevate", "Onyx", "Apex"]
    
    products_to_add = []
    
    # TAM 50 ADET ÜRÜN ÜRETİYORUZ
    for i in range(1, 51):
        category = random.choice(list(images.keys()))
        brand = random.choice(brands)
        
        if category == "Electronics":
            name = f"{brand} {random.choice(['Wireless Pro', 'Smart Display', 'Bluetooth Speaker', 'Tablet X', 'Gaming Gear'])} V{random.randint(1,5)}"
            desc = "High-tech and premium quality. Experience the next level of innovation. Engineered for perfection."
            price = round(random.uniform(99.0, 899.0), 2)
        elif category == "Clothing":
            name = f"{brand} {random.choice(['Denim Jacket', 'Cotton T-Shirt', 'Cargo Pants', 'Winter Parka', 'Summer Dress'])}"
            desc = "Comfortable, stylish, and made from sustainable materials. Perfect for your everyday look."
            price = round(random.uniform(19.99, 149.99), 2)
        elif category == "Shoes":
            name = f"{brand} {random.choice(['Running Sneakers', 'Leather Boots', 'Classic Loafers', 'Skate Shoes', 'High-Top Sneakers'])}"
            desc = "Durable and comfortable footwear designed for both performance and style. Step up your game."
            price = round(random.uniform(49.99, 199.99), 2)
        elif category == "Accessories":
            name = f"{brand} {random.choice(['Aviator Sunglasses', 'Leather Wallet', 'Travel Backpack', 'Classic Belt', 'Knit Beanie'])}"
            desc = "The perfect addition to complete your outfit. Elegant, highly functional, and built to last."
            price = round(random.uniform(25.0, 99.0), 2)
        else: # Jewelry
            name = f"{brand} {random.choice(['Silver Ring', 'Gold Necklace', 'Diamond Studs', 'Charm Bracelet', 'Minimalist Cuff'])}"
            desc = "Crafted with precision and care. Add a touch of luxury to your life with this timeless piece."
            price = round(random.uniform(50.0, 499.0), 2)

        # O kategoriye ait yerel resimlerden birini seç
        image = random.choice(images[category])
        sales = random.randint(0, 5000)

        products_to_add.append(
            DBProduct(
                name=name,
                category=category,
                price=price,
                image=image,
                sales_count=sales,
                description=desc
            )
        )

    db.add_all(products_to_add)
    db.commit()
    print(f"ZAFER: {len(products_to_add)} adet premium ürün (YEREL RESİMLERLE) veritabanına başarıyla eklendi!")
    db.close()

if __name__ == "__main__":
    seed_database()