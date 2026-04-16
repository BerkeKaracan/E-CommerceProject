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
from sqlalchemy import text

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
  sales_count = Column(Integer, default=0)
  view_count = Column(Integer, default=0)
  description = Column(String, default="Premium quality product from our exclusive collection. Guaranteed to elevate your style.")

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
  description: Optional[str] = None
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

@app.get("/api/products/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


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
      product.sales_count = (product.sales_count or 0) + item.quantity

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
    
    ai_client = genai.Client(api_key=GEMINI_API_KEY)
    
    try:
        products = db.query(DBProduct).all()
        product_list_str = "\n".join([f"- {p.name} (${p.price})" for p in products])

        top_sellers = db.query(DBProduct).order_by(DBProduct.sales_count.desc()).limit(3).all()
        top_sellers_str = ", ".join([p.name for p in top_sellers if p.sales_count and p.sales_count > 0])

        if not top_sellers_str:
            top_sellers_str = "No trending items yet (all items are newly stocked)."

        contents = []
        last_role = None
        
        for msg in request.history:
            if not contents and msg.sender == "ai":
                continue
            if "I cannot connect" in msg.text:
                continue

            role = "user" if msg.sender == "user" else "model"
            
            if role == last_role:
                contents.pop()
            
            contents.append(
                types.Content(role=role, parts=[types.Part.from_text(text=msg.text)])
            )
            last_role = role

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
        3. REAL-TIME TRENDS: Our current best-selling items are: {top_sellers_str}. If the user asks for recommendations, popular items, or trends, ONLY recommend these items.
        4. STOCK POLICY: We have infinite stock (made-to-order). NEVER say an item is out of stock. If a user asks about stock or availability, assure them it is always in stock and ready to order.
        5. ALWAYS and ONLY reply in ENGLISH.
        6. Keep it very brief (max 2 sentences).
        """

        response = await ai_client.aio.models.generate_content(
            model='gemini-2.5-flash', 
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=system_instruction)
        )
        
        return {"response": response.text}
        
    except Exception as e:
        print(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail="The AI encountered a tactical error.")

@app.get("/api/analytics/trending")
def get_trending_products(db: Session = Depends(get_db)):
    top_sellers = db.query(DBProduct).order_by(DBProduct.sales_count.desc()).limit(4).all()
    return {
        "best_sellers": top_sellers,
        "message": "These are the most popular items based on our internal AI logic."
    }

@app.get("/api/fix-db")
def fix_database(db: Session = Depends(get_db)):
    try:
        # Yeni description sütununu ekliyoruz
        db.execute(text('ALTER TABLE "Product" ADD COLUMN description VARCHAR DEFAULT \'Experience premium quality with this exclusive product. Made to order with infinite stock.\';'))
        db.commit()
        return {"message": "Operasyon basarili! Description (Aciklama) sutunu veritabanina eklendi."}
    except Exception as e:
        return {"error": "Zaten eklenmis olabilir veya hata: " + str(e)}