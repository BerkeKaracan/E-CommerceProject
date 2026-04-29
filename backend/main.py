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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import pyotp

# --- 1. GÜVENLİ VERİTABANI BAĞLANTISI ---
load_dotenv()
raw_url = os.getenv("DATABASE_URL")

if raw_url:
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)
    DATABASE_URL = raw_url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")
else:
    DATABASE_URL = "sqlite:///./market.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# İŞTE EKSİK OLAN VE KRİTİK SATIR:
Base = declarative_base() 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- 2. AYARLAR ---
SECRET_KEY = "market-super-secret-key" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 

# --- 3. VERİTABANI MODELLERİ ---
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
    is_discounted = Column(Integer, default=0)
    discount_rate = Column(Integer, default=0)

class CheckoutRequest(BaseModel):
    promo_codes: list[str] = []

class DBUser(Base):
    __tablename__ = "User"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    totp_secret = Column(String, nullable=True)
    is_2fa_enabled = Column(Integer, default=0)
    points = Column(Integer, default=100)

class DBPromoCode(Base):
    __tablename__ = "PromoCode"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    discount_amount = Column(Float)
    is_used = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("User.id"))

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

class DBComment(Base):
    __tablename__ = "Comment"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("Product.id"))
    user_id = Column(Integer, ForeignKey("User.id"))
    text = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DBSavedItem(Base):
    __tablename__ = "SavedItem"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("User.id"))
    product_id = Column(Integer, ForeignKey("Product.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DBAddress(Base):
    __tablename__ = "Address"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    full_address = Column(String, nullable=False)
    is_default = Column(Integer, default=0)

# --- 4. PYDANTIC ŞEMALARI ---
class ExchangePointsRequest(BaseModel):
    points: int
    discount: float

class CommentUpdate(BaseModel):
    text: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class PromoValidateRequest(BaseModel):
    code: str
  
class TwoFaVerifyRequest(BaseModel):
    code: str
    secret: str

class ProductSchema(BaseModel):
    id: int
    name: str
    category: str
    price: float
    image: str
    description: Optional[str] = None
    is_discounted: Optional[int] = 0
    discount_rate: Optional[int] = 0
    class Config:
        from_attributes = True

class CommentAdd(BaseModel):
    product_id: int
    text: str

class AddressCreate(BaseModel):
    title: str
    full_address: str
    is_default: int = 0

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
    points: int
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int

class Login2FaVerifyRequest(BaseModel):
    user_id: int
    code: str

class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductSchema 
    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []

# --- 5. FASTAPI UYGULAMASI VE AYARLARI ---
app = FastAPI(title="Market Backend API")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

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

# --- 6. ENDPOINT'LER ---
@app.get("/")
def health_check():
    return {"status": "online", "message": "Market Backend is running on FastAPI"}

@app.get("/api/products", response_model=List[ProductSchema])
def get_products(db: Session = Depends(get_db)):
    return db.query(DBProduct).all()

@app.get("/api/products/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/api/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(DBUser).filter(DBUser.email == user.email).first():
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
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if db_user.is_2fa_enabled == 1:
        return {"requires_2fa": True, "user_id": db_user.id, "message": "2FA code required"}
    
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {"id": db_user.id, "name": db_user.name, "email": db_user.email}
    }

@app.post("/api/login/verify-2fa")
def login_verify_2fa(req: Login2FaVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == req.user_id).first()
    if not user or user.is_2fa_enabled == 0:
        raise HTTPException(status_code=400, detail="Invalid operation.")

    if pyotp.TOTP(user.totp_secret).verify(req.code):
        access_token = create_access_token(data={"sub": str(user.id)})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"id": user.id, "name": user.name, "email": user.email}
        }
    raise HTTPException(status_code=400, detail="Invalid 6-digit code!")

@app.get("/api/me", response_model=UserStatsResponse)
def get_me(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    order_count = db.query(DBOrder).filter(DBOrder.user_id == current_user.id).count()
    joined_date = current_user.created_at.strftime("%B %Y") if current_user.created_at else "April 2026"
    return {
        "id": current_user.id, "email": current_user.email, "name": current_user.name,
        "order_count": order_count, "joined_at": joined_date, "points": current_user.points
    }

@app.put("/api/profile", response_model=UserResponse)
def update_profile(user_update: UserUpdate, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    if user_update.name is not None:
        current_user.name = user_update.name
        
    if user_update.email is not None and user_update.email != current_user.email:
        if db.query(DBUser).filter(DBUser.email == user_update.email).first():
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
            result.append({"id": item.id, "product_id": item.product_id, "quantity": item.quantity, "product": product})
    return result

@app.post("/api/cart")
def add_to_cart(item: CartItemAdd, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    existing_item = db.query(DBCartItem).filter(
        DBCartItem.user_id == current_user.id, DBCartItem.product_id == item.product_id
    ).first()

    if existing_item:
        existing_item.quantity += item.quantity
    else:
        db.add(DBCartItem(user_id=current_user.id, product_id=item.product_id, quantity=item.quantity))

    db.commit()
    return {"message": "Item added to cart"}

@app.delete("/api/cart/{product_id}")
def remove_from_cart(product_id: int, quantity: int = 1, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    item = db.query(DBCartItem).filter(
        DBCartItem.user_id == current_user.id, DBCartItem.product_id == product_id
    ).first()

    if item:
        if item.quantity > quantity:
            item.quantity -= quantity
        else:
            db.delete(item)
        db.commit()
        
    return {"message": "Item removed from cart"}

@app.post("/api/promo/generate")
def generate_promo(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    existing = db.query(DBPromoCode).filter(DBPromoCode.user_id == current_user.id, DBPromoCode.is_used == 0).first()
    if existing:
        return {"code": existing.code, "discount_amount": existing.discount_amount}
    
    import random, string
    new_code = "GIFT-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    db.add(DBPromoCode(code=new_code, discount_amount=5.0, user_id=current_user.id))
    db.commit()
    return {"code": new_code, "discount_amount": 5.0}

@app.post("/api/promo/validate")
def validate_promo(req: PromoValidateRequest, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    code_str = req.code.strip().upper()
    if code_str == "LOYALTY5":
        return {"valid": True, "discount_amount": 5.0}
        
    promo = db.query(DBPromoCode).filter(DBPromoCode.code == code_str).first()
    if not promo:
        raise HTTPException(status_code=400, detail="Invalid promo code.")
    if promo.is_used == 1:
        raise HTTPException(status_code=400, detail="This promo code has already been used.")
    if promo.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="This code belongs to another user.")
        
    return {"valid": True, "discount_amount": promo.discount_amount}

@app.post("/api/checkout")
def process_checkout(req: CheckoutRequest, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    cart_items = db.query(DBCartItem).filter(DBCartItem.user_id == current_user.id).all()
    if not cart_items: raise HTTPException(status_code=400, detail="Cart is empty")

    total = sum((db.query(DBProduct).filter(DBProduct.id == i.product_id).first().price * i.quantity) for i in cart_items)
    
    total_discount = 0.0
    for code_in in req.promo_codes:
        code_str = code_in.strip().upper()
        promo = db.query(DBPromoCode).filter(DBPromoCode.code == code_str, DBPromoCode.is_used == 0, DBPromoCode.user_id == current_user.id).first()
        if promo:
            total_discount += promo.discount_amount
            promo.is_used = 1 
        elif code_str == "WELCOME10": 
            total_discount += 10.0

    final_total = max(0, total + 1.0 - total_discount)

    db.add(DBOrder(user_id=current_user.id, total_amount=final_total))
    db.query(DBCartItem).filter(DBCartItem.user_id == current_user.id).delete()
    current_user.points += int(final_total // 10)
    
    db.commit()
    return {"message": "Order completed successfully", "final_total": final_total}

@app.get("/api/orders")
def get_user_orders(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    return db.query(DBOrder).filter(DBOrder.user_id == current_user.id).order_by(DBOrder.created_at.desc()).all()

@app.post("/api/ai/chat")
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="AI API key not configured.")
    
    ai_client = genai.Client(api_key=GEMINI_API_KEY)
    
    try:
        products = db.query(DBProduct).all()
        product_list_str = "\n".join([f"- {p.name} (Category: {p.category}, Price: ${p.price})" for p in products])

        top_sellers = db.query(DBProduct).order_by(DBProduct.sales_count.desc()).limit(3).all()
        top_sellers_str = ", ".join([p.name for p in top_sellers if p.sales_count and p.sales_count > 0])

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
            
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.text)]))
            last_role = role

        if last_role == "user":
            contents.pop()
            
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=request.message)]))
        system_instruction = f"""
        You are 'Market AI', a high-end, extremely smart personal shopper and e-commerce assistant.
        YOUR INVENTORY: {product_list_str}
        CURRENT TRENDING ITEMS: {top_sellers_str}
        YOUR ADVANCED RULES & CAPABILITIES:
        1. CREATIVE COMBINATIONS: Creatively combine items from the inventory that fit the user's budget.
        2. BE DIRECT: Act like a luxury boutique assistant but NEVER over-explain. Be polite but quick.
        3. MULTI-FILTERING: Filter the inventory logically before replying.
        4. ALWAYS IN STOCK: Never say an item is out of stock. Shipping is always $1.00.
        5. LANGUAGE: ALWAYS reply in the language the user speaks.
        6. FORMATTING: Use Markdown to make your response visually appealing.
        7. LENGTH LIMIT: THIS IS CRITICAL. Keep your responses EXTREMELY short, direct, and concise. MAXIMUM 2 or 3 sentences. DO NOT write long paragraphs. Give the answer and stop.
        """

        response = await ai_client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
                max_output_tokens=1500,
                top_p=0.95
            ))
        
        return {"response": response.text}
        
    except Exception as e:
        print(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail="The AI encountered a tactical error.")

@app.get("/api/track/{order_id}")
def track_order(order_id: int, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found in our records.")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Top Secret: You are not authorized to view this order.")
    
    return {
        "id": order.id, "status": order.status, "total_amount": order.total_amount,
        "created_at": order.order_date if hasattr(order, 'order_date') else order.created_at 
    }
    
@app.get("/api/analytics/trending")
def get_trending_products(db: Session = Depends(get_db)):
    return {
        "best_sellers": db.query(DBProduct).order_by(DBProduct.sales_count.desc()).limit(10).all(),
        "message": "These are the most popular items based on our internal AI logic."
    }

@app.get("/api/fix-db")
def fix_database(db: Session = Depends(get_db)):
    try:
        # Sadece User tablosuna zorla points ekliyoruz ve anında kaydediyoruz
        db.execute(text('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 100;'))
        db.commit()
        return {"message": "SUCCESS! Points column added."}
    except Exception as e:
        db.rollback() # Hata olursa kilitlenmeyi aç
        return {"error": f"An error occurred: {str(e)}"}

@app.get("/api/products/{product_id}/comments")
def get_comments(product_id: int, db: Session = Depends(get_db)):
    comments = db.query(DBComment).filter(DBComment.product_id == product_id).order_by(DBComment.created_at.desc()).all()
    result = []
    for c in comments:
        user = db.query(DBUser).filter(DBUser.id == c.user_id).first()
        result.append({"id": c.id, "user_name": user.name if user else "Anonymous", "text": c.text, "created_at": c.created_at})
    return result

@app.post("/api/comments")
def add_comment(comment: CommentAdd, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    if len(comment.text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Comment is too short.")
    db.add(DBComment(product_id=comment.product_id, user_id=current_user.id, text=comment.text))
    db.commit()
    return {"message": "Comment added successfully"}

@app.get("/api/me/comments")
def get_my_comments(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    comments = db.query(DBComment).filter(DBComment.user_id == current_user.id).order_by(DBComment.created_at.desc()).all()
    result = []
    for c in comments:
        product = db.query(DBProduct).filter(DBProduct.id == c.product_id).first()
        if product:
            result.append({"id": c.id, "product_id": product.id, "product_name": product.name, "product_image": product.image, "text": c.text, "created_at": c.created_at})
    return result

@app.get("/api/me/saved")
def get_saved_items(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    saved = db.query(DBSavedItem).filter(DBSavedItem.user_id == current_user.id).order_by(DBSavedItem.created_at.desc()).all()
    result = []
    for s in saved:
        product = db.query(DBProduct).filter(DBProduct.id == s.product_id).first()
        if product:
            result.append({"id": s.id, "product_id": product.id, "product_name": product.name, "product_image": product.image, "product_price": product.price, "saved_at": s.created_at})
    return result

@app.post("/api/saved/{product_id}")
def toggle_saved_item(product_id: int, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    existing = db.query(DBSavedItem).filter(DBSavedItem.user_id == current_user.id, DBSavedItem.product_id == product_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Removed from saved", "is_saved": False}
    else:
        db.add(DBSavedItem(user_id=current_user.id, product_id=product_id))
        db.commit()
        return {"message": "Added to saved", "is_saved": True}
        
@app.post("/api/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.email == request.email).first()
    if user:
        pass
    return {"message": "If an account exists, a reset link has been sent."}

@app.post("/api/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        user_id = int(request.token.split("_")[-1])
    except:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = pwd_context.hash(request.new_password)
    db.commit()
    return {"message": "Your password has been successfully reset. You can now sign in."}

@app.delete("/api/products/{product_id}")
async def delete_product(product_id: int, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.email != "testuser@gmail.com":
        raise HTTPException(status_code=403, detail="Unauthorized: Only admin can delete products")
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    db.query(DBCartItem).filter(DBCartItem.product_id == product_id).delete()
    db.query(DBComment).filter(DBComment.product_id == product_id).delete()
    db.query(DBSavedItem).filter(DBSavedItem.product_id == product_id).delete()
    db.delete(product)
    db.commit()
    return {"message": "Product successfully deleted"}

@app.put("/api/comments/{comment_id}")
def update_comment(comment_id: int, comment_update: CommentUpdate, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    existing_comment = db.query(DBComment).filter(DBComment.id == comment_id, DBComment.user_id == current_user.id).first()
    if not existing_comment: raise HTTPException(status_code=404, detail="Comment not found or unauthorized")
    if len(comment_update.text.strip()) < 3: raise HTTPException(status_code=400, detail="Comment is too short.")
    existing_comment.text = comment_update.text
    db.commit()
    return {"message": "Comment updated successfully"}

@app.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    existing_comment = db.query(DBComment).filter(DBComment.id == comment_id, DBComment.user_id == current_user.id).first()
    if not existing_comment: raise HTTPException(status_code=404, detail="Comment not found or unauthorized")
    db.delete(existing_comment)
    db.commit()
    return {"message": "Comment deleted successfully"}
  
@app.put("/api/change-password")
def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    if not pwd_context.verify(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")
    current_user.hashed_password = pwd_context.hash(request.new_password)
    db.commit()
    return {"message": "Password successfully updated!"}

@app.get("/api/addresses")
def get_addresses(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    return db.query(DBAddress).filter(DBAddress.user_id == current_user.id).all()

@app.post("/api/addresses")
def create_address(req: AddressCreate, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    if req.is_default == 1:
        db.query(DBAddress).filter(DBAddress.user_id == current_user.id).update({"is_default": 0})
    db.add(DBAddress(user_id=current_user.id, title=req.title, full_address=req.full_address, is_default=req.is_default))
    db.commit()
    return {"message": "Address added successfully"}

@app.delete("/api/addresses/{address_id}")
def delete_address(address_id: int, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    address = db.query(DBAddress).filter(DBAddress.id == address_id, DBAddress.user_id == current_user.id).first()
    if not address: raise HTTPException(status_code=404, detail="Address not found")
    db.delete(address)
    db.commit()
    return {"message": "Address deleted"}

@app.get("/api/2fa/setup")
def setup_2fa(current_user: DBUser = Depends(get_current_user)):
    if current_user.is_2fa_enabled == 1: raise HTTPException(status_code=400, detail="2FA is already enabled on this account.")
    secret = pyotp.random_base32()
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="PremiumMarket")
    return {"secret": secret, "uri": uri}

@app.post("/api/2fa/verify")
def verify_2fa(req: TwoFaVerifyRequest, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    if pyotp.TOTP(req.secret).verify(req.code):
        current_user.totp_secret = req.secret
        current_user.is_2fa_enabled = 1
        db.commit()
        return {"message": "2FA successfully enabled!"}
    raise HTTPException(status_code=400, detail="Invalid verification code.")

@app.get("/api/user/rewards")
def get_user_rewards(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    active_codes = db.query(DBPromoCode).filter(DBPromoCode.user_id == current_user.id, DBPromoCode.is_used == 0).all()
    return {"points": current_user.points, "active_codes": active_codes}

@app.post("/api/user/exchange-points")
def exchange_points(req: ExchangePointsRequest, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    if current_user.points < req.points:
        raise HTTPException(status_code=400, detail=f"Insufficient points! You need at least {req.points} PTS.")
    valid_tiers = {100: 10.0, 500: 50.0, 1000: 120.0}
    if req.points not in valid_tiers or valid_tiers[req.points] != req.discount:
        raise HTTPException(status_code=400, detail="Invalid reward tier selection.")

    current_user.points -= req.points
    import random, string
    new_code_str = "REWARD-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    db.add(DBPromoCode(code=new_code_str, discount_amount=req.discount, user_id=current_user.id))
    db.commit()
    return {"message": "Reward claimed successfully!", "code": new_code_str}