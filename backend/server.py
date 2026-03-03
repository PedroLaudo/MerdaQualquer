from fastapi import FastAPI, APIRouter, HTTPException, Header, Request, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import qrcode
from io import BytesIO
import socketio
import jwt
from passlib.context import CryptContext
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Socket.IO setup for real-time updates
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = "staff"  # admin, staff
    restaurant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "staff"
    restaurant_id: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Restaurant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RestaurantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

class Table(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    table_number: str
    capacity: int
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TableCreate(BaseModel):
    restaurant_id: str
    table_number: str
    capacity: int

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    restaurant_id: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0

class Extra(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    active: bool = True

class ExtraCreate(BaseModel):
    name: str
    price: float

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    category_id: str
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    extras: List[Extra] = []
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    restaurant_id: str
    category_id: str
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    extras: List[ExtraCreate] = []

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    extras: List[Extra] = []
    notes: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    table_id: str
    table_number: str
    items: List[OrderItem]
    total: float
    status: str = "received"  # received, preparing, ready, delivered, cancelled
    payment_status: str = "pending"  # pending, paid, failed
    payment_session_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    restaurant_id: str
    table_id: str
    table_number: str
    items: List[OrderItem]
    total: float
    notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    session_id: str
    amount: float
    currency: str = "eur"
    payment_status: str = "pending"
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CallWaiter(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    table_id: str
    table_number: str
    status: str = "pending"  # pending, resolved
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CallWaiterCreate(BaseModel):
    restaurant_id: str
    table_id: str
    table_number: str

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token não fornecido")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utilizador não encontrado")
    return user

# ============= SOCKET.IO EVENTS =============

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def join_restaurant(sid, data):
    restaurant_id = data.get('restaurant_id')
    await sio.enter_room(sid, f"restaurant_{restaurant_id}")
    logger.info(f"Client {sid} joined restaurant {restaurant_id}")

# ============= AUTH ROUTES =============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        restaurant_id=user_data.restaurant_id
    )
    
    doc = user.model_dump()
    doc['password'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "restaurant_id": user.restaurant_id
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    token = create_access_token({"sub": user['id'], "email": user['email'], "role": user['role']})
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "role": user['role'],
            "restaurant_id": user['restaurant_id']
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}

# ============= RESTAURANT ROUTES =============

@api_router.post("/restaurants", response_model=Restaurant)
async def create_restaurant(restaurant: RestaurantCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    rest = Restaurant(**restaurant.model_dump())
    doc = rest.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.restaurants.insert_one(doc)
    return rest

@api_router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants():
    restaurants = await db.restaurants.find({}, {"_id": 0}).to_list(1000)
    for r in restaurants:
        if isinstance(r['created_at'], str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return restaurants

@api_router.get("/restaurants/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(restaurant_id: str):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    if isinstance(restaurant['created_at'], str):
        restaurant['created_at'] = datetime.fromisoformat(restaurant['created_at'])
    return restaurant

@api_router.put("/restaurants/{restaurant_id}", response_model=Restaurant)
async def update_restaurant(restaurant_id: str, restaurant: RestaurantCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    existing = await db.restaurants.find_one({"id": restaurant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    
    update_data = restaurant.model_dump()
    await db.restaurants.update_one({"id": restaurant_id}, {"$set": update_data})
    
    updated = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

# ============= TABLE ROUTES =============

@api_router.post("/tables", response_model=Table)
async def create_table(table: TableCreate, current_user: dict = Depends(get_current_user)):
    t = Table(**table.model_dump())
    doc = t.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.tables.insert_one(doc)
    return t

@api_router.get("/tables/restaurant/{restaurant_id}", response_model=List[Table])
async def get_tables_by_restaurant(restaurant_id: str):
    tables = await db.tables.find({"restaurant_id": restaurant_id}, {"_id": 0}).to_list(1000)
    for t in tables:
        if isinstance(t['created_at'], str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    return tables

@api_router.get("/tables/{table_id}/qrcode")
async def get_table_qrcode(table_id: str):
    table = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")
    
    # Generate QR code URL
    frontend_url = os.environ.get('FRONTEND_URL', 'https://menuqr-12.preview.emergentagent.com')
    qr_data = f"{frontend_url}/menu?restaurant_id={table['restaurant_id']}&table_id={table['id']}"
    
    # Generate QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    
    return StreamingResponse(buf, media_type="image/png")

# ============= CATEGORY ROUTES =============

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    cat = Category(**category.model_dump())
    doc = cat.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.categories.insert_one(doc)
    return cat

@api_router.get("/categories/restaurant/{restaurant_id}", response_model=List[Category])
async def get_categories_by_restaurant(restaurant_id: str):
    categories = await db.categories.find(
        {"restaurant_id": restaurant_id, "active": True},
        {"_id": 0}
    ).sort("display_order", 1).to_list(1000)
    
    for c in categories:
        if isinstance(c['created_at'], str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return categories

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.categories.find_one({"id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    update_data = category.model_dump()
    await db.categories.update_one({"id": category_id}, {"$set": update_data})
    
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    await db.categories.update_one({"id": category_id}, {"$set": {"active": False}})
    return {"message": "Categoria desativada"}

# ============= PRODUCT ROUTES =============

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    extras = [Extra(**e.model_dump()) for e in product.extras]
    prod = Product(**{**product.model_dump(exclude={'extras'}), 'extras': extras})
    doc = prod.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.products.insert_one(doc)
    return prod

@api_router.get("/products/restaurant/{restaurant_id}", response_model=List[Product])
async def get_products_by_restaurant(restaurant_id: str):
    products = await db.products.find(
        {"restaurant_id": restaurant_id, "active": True},
        {"_id": 0}
    ).to_list(1000)
    
    for p in products:
        if isinstance(p['created_at'], str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return products

@api_router.get("/products/category/{category_id}", response_model=List[Product])
async def get_products_by_category(category_id: str):
    products = await db.products.find(
        {"category_id": category_id, "active": True},
        {"_id": 0}
    ).to_list(1000)
    
    for p in products:
        if isinstance(p['created_at'], str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return products

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    extras = [Extra(**e.model_dump()) for e in product.extras]
    update_data = {**product.model_dump(exclude={'extras'}), 'extras': [e.model_dump() for e in extras]}
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    await db.products.update_one({"id": product_id}, {"$set": {"active": False}})
    return {"message": "Produto desativado"}

# ============= ORDER ROUTES =============

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    ord = Order(**order.model_dump())
    doc = ord.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.orders.insert_one(doc)
    
    # Emit real-time event to restaurant
    await sio.emit('new_order', doc, room=f"restaurant_{order.restaurant_id}")
    
    return ord

@api_router.get("/orders/restaurant/{restaurant_id}", response_model=List[Order])
async def get_orders_by_restaurant(restaurant_id: str, current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find(
        {"restaurant_id": restaurant_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for o in orders:
        if isinstance(o['created_at'], str):
            o['created_at'] = datetime.fromisoformat(o['created_at'])
        if isinstance(o['updated_at'], str):
            o['updated_at'] = datetime.fromisoformat(o['updated_at'])
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order['updated_at'], str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: OrderStatusUpdate, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status_update.status, "updated_at": now}}
    )
    
    # Emit real-time event
    await sio.emit('order_status_updated', {
        "order_id": order_id,
        "status": status_update.status,
        "updated_at": now
    }, room=f"restaurant_{order['restaurant_id']}")
    
    return {"message": "Estado atualizado", "status": status_update.status}

# ============= PAYMENT ROUTES =============

@api_router.post("/payments/create-checkout")
async def create_checkout_session(request: Request):
    body = await request.json()
    order_id = body.get('order_id')
    origin_url = body.get('origin_url')
    
    if not order_id or not origin_url:
        raise HTTPException(status_code=400, detail="order_id e origin_url são obrigatórios")
    
    # Get order
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    # Create Stripe checkout session
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment-cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=order['total'],
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order_id,
            "restaurant_id": order['restaurant_id']
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        order_id=order_id,
        session_id=session.session_id,
        amount=order['total'],
        currency="eur",
        payment_status="pending",
        metadata=checkout_request.metadata
    )
    
    doc = transaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.payment_transactions.insert_one(doc)
    
    # Update order with session_id
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/checkout-status/{session_id}")
async def get_checkout_status(session_id: str):
    # Check if already processed
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    # If already paid, return immediately
    if transaction['payment_status'] == 'paid':
        return {"status": "complete", "payment_status": "paid"}
    
    # Check with Stripe
    webhook_url = "https://menuqr-12.preview.emergentagent.com/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status
        if checkout_status.payment_status == 'paid' and transaction['payment_status'] != 'paid':
            now = datetime.now(timezone.utc).isoformat()
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "updated_at": now}}
            )
            
            # Update order payment status
            await db.orders.update_one(
                {"id": transaction['order_id']},
                {"$set": {"payment_status": "paid", "updated_at": now}}
            )
            
            # Emit real-time event
            order = await db.orders.find_one({"id": transaction['order_id']}, {"_id": 0})
            if order:
                await sio.emit('payment_completed', {
                    "order_id": transaction['order_id'],
                    "payment_status": "paid"
                }, room=f"restaurant_{order['restaurant_id']}")
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency
        }
    except Exception as e:
        logger.error(f"Error checking payment status: {e}")
        raise HTTPException(status_code=500, detail="Erro ao verificar estado do pagamento")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_url = "https://menuqr-12.preview.emergentagent.com/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == 'paid':
            # Update transaction and order
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id}, {"_id": 0})
            if transaction and transaction['payment_status'] != 'paid':
                now = datetime.now(timezone.utc).isoformat()
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "paid", "updated_at": now}}
                )
                
                await db.orders.update_one(
                    {"id": transaction['order_id']},
                    {"$set": {"payment_status": "paid", "updated_at": now}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============= CALL WAITER ROUTES =============

@api_router.post("/call-waiter")
async def call_waiter(call: CallWaiterCreate):
    cw = CallWaiter(**call.model_dump())
    doc = cw.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.call_waiter.insert_one(doc)
    
    # Emit real-time event
    await sio.emit('waiter_called', doc, room=f"restaurant_{call.restaurant_id}")
    
    return {"message": "Empregado chamado com sucesso"}

@api_router.get("/call-waiter/restaurant/{restaurant_id}")
async def get_waiter_calls(restaurant_id: str, current_user: dict = Depends(get_current_user)):
    calls = await db.call_waiter.find(
        {"restaurant_id": restaurant_id, "status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for c in calls:
        if isinstance(c['created_at'], str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return calls

@api_router.put("/call-waiter/{call_id}/resolve")
async def resolve_waiter_call(call_id: str, current_user: dict = Depends(get_current_user)):
    await db.call_waiter.update_one({"id": call_id}, {"$set": {"status": "resolved"}})
    return {"message": "Chamada resolvida"}

# ============= STATISTICS ROUTES =============

@api_router.get("/stats/restaurant/{restaurant_id}")
async def get_restaurant_stats(restaurant_id: str, current_user: dict = Depends(get_current_user)):
    # Total orders today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_orders_today = await db.orders.count_documents({
        "restaurant_id": restaurant_id,
        "created_at": {"$gte": today_start.isoformat()}
    })
    
    # Total revenue today (only delivered orders)
    pipeline = [
        {"$match": {
            "restaurant_id": restaurant_id,
            "created_at": {"$gte": today_start.isoformat()},
            "payment_status": "paid",
            "status": "delivered"
        }},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    revenue_today = revenue_result[0]['total'] if revenue_result else 0
    
    # Active orders
    active_orders = await db.orders.count_documents({
        "restaurant_id": restaurant_id,
        "status": {"$in": ["received", "preparing", "ready"]}
    })
    
    # Top products
    product_pipeline = [
        {"$match": {"restaurant_id": restaurant_id}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_name",
            "count": {"$sum": "$items.quantity"}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_products = await db.orders.aggregate(product_pipeline).to_list(5)
    
    return {
        "total_orders_today": total_orders_today,
        "revenue_today": revenue_today,
        "active_orders": active_orders,
        "top_products": top_products
    }

# ============= INCLUDE ROUTER =============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
