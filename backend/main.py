import os
from typing import List, Optional
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func
from pydantic import BaseModel
from dotenv import load_dotenv
from passlib.context import CryptContext
from google import genai
from google.genai import types

load_dotenv(dotenv_path="../.env")
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
  DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- JWT SETTINGS ---
SECRET_KEY = "market-cok-gizli-anahtar" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 

# --- DATABASE MODELS ---
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
  created_at = Column(DateTime(timezone=True), server_default=func.now())

class DBCartItem(Base):
  __tablename__ = "CartItem"
  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("User.id"))
  product_id = Column(Integer, ForeignKey("Product.id"))
  quantity = Column(Integer, default=1)

class DBOrder(Base):
  __tablename__ = "Order"
  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("User.id"))
  total_amount = Column(Float)
  status = Column(String, default="Completed")
  created_at = Column(DateTime(timezone=True), server_default=func.now())

#Base.metadata.create_all(bind=engine)

# --- PYDANTIC SCHEMAS ---
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

class UserStatsResponse(BaseModel):
    id: int
    name: str
    email: str
    order_count: int
    joined_at: str
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
  email: str
  password: str

class UserUpdate(BaseModel):
  name: Optional[str] = None
  email: Optional[str] = None

class CartItemAdd(BaseModel):
  product_id: int
  quantity: int

class CartItemResponse(BaseModel):
  id: int
  product_id: int
  quantity: int
  product: ProductSchema 

  class Config:
    from_attributes = True

app = FastAPI(title="Market Backend API")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []

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

# --- SECURITY & AUTH FUNCTIONS ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def create_access_token(data: dict):
  to_encode = data.copy()
  expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  to_encode.update({"exp": expire})
  encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
  credentials_exception = HTTPException(
    status_code=401,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
  )
  try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id: str = payload.get("sub")
    if user_id is None:
      raise credentials_exception
  except JWTError:
    raise credentials_exception
  
  user = db.query(DBUser).filter(DBUser.id == int(user_id)).first()
  if user is None:
    raise credentials_exception
  return user

# --- ENDPOINTS ---
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
    raise HTTPException(status_code=400, detail="Email already registered")
  
  hashed_pw = pwd_context.hash(user.password)
  new_user = DBUser(name=user.name, email=user.email, hashed_password=hashed_pw)
  db.add(new_user)
  db.commit()
  db.refresh(new_user)
  return new_user

@app.post("/api/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
  db_user = db.query(DBUser).filter(DBUser.email == user.email).first()
  if not db_user:
    raise HTTPException(status_code=400, detail="Invalid email or password")
  
  if not pwd_context.verify(user.password, db_user.hashed_password):
    raise HTTPException(status_code=400, detail="Invalid email or password")
  
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

@app.get("/api/me", response_model=UserStatsResponse)
def get_me(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    order_count = db.query(DBOrder).filter(DBOrder.user_id == current_user.id).count()
    joined_date = current_user.created_at.strftime("%B %Y") if current_user.created_at else "April 2026"

    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "order_count": order_count,
        "joined_at": joined_date
    }

@app.put("/api/profile", response_model=UserResponse)
def update_profile(user_update: UserUpdate, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
  if user_update.name is not None:
    current_user.name = user_update.name
    
  if user_update.email is not None and user_update.email != current_user.email:
    existing_user = db.query(DBUser).filter(DBUser.email == user_update.email).first()
    if existing_user:
      raise HTTPException(status_code=400, detail="Email already in use")
    current_user.email = user_update.email

  db.commit()
  db.refresh(current_user)
  
  return current_user

@app.get("/api/cart")
def get_cart(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
  cart_items = db.query(DBCartItem).filter(DBCartItem.user_id == current_user.id).all()
  
  result = []
  for item in cart_items:
    product = db.query(DBProduct).filter(DBProduct.id == item.product_id).first()
    if product:
      result.append({
        "id": item.id,
        "product_id": item.product_id,
        "quantity": item.quantity,
        "product": product
      })
  return result

@app.post("/api/cart")
def add_to_cart(item: CartItemAdd, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
  existing_item = db.query(DBCartItem).filter(
    DBCartItem.user_id == current_user.id,
    DBCartItem.product_id == item.product_id
  ).first()

  if existing_item:
    existing_item.quantity += item.quantity
  else:
    new_item = DBCartItem(user_id=current_user.id, product_id=item.product_id, quantity=item.quantity)
    db.add(new_item)

  db.commit()
  return {"message": "Item added to cart"}

@app.delete("/api/cart/{product_id}")
def remove_from_cart(product_id: int, quantity: int = 1, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
  item = db.query(DBCartItem).filter(
    DBCartItem.user_id == current_user.id,
    DBCartItem.product_id == product_id
  ).first()

  if item:
    if item.quantity > quantity:
      item.quantity -= quantity
    else:
      db.delete(item)
    db.commit()
    
  return {"message": "Item removed from cart"}

@app.post("/api/checkout")
def process_checkout(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
  cart_items = db.query(DBCartItem).filter(DBCartItem.user_id == current_user.id).all()
  if not cart_items:
    raise HTTPException(status_code=400, detail="Cart is empty")
  total = 0
  for item in cart_items:
    product = db.query(DBProduct).filter(DBProduct.id == item.product_id).first()
    if product:
      total += product.price * item.quantity
  total += 1.0

  new_order = DBOrder(user_id=current_user.id, total_amount=total)
  db.add(new_order)

  db.query(DBCartItem).filter(DBCartItem.user_id == current_user.id).delete()
  
  db.commit()
  return {"message": "Order completed successfully", "order_id": new_order.id}

@app.get("/api/orders")
def get_user_orders(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    orders = db.query(DBOrder).filter(DBOrder.user_id == current_user.id).order_by(DBOrder.created_at.desc()).all()
    return orders

@app.post("/api/ai/chat")
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="AI API key not configured.")
    
    # Motoru içeride başlattığımız için kilitlenme (port 8000 dönme) sorunu bitti.
    ai_client = genai.Client(api_key=GEMINI_API_KEY)
    
    try:
        products = db.query(DBProduct).all()
        product_list_str = "\n".join([f"- {p.name} ({p.price} TL)" for p in products])

        # --- ZIRHLI HAFIZA ALGORİTMASI ---
        contents = []
        last_role = None
        
        for msg in request.history:
            # 1. Filtre: İlk sahte "Hello" mesajını atla
            if not contents and msg.sender == "ai":
                continue
            
            # 2. Filtre: Eski hata mesajlarını (I cannot connect) Google'a atma, aklı karışmasın
            if "I cannot connect" in msg.text:
                continue

            role = "user" if msg.sender == "user" else "model"
            
            # 3. KESİN ÇÖZÜM: Google ardışık aynı rollere izin vermez.
            # Eğer peş peşe "user->user" gelirse, öncekini silip zinciri koruyoruz.
            if role == last_role:
                contents.pop()
            
            contents.append(
                types.Content(role=role, parts=[types.Part.from_text(text=msg.text)])
            )
            last_role = role

        # Şimdi YENİ mesajı "user" olarak ekliyoruz. 
        # Eğer son mesaj zaten user ise (zincir kopmasın diye) onu eziyoruz.
        if last_role == "user":
            contents.pop()
            
        contents.append(
            types.Content(role="user", parts=[types.Part.from_text(text=request.message)])
        )

        system_instruction = f"""
        You are a smart, high-end, and concise virtual assistant for an e-commerce website.
        RULES:
        1. Answer ONLY based on the inventory below.
        2. Inventory: {product_list_str}
        3. ALWAYS and ONLY reply in ENGLISH.
        4. Keep it very brief (max 2 sentences).
        """

        # 'chats' OTURUMU YOK! Direkt 'generate_content' ile temiz diziyi gönderiyoruz.
        # Bu sayede 500 hatası sıfıra iniyor.
        response = await ai_client.aio.models.generate_content(
            model='gemini-2.5-flash', 
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=system_instruction)
        )
        
        return {"response": response.text}
        
    except Exception as e:
        print(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail="The AI encountered a tactical error.")

