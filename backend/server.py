from fastapi import FastAPI, APIRouter, HTTPException, Header, Request, Depends, BackgroundTasks, UploadFile, File
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
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
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from io import BytesIO
from PIL import Image
import socketio
import jwt
from passlib.context import CryptContext
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import shutil

# Try to import emergentintegrations (only available on Emergent platform)
try:
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False
    # Mock classes for local development
    class CheckoutSessionRequest(BaseModel):
        line_items: List[Dict[str, Any]]
        success_url: str
        cancel_url: str
    class CheckoutSessionResponse(BaseModel):
        session_id: str
        url: str
    class CheckoutStatusResponse(BaseModel):
        status: str
        payment_status: str

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

# Gmail SMTP Configuration
GMAIL_EMAIL = os.environ.get('GMAIL_EMAIL', 'zentraqr@gmail.com')
GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD', '')

# Create the main app
fastapi_app = FastAPI()
api_router = APIRouter(prefix="/api")

# Socket.IO setup for real-time updates
sio = socketio.AsyncServer(
    async_mode='asgi', 
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Wrap the FastAPI app with Socket.IO using custom path
socket_app = socketio.ASGIApp(sio, fastapi_app, socketio_path='/api/socket.io')

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

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class Restaurant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: str = "#FF5500"
    secondary_color: str = "#10B981"
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RestaurantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: str = "#FF5500"
    secondary_color: str = "#10B981"

class Table(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    table_number: str
    capacity: int
    active: bool = True
    # Floor plan fields
    zone_id: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: float = 60
    height: float = 60
    shape: str = "square"  # square, round, rectangle
    rotation: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TableCreate(BaseModel):
    restaurant_id: str
    table_number: str
    capacity: int
    zone_id: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: float = 60
    height: float = 60
    shape: str = "square"
    rotation: float = 0

class TablePositionUpdate(BaseModel):
    position_x: float
    position_y: float
    width: Optional[float] = None
    height: Optional[float] = None
    rotation: Optional[float] = None
    zone_id: Optional[str] = None

# ============= FLOOR PLAN MODELS =============

class FloorZone(BaseModel):
    """Represents a zone/area in the restaurant (e.g., Floor 1, Terrace, etc.)"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    name: str
    display_order: int = 0
    canvas_width: int = 1200
    canvas_height: int = 800
    background_color: str = "#F8FAFC"
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FloorZoneCreate(BaseModel):
    restaurant_id: str
    name: str
    display_order: int = 0
    canvas_width: int = 1200
    canvas_height: int = 800
    background_color: str = "#F8FAFC"

class FloorWall(BaseModel):
    """Represents a wall or divider on the floor plan"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    zone_id: str
    restaurant_id: str
    wall_type: str = "wall"  # wall, divider, window, door
    # Start and end points for line-based walls
    start_x: float
    start_y: float
    end_x: float
    end_y: float
    thickness: float = 8
    color: str = "#1E2A4A"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FloorWallCreate(BaseModel):
    zone_id: str
    restaurant_id: str
    wall_type: str = "wall"
    start_x: float
    start_y: float
    end_x: float
    end_y: float
    thickness: float = 8
    color: str = "#1E2A4A"

class FloorElement(BaseModel):
    """Represents decorative elements like plants, counters, etc."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    zone_id: str
    restaurant_id: str
    element_type: str  # counter, plant, stairs, bar, kitchen, wc
    position_x: float
    position_y: float
    width: float
    height: float
    rotation: float = 0
    color: str = "#94A3B8"
    label: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FloorElementCreate(BaseModel):
    zone_id: str
    restaurant_id: str
    element_type: str
    position_x: float
    position_y: float
    width: float
    height: float
    rotation: float = 0
    color: str = "#94A3B8"
    label: Optional[str] = None

class FloorRoom(BaseModel):
    """Represents a pre-made room shape on the floor plan"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    zone_id: str
    restaurant_id: str
    shape: str  # square, rectangle, round
    position_x: float
    position_y: float
    width: float
    height: float
    label: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FloorRoomCreate(BaseModel):
    zone_id: str
    restaurant_id: str
    shape: str
    position_x: float
    position_y: float
    width: float
    height: float
    label: Optional[str] = None

class FloorRoomUpdate(BaseModel):
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    label: Optional[str] = None

# QR Code Settings Models
class QRSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    title: str = "SCAN FOR"
    subtitle: str = "MENU & ORDER"
    cta_text: str = "Aponte a câmara do telemóvel para o código"
    table_prefix: str = "TABLE"
    show_logo: bool = True
    logo_position: str = "top"  # top, center, none
    layout_style: str = "layout1"  # layout1, layout2, layout3
    background_color: str = "#f8f7f4"
    text_color: str = "#1a2342"
    qr_color: str = "#1a2342"
    card_style: str = "rounded"  # rounded, sharp, minimal
    show_instructions: bool = True
    custom_logo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QRSettingsCreate(BaseModel):
    restaurant_id: str
    title: str = "SCAN FOR"
    subtitle: str = "MENU & ORDER"
    cta_text: str = "Aponte a câmara do telemóvel para o código"
    table_prefix: str = "TABLE"
    show_logo: bool = True
    logo_position: str = "top"
    layout_style: str = "layout1"
    background_color: str = "#f8f7f4"
    text_color: str = "#1a2342"
    qr_color: str = "#1a2342"
    card_style: str = "rounded"
    show_instructions: bool = True
    custom_logo_url: Optional[str] = None

class QRSettingsUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    cta_text: Optional[str] = None
    table_prefix: Optional[str] = None
    show_logo: Optional[bool] = None
    logo_position: Optional[str] = None
    layout_style: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    qr_color: Optional[str] = None
    card_style: Optional[str] = None
    show_instructions: Optional[bool] = None
    custom_logo_url: Optional[str] = None

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
    payment_method: Optional[str] = None  # online, counter
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

# Contact Form Models
class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    status: str = "new"  # new, contacted, converted, closed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    message: str

class ContactStatusUpdate(BaseModel):
    status: str

class ContactReply(BaseModel):
    subject: str
    message: str

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contact_id: str
    direction: str  # "sent" or "received"
    subject: Optional[str] = None
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============= SUBSCRIPTION MODELS =============

# Subscription Plans - Fixed prices (NEVER accept from frontend)
SUBSCRIPTION_PLANS = {
    "starter": {
        "name": "Starter",
        "monthly_price": 29.00,
        "annual_price": 276.00,  # 23€/month * 12
        "tables_limit": 10,
        "features": ["menu_unlimited", "dashboard_basic", "email_support"]
    },
    "pro": {
        "name": "Pro",
        "monthly_price": 59.00,
        "annual_price": 564.00,  # 47€/month * 12
        "tables_limit": 30,
        "features": ["menu_unlimited", "dashboard_advanced", "online_payments", "realtime_notifications", "priority_support"]
    },
    "enterprise": {
        "name": "Enterprise",
        "monthly_price": None,  # Custom pricing
        "annual_price": None,
        "tables_limit": None,  # Unlimited
        "features": ["all"]
    }
}

class SubscriptionCreate(BaseModel):
    """Registration + Subscription request"""
    # User info
    email: EmailStr
    password: str
    name: str
    # Restaurant info
    restaurant_name: str
    restaurant_phone: Optional[str] = None
    tables_count: int = 5
    # Plan info
    plan_id: str  # starter, pro, enterprise
    billing_cycle: str = "monthly"  # monthly, annual

class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    restaurant_id: str
    plan_id: str
    billing_cycle: str
    status: str = "trialing"  # trialing, active, cancelled, expired
    trial_ends_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=14))
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    stripe_session_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subscription_id: str
    user_id: str
    session_id: str
    amount: float
    currency: str = "eur"
    payment_status: str = "pending"  # pending, paid, failed, expired
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    """Request to create checkout session"""
    origin_url: str  # Frontend origin for success/cancel URLs

# ============= EMAIL HELPER =============

def send_email_gmail(to_email: str, subject: str, body_html: str, reply_to: str = None):
    """Send email using Gmail SMTP"""
    if not GMAIL_APP_PASSWORD:
        logger.warning("Gmail App Password not configured. Email not sent.")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"ZentraQR <{GMAIL_EMAIL}>"
        msg['To'] = to_email
        if reply_to:
            msg['Reply-To'] = reply_to
        
        # Create HTML part
        html_part = MIMEText(body_html, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Connect to Gmail SMTP
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_EMAIL, to_email, msg.as_string())
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

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

# Helper function to send welcome email
async def send_welcome_email(user_email: str, user_name: str):
    """Send welcome email to new user and save to database"""
    email_id = str(uuid.uuid4())
    subject = "Bem-vindo à ZentraQR 🎉"
    email_type = "welcome"
    status = "pending"
    
    # HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #1E2A4A 0%, #3B5998 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #1E2A4A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Bem-vindo à ZentraQR!</h1>
            </div>
            <div class="content">
                <p>Olá <strong>{user_name}</strong>,</p>
                
                <p>É com grande prazer que lhe damos as boas-vindas à ZentraQR! 🚀</p>
                
                <p>A sua conta foi criada com sucesso. Agora pode começar a digitalizar o seu restaurante com o nosso sistema de menu QR Code.</p>
                
                <p><strong>Próximos passos:</strong></p>
                <ol>
                    <li>Aceda à sua conta clicando no botão abaixo</li>
                    <li>Complete o seu perfil no onboarding</li>
                    <li>Configure o seu menu e categorias</li>
                    <li>Gere os seus QR Codes</li>
                </ol>
                
                <p style="text-align: center;">
                    <a href="{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/login" class="button">
                        Aceder à Minha Conta →
                    </a>
                </p>
                
                <p><strong>Os seus dados de acesso:</strong></p>
                <ul>
                    <li>Email: {user_email}</li>
                    <li>Link direto: <a href="{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/login">{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/login</a></li>
                </ul>
                
                <p>Se tiver alguma questão, não hesite em contactar-nos respondendo a este email.</p>
                
                <p>Obrigado por escolher a ZentraQR!</p>
                
                <p><strong>Equipa ZentraQR</strong></p>
            </div>
            <div class="footer">
                <p>© 2024 ZentraQR. Todos os direitos reservados.</p>
                <p>Este é um email automático, por favor não responda.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        gmail_email = os.environ.get('GMAIL_EMAIL')
        gmail_password = os.environ.get('GMAIL_APP_PASSWORD')
        
        if not gmail_email or not gmail_password:
            print("⚠️ Gmail credentials not configured")
            status = "failed"
            error_message = "Gmail credentials not configured"
        else:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"ZentraQR <{gmail_email}>"
            msg['To'] = user_email
            msg['Subject'] = subject
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.starttls()
                server.login(gmail_email, gmail_password)
                server.send_message(msg)
            
            status = "sent"
            error_message = None
            print(f"✅ Welcome email sent to {user_email}")
        
    except Exception as e:
        status = "failed"
        error_message = str(e)
        print(f"❌ Error sending welcome email: {e}")
    
    # Save email to database
    email_doc = {
        "id": email_id,
        "recipient": user_email,
        "recipient_name": user_name,
        "subject": subject,
        "content_html": html_body,
        "email_type": email_type,
        "status": status,
        "error_message": error_message,
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        await db.emails.insert_one(email_doc)
        print(f"📧 Email record saved to database: {email_id}")
    except Exception as e:
        print(f"❌ Error saving email to database: {e}")
    
    return status == "sent"

@api_router.post("/auth/signup")
async def signup(background_tasks: BackgroundTasks, signup_data: dict):
    """
    Simple signup endpoint for landing page conversion
    Creates user account without payment/subscription
    """
    # Validate required fields
    required_fields = ['name', 'email', 'password', 'restaurantName', 'tablesCount']
    for field in required_fields:
        if field not in signup_data:
            raise HTTPException(status_code=400, detail=f"Campo '{field}' é obrigatório")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": signup_data['email']})
    if existing_user:
        raise HTTPException(status_code=400, detail="Este email já está registado")
    
    # Create restaurant
    restaurant_id = str(uuid.uuid4())
    restaurant_doc = {
        "id": restaurant_id,
        "name": signup_data['restaurantName'],
        "email": signup_data['email'],
        "phone": "",
        "address": "",
        "description": "",
        "logo_url": "",
        "primary_color": "#1E2A4A",
        "secondary_color": "#10B981",
        "active": True,
        "subscription_plan": "trial",  # Start with trial
        "subscription_status": "trial",
        "trial_ends_at": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.restaurants.insert_one(restaurant_doc)
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": signup_data['email'],
        "name": signup_data['name'],
        "password": hash_password(signup_data['password']),
        "role": "admin",  # First user is admin of their restaurant
        "restaurant_id": restaurant_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create tables
    tables_count = int(signup_data.get('tablesCount', 5))
    for i in range(1, tables_count + 1):
        table_id = str(uuid.uuid4())
        table_doc = {
            "id": table_id,
            "restaurant_id": restaurant_id,
            "table_number": str(i),
            "capacity": 4,
            "status": "available",
            "qr_code_url": f"/api/qr-code/{table_id}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.tables.insert_one(table_doc)
    
    # Send welcome email in background
    background_tasks.add_task(
        send_welcome_email,
        signup_data['email'],
        signup_data['name']
    )
    
    # Create JWT token
    token = create_access_token({
        "sub": user_id,
        "email": signup_data['email'],
        "role": "admin"
    })
    
    return {
        "message": "Conta criada com sucesso!",
        "token": token,
        "user": {
            "id": user_id,
            "email": signup_data['email'],
            "name": signup_data['name'],
            "role": "admin",
            "restaurant_id": restaurant_id
        },
        "restaurant": {
            "id": restaurant_id,
            "name": signup_data['restaurantName']
        }
    }

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

@api_router.delete("/tables/{table_id}")
async def delete_table(table_id: str, current_user: dict = Depends(get_current_user)):
    table = await db.tables.find_one({"id": table_id})
    if not table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")
    
    await db.tables.update_one({"id": table_id}, {"$set": {"active": False}})
    return {"message": "Mesa removida"}

@api_router.get("/tables/{table_id}")
async def get_table(table_id: str):
    """Get a specific table by ID"""
    table = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")
    
    if isinstance(table.get('created_at'), str):
        table['created_at'] = datetime.fromisoformat(table['created_at'])
    return table

@api_router.get("/tables/{table_id}/qrcode")
async def get_table_qrcode(table_id: str):
    table = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")
    
    # Generate QR code URL
    frontend_url = os.environ.get('FRONTEND_URL', 'https://order-lifecycle-12.preview.emergentagent.com')
    qr_data = f"{frontend_url}/menu?restaurant_id={table['restaurant_id']}&table_id={table['id']}"
    
    # Generate styled QR code with logo
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction for logo
        box_size=10,
        border=2
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    # Create QR with dark blue color
    qr_color = "#1a2342"
    img = qr.make_image(fill_color=qr_color, back_color="white").convert('RGBA')
    
    # Try to add QR icon in center (using the Z icon, not the full logo)
    try:
        # Use qr-icon.png (just the Z symbol) instead of logo.png (full logo with text)
        logo_path = Path(__file__).parent.parent / "frontend" / "public" / "qr-icon.png"
        if logo_path.exists():
            logo = Image.open(logo_path).convert('RGBA')
            
            # Calculate logo size (about 22% of QR code for better fit)
            qr_width, qr_height = img.size
            logo_max_size = int(qr_width * 0.22)
            
            # Resize logo maintaining aspect ratio
            logo.thumbnail((logo_max_size, logo_max_size), Image.Resampling.LANCZOS)
            
            # Create white circle background for logo
            logo_bg_size = int(logo_max_size * 1.15)
            logo_bg = Image.new('RGBA', (logo_bg_size, logo_bg_size), (255, 255, 255, 255))
            
            # Center logo on white background
            logo_x = (logo_bg_size - logo.size[0]) // 2
            logo_y = (logo_bg_size - logo.size[1]) // 2
            logo_bg.paste(logo, (logo_x, logo_y), logo)
            
            # Calculate position to center logo on QR code
            pos_x = (qr_width - logo_bg_size) // 2
            pos_y = (qr_height - logo_bg_size) // 2
            
            # Paste logo onto QR code
            img.paste(logo_bg, (pos_x, pos_y), logo_bg)
    except Exception as e:
        logging.warning(f"Could not add logo to QR code: {e}")
    
    # Convert to RGB for PNG
    img_rgb = Image.new('RGB', img.size, (255, 255, 255))
    img_rgb.paste(img, mask=img.split()[3] if len(img.split()) == 4 else None)
    
    buf = BytesIO()
    img_rgb.save(buf, format='PNG')
    buf.seek(0)
    
    return StreamingResponse(buf, media_type="image/png")

@api_router.get("/tables/{table_id}/qrcode-data")
async def get_table_qrcode_data(table_id: str):
    """Get QR code URL without generating image"""
    table = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")
    
    frontend_url = os.environ.get('FRONTEND_URL', 'https://order-lifecycle-12.preview.emergentagent.com')
    qr_url = f"{frontend_url}/menu?restaurant_id={table['restaurant_id']}&table_id={table['id']}"
    
    return {
        "table_id": table_id,
        "table_number": table.get('table_number'),
        "qr_url": qr_url
    }

# ============= QR SETTINGS ROUTES =============

@api_router.get("/qr-settings/{restaurant_id}")
async def get_qr_settings(restaurant_id: str, current_user: dict = Depends(get_current_user)):
    """Get QR code settings for a restaurant"""
    settings = await db.qr_settings.find_one({"restaurant_id": restaurant_id}, {"_id": 0})
    if not settings:
        # Return default settings
        return {
            "restaurant_id": restaurant_id,
            "title": "SCAN FOR",
            "subtitle": "MENU & ORDER",
            "cta_text": "Aponte a câmara do telemóvel para o código",
            "table_prefix": "TABLE",
            "show_logo": True,
            "logo_position": "top",
            "layout_style": "layout1",
            "background_color": "#f8f7f4",
            "text_color": "#1a2342",
            "qr_color": "#1a2342",
            "card_style": "rounded",
            "show_instructions": True,
            "custom_logo_url": None
        }
    return settings

@api_router.post("/qr-settings")
async def create_qr_settings(settings: QRSettingsCreate, current_user: dict = Depends(get_current_user)):
    """Create QR code settings for a restaurant"""
    # Check if settings already exist
    existing = await db.qr_settings.find_one({"restaurant_id": settings.restaurant_id})
    if existing:
        raise HTTPException(status_code=400, detail="Configurações já existem para este restaurante")
    
    settings_dict = settings.model_dump()
    settings_dict["id"] = str(uuid.uuid4())
    settings_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.qr_settings.insert_one(settings_dict)
    
    result = await db.qr_settings.find_one({"id": settings_dict["id"]}, {"_id": 0})
    return result

@api_router.put("/qr-settings/{restaurant_id}")
async def update_qr_settings(restaurant_id: str, settings: QRSettingsUpdate, current_user: dict = Depends(get_current_user)):
    """Update QR code settings for a restaurant"""
    existing = await db.qr_settings.find_one({"restaurant_id": restaurant_id})
    
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if existing:
        await db.qr_settings.update_one({"restaurant_id": restaurant_id}, {"$set": update_data})
    else:
        # Create new settings with updates
        new_settings = QRSettingsCreate(restaurant_id=restaurant_id, **update_data).model_dump()
        new_settings["id"] = str(uuid.uuid4())
        new_settings["created_at"] = datetime.now(timezone.utc).isoformat()
        new_settings["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.qr_settings.insert_one(new_settings)
    
    result = await db.qr_settings.find_one({"restaurant_id": restaurant_id}, {"_id": 0})
    return result

@api_router.post("/qr-settings/upload-logo")
async def upload_qr_logo(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload a custom logo for QR codes"""
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="O arquivo deve ser uma imagem")
    
    # Create uploads directory if not exists
    upload_dir = Path(__file__).parent / "uploads" / "qr-logos"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'png'
    filename = f"{current_user['restaurant_id']}_{uuid.uuid4()}.{file_ext}"
    file_path = upload_dir / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Return URL
    logo_url = f"/api/uploads/qr-logos/{filename}"
    return {"logo_url": logo_url}

@api_router.get("/uploads/qr-logos/{filename}")
async def get_qr_logo(filename: str):
    """Serve uploaded QR logo files"""
    file_path = Path(__file__).parent / "uploads" / "qr-logos" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Logo não encontrado")
    return FileResponse(file_path)

@api_router.put("/tables/{table_id}/position")
async def update_table_position(table_id: str, position: TablePositionUpdate, current_user: dict = Depends(get_current_user)):
    """Update table position on floor plan"""
    table = await db.tables.find_one({"id": table_id})
    if not table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")
    
    update_data = {
        "position_x": position.position_x,
        "position_y": position.position_y
    }
    if position.width is not None:
        update_data["width"] = position.width
    if position.height is not None:
        update_data["height"] = position.height
    if position.rotation is not None:
        update_data["rotation"] = position.rotation
    if position.zone_id is not None:
        update_data["zone_id"] = position.zone_id
    
    await db.tables.update_one({"id": table_id}, {"$set": update_data})
    
    updated = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.put("/tables/{table_id}")
async def update_table(table_id: str, table_data: dict, current_user: dict = Depends(get_current_user)):
    """Update table details"""
    table = await db.tables.find_one({"id": table_id})
    if not table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")
    
    # Filter allowed fields
    allowed_fields = ['table_number', 'capacity', 'active', 'zone_id', 'position_x', 'position_y', 
                      'width', 'height', 'shape', 'rotation']
    update_data = {k: v for k, v in table_data.items() if k in allowed_fields}
    
    await db.tables.update_one({"id": table_id}, {"$set": update_data})
    
    updated = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

# ============= FLOOR PLAN ROUTES =============

# --- Zone Routes ---
@api_router.post("/floor-zones")
async def create_floor_zone(zone: FloorZoneCreate, current_user: dict = Depends(get_current_user)):
    """Create a new zone/area (e.g., Floor 1, Terrace)"""
    z = FloorZone(**zone.model_dump())
    doc = z.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.floor_zones.insert_one(doc)
    return {"id": z.id, "name": z.name, "message": "Zona criada com sucesso"}

@api_router.get("/floor-zones/restaurant/{restaurant_id}")
async def get_floor_zones(restaurant_id: str):
    """Get all zones for a restaurant"""
    zones = await db.floor_zones.find(
        {"restaurant_id": restaurant_id, "active": True}, 
        {"_id": 0}
    ).sort("display_order", 1).to_list(100)
    
    for z in zones:
        if isinstance(z.get('created_at'), str):
            z['created_at'] = datetime.fromisoformat(z['created_at'])
    
    return zones

@api_router.put("/floor-zones/{zone_id}")
async def update_floor_zone(zone_id: str, zone_data: dict, current_user: dict = Depends(get_current_user)):
    """Update zone details"""
    zone = await db.floor_zones.find_one({"id": zone_id})
    if not zone:
        raise HTTPException(status_code=404, detail="Zona não encontrada")
    
    allowed_fields = ['name', 'display_order', 'canvas_width', 'canvas_height', 'background_color', 'active']
    update_data = {k: v for k, v in zone_data.items() if k in allowed_fields}
    
    await db.floor_zones.update_one({"id": zone_id}, {"$set": update_data})
    return {"message": "Zona atualizada"}

@api_router.delete("/floor-zones/{zone_id}")
async def delete_floor_zone(zone_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a zone"""
    await db.floor_zones.update_one({"id": zone_id}, {"$set": {"active": False}})
    # Also remove zone reference from tables
    await db.tables.update_many({"zone_id": zone_id}, {"$set": {"zone_id": None}})
    return {"message": "Zona removida"}

# --- Wall Routes ---
@api_router.post("/floor-walls")
async def create_floor_wall(wall: FloorWallCreate, current_user: dict = Depends(get_current_user)):
    """Create a wall/divider"""
    w = FloorWall(**wall.model_dump())
    doc = w.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.floor_walls.insert_one(doc)
    return {"id": w.id, "message": "Parede criada"}

@api_router.get("/floor-walls/zone/{zone_id}")
async def get_floor_walls(zone_id: str):
    """Get all walls for a zone"""
    walls = await db.floor_walls.find({"zone_id": zone_id}, {"_id": 0}).to_list(500)
    return walls

@api_router.put("/floor-walls/{wall_id}")
async def update_floor_wall(wall_id: str, wall_data: dict, current_user: dict = Depends(get_current_user)):
    """Update wall"""
    allowed_fields = ['start_x', 'start_y', 'end_x', 'end_y', 'thickness', 'color', 'wall_type']
    update_data = {k: v for k, v in wall_data.items() if k in allowed_fields}
    
    await db.floor_walls.update_one({"id": wall_id}, {"$set": update_data})
    return {"message": "Parede atualizada"}

@api_router.delete("/floor-walls/{wall_id}")
async def delete_floor_wall(wall_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a wall"""
    await db.floor_walls.delete_one({"id": wall_id})
    return {"message": "Parede removida"}

# --- Element Routes ---
@api_router.post("/floor-elements")
async def create_floor_element(element: FloorElementCreate, current_user: dict = Depends(get_current_user)):
    """Create a floor element (counter, plant, etc.)"""
    e = FloorElement(**element.model_dump())
    doc = e.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.floor_elements.insert_one(doc)
    return {"id": e.id, "message": "Elemento criado"}

@api_router.get("/floor-elements/zone/{zone_id}")
async def get_floor_elements(zone_id: str):
    """Get all elements for a zone"""
    elements = await db.floor_elements.find({"zone_id": zone_id}, {"_id": 0}).to_list(500)
    return elements

@api_router.put("/floor-elements/{element_id}")
async def update_floor_element(element_id: str, element_data: dict, current_user: dict = Depends(get_current_user)):
    """Update element"""
    allowed_fields = ['position_x', 'position_y', 'width', 'height', 'rotation', 'color', 'label', 'element_type']
    update_data = {k: v for k, v in element_data.items() if k in allowed_fields}
    
    await db.floor_elements.update_one({"id": element_id}, {"$set": update_data})
    return {"message": "Elemento atualizado"}

@api_router.delete("/floor-elements/{element_id}")
async def delete_floor_element(element_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an element"""
    await db.floor_elements.delete_one({"id": element_id})
    return {"message": "Elemento removido"}

# --- Room Routes (Pre-made shapes) ---
@api_router.post("/floor-rooms")
async def create_floor_room(room: FloorRoomCreate, current_user: dict = Depends(get_current_user)):
    """Create a pre-made room shape"""
    r = FloorRoom(**room.model_dump())
    doc = r.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.floor_rooms.insert_one(doc)
    return {"id": r.id, "message": "Planta criada"}

@api_router.get("/floor-rooms/zone/{zone_id}")
async def get_floor_rooms(zone_id: str):
    """Get all rooms for a zone"""
    rooms = await db.floor_rooms.find({"zone_id": zone_id}, {"_id": 0}).to_list(500)
    return rooms

@api_router.put("/floor-rooms/{room_id}")
async def update_floor_room(room_id: str, room_data: FloorRoomUpdate, current_user: dict = Depends(get_current_user)):
    """Update room"""
    update_data = {k: v for k, v in room_data.model_dump().items() if v is not None}
    
    await db.floor_rooms.update_one({"id": room_id}, {"$set": update_data})
    return {"message": "Planta atualizada"}

@api_router.delete("/floor-rooms/{room_id}")
async def delete_floor_room(room_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a room"""
    await db.floor_rooms.delete_one({"id": room_id})
    return {"message": "Planta removida"}

# --- Full Floor Plan Route ---
@api_router.get("/floor-plan/zone/{zone_id}")
async def get_full_floor_plan(zone_id: str):
    """Get complete floor plan data for a zone including tables, walls, elements and rooms"""
    zone = await db.floor_zones.find_one({"id": zone_id}, {"_id": 0})
    if not zone:
        raise HTTPException(status_code=404, detail="Zona não encontrada")
    
    tables = await db.tables.find({"zone_id": zone_id, "active": True}, {"_id": 0}).to_list(500)
    walls = await db.floor_walls.find({"zone_id": zone_id}, {"_id": 0}).to_list(500)
    elements = await db.floor_elements.find({"zone_id": zone_id}, {"_id": 0}).to_list(500)
    rooms = await db.floor_rooms.find({"zone_id": zone_id}, {"_id": 0}).to_list(500)
    
    return {
        "zone": zone,
        "tables": tables,
        "walls": walls,
        "elements": elements,
        "rooms": rooms
    }

@api_router.get("/floor-plan/restaurant/{restaurant_id}/tables")
async def get_tables_for_floor_plan(restaurant_id: str):
    """Get all tables with their positions for floor plan editor"""
    tables = await db.tables.find(
        {"restaurant_id": restaurant_id, "active": True}, 
        {"_id": 0}
    ).to_list(500)
    
    return tables

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
    
    # Remove MongoDB _id before emitting (not JSON serializable)
    emit_doc = {k: v for k, v in doc.items() if k != '_id'}
    
    # Emit real-time event to restaurant
    await sio.emit('new_order', emit_doc, room=f"restaurant_{order.restaurant_id}")
    
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

@api_router.put("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel an active order - moves it to history with 'canceled' status"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    # Only allow canceling active orders
    if order['status'] in ['delivered', 'canceled']:
        raise HTTPException(status_code=400, detail="Este pedido já foi finalizado ou cancelado")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "canceled", "updated_at": now}}
    )
    
    # Emit real-time event
    await sio.emit('order_status_updated', {
        "order_id": order_id,
        "status": "canceled",
        "updated_at": now,
        "restaurant_id": order['restaurant_id']
    }, room=f"restaurant_{order['restaurant_id']}")
    
    return {"message": "Pedido cancelado com sucesso", "status": "canceled"}

@api_router.delete("/orders/cleanup-old")
async def cleanup_old_orders(current_user: dict = Depends(get_current_user)):
    """Delete orders older than 20 days that are delivered or canceled"""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=20)
    cutoff_str = cutoff_date.isoformat()
    
    # Delete orders that are delivered or canceled and older than 20 days
    result = await db.orders.delete_many({
        "status": {"$in": ["delivered", "canceled"]},
        "created_at": {"$lt": cutoff_str}
    })
    
    return {"message": f"{result.deleted_count} pedidos antigos removidos"}

@api_router.put("/orders/{order_id}/payment-method")
async def update_order_payment_method(order_id: str, request: dict):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    payment_method = request.get("payment_method")
    if payment_method not in ["online", "counter"]:
        raise HTTPException(status_code=400, detail="Método de pagamento inválido")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {
        "payment_method": payment_method,
        "updated_at": now
    }
    
    # If paying at counter, mark as pending but with counter method
    if payment_method == "counter":
        update_data["payment_status"] = "pending"
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    # Emit real-time event
    await sio.emit('order_payment_method_updated', {
        "order_id": order_id,
        "payment_method": payment_method,
        "updated_at": now
    }, room=f"restaurant_{order['restaurant_id']}")
    
    return {"message": "Método de pagamento atualizado", "payment_method": payment_method}

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
    
    # Check if Stripe is available (only on Emergent platform)
    if not EMERGENT_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Pagamentos online não disponíveis em ambiente local. Use 'Pagar no Balcão'."
        )
    
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
    if not EMERGENT_AVAILABLE:
        return {"status": "unknown", "payment_status": transaction.get('payment_status', 'pending')}
    
    webhook_url = "https://order-lifecycle-12.preview.emergentagent.com/api/webhook/stripe"
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
    if not EMERGENT_AVAILABLE:
        return {"status": "skipped", "message": "Stripe not available locally"}
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_url = "https://order-lifecycle-12.preview.emergentagent.com/api/webhook/stripe"
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
    
    # Remove MongoDB _id before emitting
    emit_doc = {k: v for k, v in doc.items() if k != '_id'}
    
    # Emit real-time event
    await sio.emit('waiter_called', emit_doc, room=f"restaurant_{call.restaurant_id}")
    
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

# ============= CONTACT ROUTES =============

@api_router.post("/contacts", response_model=Contact)
async def create_contact(contact: ContactCreate):
    """Create a new contact from the contact form"""
    c = Contact(**contact.model_dump())
    doc = c.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.contacts.insert_one(doc)
    
    # Send email notification (optional - can be implemented with email service)
    # For now, we just save to database
    logger.info(f"New contact received from {contact.email}: {contact.name}")
    
    return c

@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts():
    """Get all contacts for backoffice"""
    contacts = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for c in contacts:
        if isinstance(c['created_at'], str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return contacts

@api_router.get("/contacts/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str):
    """Get a specific contact"""
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contacto não encontrado")
    if isinstance(contact['created_at'], str):
        contact['created_at'] = datetime.fromisoformat(contact['created_at'])
    return contact

@api_router.put("/contacts/{contact_id}/status")
async def update_contact_status(contact_id: str, status_update: ContactStatusUpdate):
    """Update contact status"""
    contact = await db.contacts.find_one({"id": contact_id})
    if not contact:
        raise HTTPException(status_code=404, detail="Contacto não encontrado")
    
    valid_statuses = ["new", "contacted", "converted", "closed"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    await db.contacts.update_one(
        {"id": contact_id},
        {"$set": {"status": status_update.status}}
    )
    
    return {"message": "Status atualizado", "status": status_update.status}

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    """Delete a contact"""
    contact = await db.contacts.find_one({"id": contact_id})
    if not contact:
        raise HTTPException(status_code=404, detail="Contacto não encontrado")
    
    await db.contacts.delete_one({"id": contact_id})
    return {"message": "Contacto eliminado"}

@api_router.post("/contacts/{contact_id}/reply")
async def reply_to_contact(contact_id: str, reply: ContactReply, background_tasks: BackgroundTasks):
    """Send a reply email to a contact"""
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contacto não encontrado")
    
    # Create HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #1E40AF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }}
            .message {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1E40AF; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin:0;">ZentraQR</h1>
            </div>
            <div class="content">
                <p>Olá <strong>{contact['name']}</strong>,</p>
                <div class="message">
                    {reply.message.replace(chr(10), '<br>')}
                </div>
                <p>Atenciosamente,<br><strong>Equipa ZentraQR</strong></p>
            </div>
            <div class="footer">
                <p>Este email foi enviado em resposta ao seu contacto através do nosso website.</p>
                <p>© 2024 ZentraQR - Sistema de Menu Digital</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Send email
    email_sent = send_email_gmail(
        to_email=contact['email'],
        subject=reply.subject,
        body_html=html_body,
        reply_to=GMAIL_EMAIL
    )
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Erro ao enviar email. Verifique a configuração do Gmail.")
    
    # Save message to database
    msg = ContactMessage(
        contact_id=contact_id,
        direction="sent",
        subject=reply.subject,
        message=reply.message
    )
    msg_doc = msg.model_dump()
    msg_doc['created_at'] = msg_doc['created_at'].isoformat()
    await db.contact_messages.insert_one(msg_doc)
    
    # Update contact status to "contacted" if it was "new"
    if contact.get('status') == 'new':
        await db.contacts.update_one(
            {"id": contact_id},
            {"$set": {"status": "contacted"}}
        )
    
    return {"message": "Email enviado com sucesso", "email_sent": True}

@api_router.get("/contacts/{contact_id}/messages")
async def get_contact_messages(contact_id: str):
    """Get all messages for a contact"""
    messages = await db.contact_messages.find(
        {"contact_id": contact_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for m in messages:
        if isinstance(m['created_at'], str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    
    return messages

# ============= SUBSCRIPTION ENDPOINTS =============

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get all available subscription plans - includes custom prices from DB if set"""
    # Get custom prices from database if they exist
    custom_prices = await db.settings.find_one({"type": "pricing"}, {"_id": 0})
    
    plans = SUBSCRIPTION_PLANS.copy()
    
    if custom_prices:
        # Override with custom prices
        if "starter" in custom_prices:
            plans["starter"]["monthly_price"] = custom_prices["starter"].get("monthly_price", 29.00)
            plans["starter"]["annual_price"] = custom_prices["starter"].get("annual_price", 276.00)
        if "pro" in custom_prices:
            plans["pro"]["monthly_price"] = custom_prices["pro"].get("monthly_price", 59.00)
            plans["pro"]["annual_price"] = custom_prices["pro"].get("annual_price", 564.00)
    
    return {
        "plans": plans,
        "trial_days": 14
    }

@api_router.get("/backoffice/pricing")
async def get_pricing_settings():
    """Get current pricing settings for backoffice"""
    custom_prices = await db.settings.find_one({"type": "pricing"}, {"_id": 0})
    
    default_plans = {
        "starter": {
            "monthly_price": 29.00,
            "annual_price": 276.00,
            "features": [
                {"key": "tables", "value": "10", "label": "Até 10 mesas"},
                {"key": "menu", "value": "unlimited", "label": "Menu ilimitado"},
                {"key": "dashboard", "value": "basic", "label": "Dashboard básico"},
                {"key": "support", "value": "email", "label": "Suporte por email"}
            ]
        },
        "pro": {
            "monthly_price": 59.00,
            "annual_price": 564.00,
            "features": [
                {"key": "tables", "value": "30", "label": "Até 30 mesas"},
                {"key": "menu", "value": "unlimited", "label": "Menu ilimitado"},
                {"key": "dashboard", "value": "advanced", "label": "Dashboard avançado"},
                {"key": "payments", "value": "online", "label": "Pagamentos online"},
                {"key": "notifications", "value": "realtime", "label": "Notificações em tempo real"},
                {"key": "support", "value": "priority", "label": "Suporte prioritário"}
            ]
        },
        "enterprise": {
            "monthly_price": None,
            "annual_price": None,
            "features": [
                {"key": "tables", "value": "unlimited", "label": "Mesas ilimitadas"},
                {"key": "restaurants", "value": "multi", "label": "Multi-restaurantes"},
                {"key": "api", "value": "custom", "label": "API personalizada"},
                {"key": "integrations", "value": "full", "label": "Integrações"},
                {"key": "manager", "value": "dedicated", "label": "Gestor dedicado"},
                {"key": "sla", "value": "guaranteed", "label": "SLA garantido"}
            ]
        }
    }
    
    if not custom_prices:
        return default_plans
    
    # Merge custom prices with defaults
    result = {}
    for plan_key in ["starter", "pro", "enterprise"]:
        if plan_key in custom_prices:
            result[plan_key] = {
                "monthly_price": custom_prices[plan_key].get("monthly_price", default_plans[plan_key]["monthly_price"]),
                "annual_price": custom_prices[plan_key].get("annual_price", default_plans[plan_key]["annual_price"]),
                "features": custom_prices[plan_key].get("features", default_plans[plan_key]["features"])
            }
        else:
            result[plan_key] = default_plans[plan_key]
    
    return result

@api_router.put("/backoffice/pricing")
async def update_pricing_settings(pricing: dict):
    """Update pricing settings from backoffice"""
    # Validate pricing data
    if "starter" not in pricing or "pro" not in pricing:
        raise HTTPException(status_code=400, detail="Dados de preços inválidos")
    
    # Build update document
    update_doc = {
        "type": "pricing",
        "starter": {
            "monthly_price": float(pricing["starter"].get("monthly_price", 29.00)) if pricing["starter"].get("monthly_price") else None,
            "annual_price": float(pricing["starter"].get("annual_price", 276.00)) if pricing["starter"].get("annual_price") else None,
            "features": pricing["starter"].get("features", [])
        },
        "pro": {
            "monthly_price": float(pricing["pro"].get("monthly_price", 59.00)) if pricing["pro"].get("monthly_price") else None,
            "annual_price": float(pricing["pro"].get("annual_price", 564.00)) if pricing["pro"].get("annual_price") else None,
            "features": pricing["pro"].get("features", [])
        },
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Include enterprise if provided
    if "enterprise" in pricing:
        update_doc["enterprise"] = {
            "monthly_price": None,
            "annual_price": None,
            "features": pricing["enterprise"].get("features", [])
        }
    
    # Update or insert pricing settings
    await db.settings.update_one(
        {"type": "pricing"},
        {"$set": update_doc},
        upsert=True
    )
    
    return {"message": "Preços atualizados com sucesso"}

# ============= GLOBAL SETTINGS ROUTES (LAUNCHING SOON) =============

@api_router.get("/settings/global")
async def get_global_settings():
    """Get global platform settings (public endpoint)"""
    settings = await db.settings.find_one({"type": "global_settings"}, {"_id": 0})
    
    if not settings:
        # Return default settings if none exist
        return {
            "plans_sales_enabled": True,  # Default: sales enabled
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    return settings

@api_router.put("/backoffice/settings/global")
async def update_global_settings_backoffice(settings_data: dict):
    """Update global platform settings from backoffice (no auth required)"""
    # Validate settings data
    if "plans_sales_enabled" not in settings_data:
        raise HTTPException(status_code=400, detail="Campo 'plans_sales_enabled' é obrigatório")
    
    update_doc = {
        "type": "global_settings",
        "plans_sales_enabled": bool(settings_data["plans_sales_enabled"]),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update or insert global settings
    await db.settings.update_one(
        {"type": "global_settings"},
        {"$set": update_doc},
        upsert=True
    )
    
    status = "ativadas" if settings_data["plans_sales_enabled"] else "desativadas"
    return {
        "message": f"Vendas de planos {status} com sucesso",
        "plans_sales_enabled": settings_data["plans_sales_enabled"]
    }

@api_router.post("/subscription/register")
async def register_with_subscription(data: SubscriptionCreate):
    """
    Step 1: Register user, create restaurant, and store subscription intent
    Returns subscription_id for checkout
    """
    # Validate plan
    if data.plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Plano inválido")
    
    plan = SUBSCRIPTION_PLANS[data.plan_id]
    
    # Check if plan requires custom pricing (enterprise)
    if plan["monthly_price"] is None:
        raise HTTPException(status_code=400, detail="Este plano requer contacto comercial")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Este email já está registado")
    
    # Create restaurant
    restaurant_id = str(uuid.uuid4())
    restaurant = {
        "id": restaurant_id,
        "name": data.restaurant_name,
        "phone": data.restaurant_phone,
        "description": None,
        "address": None,
        "logo_url": None,
        "primary_color": "#1E2A4A",
        "secondary_color": "#FF6B35",
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.restaurants.insert_one(restaurant)
    
    # Create default tables based on tables_count
    tables_to_create = min(data.tables_count, plan["tables_limit"] or 100)
    for i in range(1, tables_to_create + 1):
        table = {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant_id,
            "table_number": str(i),
            "capacity": 4,
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.tables.insert_one(table)
    
    # Create user with hashed password
    user_id = str(uuid.uuid4())
    hashed_password = pwd_context.hash(data.password)
    user = {
        "id": user_id,
        "email": data.email,
        "password": hashed_password,
        "name": data.name,
        "role": "admin",
        "restaurant_id": restaurant_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    # Create subscription record
    subscription_id = str(uuid.uuid4())
    trial_ends_at = datetime.now(timezone.utc) + timedelta(days=14)
    subscription = {
        "id": subscription_id,
        "user_id": user_id,
        "restaurant_id": restaurant_id,
        "plan_id": data.plan_id,
        "billing_cycle": data.billing_cycle,
        "status": "pending",  # Will become "trialing" after checkout
        "trial_ends_at": trial_ends_at.isoformat(),
        "current_period_start": None,
        "current_period_end": None,
        "stripe_session_id": None,
        "stripe_subscription_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.subscriptions.insert_one(subscription)
    
    # Create sample categories for the restaurant
    categories_data = [
        {"name": "Entradas", "description": "Appetizers and starters", "display_order": 1},
        {"name": "Pratos Principais", "description": "Main courses", "display_order": 2},
        {"name": "Bebidas", "description": "Drinks", "display_order": 3},
        {"name": "Sobremesas", "description": "Desserts", "display_order": 4}
    ]
    for cat_data in categories_data:
        category = {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant_id,
            "name": cat_data["name"],
            "description": cat_data["description"],
            "image_url": None,
            "display_order": cat_data["display_order"],
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.categories.insert_one(category)
    
    return {
        "subscription_id": subscription_id,
        "user_id": user_id,
        "restaurant_id": restaurant_id,
        "plan": {
            "id": data.plan_id,
            "name": plan["name"],
            "price": plan["monthly_price"] if data.billing_cycle == "monthly" else plan["annual_price"],
            "billing_cycle": data.billing_cycle
        },
        "trial_days": 14,
        "message": "Registo criado. Prossiga para o pagamento."
    }

@api_router.post("/subscription/{subscription_id}/checkout")
async def create_subscription_checkout(subscription_id: str, checkout: CheckoutRequest, request: Request):
    """
    Step 2: Create Stripe Checkout Session for subscription
    """
    # Get subscription
    subscription = await db.subscriptions.find_one({"id": subscription_id}, {"_id": 0})
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscrição não encontrada")
    
    if subscription["status"] not in ["pending", "expired"]:
        raise HTTPException(status_code=400, detail="Esta subscrição já foi processada")
    
    # Get plan details
    plan = SUBSCRIPTION_PLANS.get(subscription["plan_id"])
    if not plan or plan["monthly_price"] is None:
        raise HTTPException(status_code=400, detail="Plano inválido")
    
    # Calculate price based on billing cycle
    if subscription["billing_cycle"] == "monthly":
        amount = plan["monthly_price"]
    else:
        amount = plan["annual_price"]
    
    # Build success/cancel URLs from frontend origin
    origin = checkout.origin_url.rstrip('/')
    success_url = f"{origin}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}&subscription_id={subscription_id}"
    cancel_url = f"{origin}/subscription/cancel?subscription_id={subscription_id}"
    
    # Create Stripe checkout session
    if EMERGENT_AVAILABLE:
        try:
            host_url = str(request.base_url).rstrip('/')
            webhook_url = f"{host_url}/api/webhook/stripe"
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
            
            checkout_request = CheckoutSessionRequest(
                amount=float(amount),
                currency="eur",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "subscription_id": subscription_id,
                    "user_id": subscription["user_id"],
                    "plan_id": subscription["plan_id"],
                    "billing_cycle": subscription["billing_cycle"],
                    "type": "subscription"
                }
            )
            
            session = await stripe_checkout.create_checkout_session(checkout_request)
            
            # Create transaction record
            transaction = {
                "id": str(uuid.uuid4()),
                "subscription_id": subscription_id,
                "user_id": subscription["user_id"],
                "session_id": session.session_id,
                "amount": float(amount),
                "currency": "eur",
                "payment_status": "pending",
                "metadata": {
                    "plan_id": subscription["plan_id"],
                    "billing_cycle": subscription["billing_cycle"]
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.subscription_transactions.insert_one(transaction)
            
            # Update subscription with session_id
            await db.subscriptions.update_one(
                {"id": subscription_id},
                {"$set": {
                    "stripe_session_id": session.session_id,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            return {
                "checkout_url": session.url,
                "session_id": session.session_id
            }
            
        except Exception as e:
            logger.error(f"Stripe checkout error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro ao criar sessão de pagamento: {str(e)}")
    else:
        # Mock for local development
        mock_session_id = f"cs_test_{uuid.uuid4().hex[:24]}"
        return {
            "checkout_url": f"{success_url.replace('{CHECKOUT_SESSION_ID}', mock_session_id)}",
            "session_id": mock_session_id,
            "mock": True
        }

@api_router.get("/subscription/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    """
    Step 3: Check checkout session status and activate subscription
    """
    # Find transaction
    transaction = await db.subscription_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    # If already processed, return cached status
    if transaction["payment_status"] == "paid":
        subscription = await db.subscriptions.find_one({"id": transaction["subscription_id"]}, {"_id": 0})
        return {
            "status": "complete",
            "payment_status": "paid",
            "subscription_status": subscription["status"] if subscription else "unknown"
        }
    
    # Check with Stripe
    if EMERGENT_AVAILABLE:
        try:
            host_url = str(request.base_url).rstrip('/')
            webhook_url = f"{host_url}/api/webhook/stripe"
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
            
            status = await stripe_checkout.get_checkout_status(session_id)
            
            # Update transaction
            await db.subscription_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": status.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # If paid, activate subscription
            if status.payment_status == "paid":
                subscription = await db.subscriptions.find_one({"stripe_session_id": session_id}, {"_id": 0})
                if subscription:
                    trial_ends_at = datetime.now(timezone.utc) + timedelta(days=14)
                    await db.subscriptions.update_one(
                        {"id": subscription["id"]},
                        {"$set": {
                            "status": "trialing",
                            "trial_ends_at": trial_ends_at.isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    
                    # Generate JWT token for auto-login
                    user = await db.users.find_one({"id": subscription["user_id"]}, {"_id": 0})
                    if user:
                        token = jwt.encode({
                            'user_id': user['id'],
                            'email': user['email'],
                            'restaurant_id': user['restaurant_id'],
                            'role': user['role'],
                            'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
                        }, JWT_SECRET, algorithm=JWT_ALGORITHM)
                        
                        return {
                            "status": status.status,
                            "payment_status": status.payment_status,
                            "subscription_status": "trialing",
                            "trial_ends_at": trial_ends_at.isoformat(),
                            "token": token,
                            "user": {
                                "id": user["id"],
                                "email": user["email"],
                                "name": user["name"],
                                "restaurant_id": user["restaurant_id"]
                            }
                        }
            
            return {
                "status": status.status,
                "payment_status": status.payment_status
            }
            
        except Exception as e:
            logger.error(f"Stripe status check error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro ao verificar pagamento: {str(e)}")
    else:
        # Mock for local development - auto-activate
        subscription = await db.subscriptions.find_one({"stripe_session_id": session_id}, {"_id": 0})
        if subscription:
            trial_ends_at = datetime.now(timezone.utc) + timedelta(days=14)
            await db.subscriptions.update_one(
                {"id": subscription["id"]},
                {"$set": {
                    "status": "trialing",
                    "trial_ends_at": trial_ends_at.isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            await db.subscription_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            user = await db.users.find_one({"id": subscription["user_id"]}, {"_id": 0})
            if user:
                token = jwt.encode({
                    'user_id': user['id'],
                    'email': user['email'],
                    'restaurant_id': user['restaurant_id'],
                    'role': user['role'],
                    'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
                }, JWT_SECRET, algorithm=JWT_ALGORITHM)
                
                return {
                    "status": "complete",
                    "payment_status": "paid",
                    "subscription_status": "trialing",
                    "trial_ends_at": trial_ends_at.isoformat(),
                    "token": token,
                    "user": {
                        "id": user["id"],
                        "email": user["email"],
                        "name": user["name"],
                        "restaurant_id": user["restaurant_id"]
                    },
                    "mock": True
                }
        
        return {"status": "pending", "payment_status": "unpaid", "mock": True}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")
        
        if EMERGENT_AVAILABLE:
            host_url = str(request.base_url).rstrip('/')
            webhook_url = f"{host_url}/api/webhook/stripe"
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
            
            webhook_response = await stripe_checkout.handle_webhook(body, signature)
            
            # Process webhook event
            if webhook_response.payment_status == "paid":
                session_id = webhook_response.session_id
                metadata = webhook_response.metadata or {}
                
                if metadata.get("type") == "subscription":
                    subscription_id = metadata.get("subscription_id")
                    if subscription_id:
                        trial_ends_at = datetime.now(timezone.utc) + timedelta(days=14)
                        await db.subscriptions.update_one(
                            {"id": subscription_id},
                            {"$set": {
                                "status": "trialing",
                                "trial_ends_at": trial_ends_at.isoformat(),
                                "updated_at": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                        await db.subscription_transactions.update_one(
                            {"session_id": session_id},
                            {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
                        )
            
            return {"status": "ok", "event_type": webhook_response.event_type}
        
        return {"status": "ok", "mock": True}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return JSONResponse(status_code=200, content={"status": "error", "message": str(e)})

@api_router.get("/subscription/user/{user_id}")
async def get_user_subscription(user_id: str):
    """Get subscription details for a user"""
    subscription = await db.subscriptions.find_one({"user_id": user_id}, {"_id": 0})
    if not subscription:
        return {"has_subscription": False}
    
    plan = SUBSCRIPTION_PLANS.get(subscription["plan_id"], {})
    
    return {
        "has_subscription": True,
        "subscription": subscription,
        "plan": {
            "id": subscription["plan_id"],
            "name": plan.get("name", "Unknown"),
            "tables_limit": plan.get("tables_limit"),
            "features": plan.get("features", [])
        }
    }

# ============= IMAGE UPLOAD =============

# Create uploads directory
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload an image and return the URL"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tipo de ficheiro não suportado. Use JPEG, PNG, GIF ou WebP.")
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao guardar ficheiro: {str(e)}")
    
    # Return URL
    image_url = f"/api/uploads/{unique_filename}"
    return {"url": image_url, "filename": unique_filename}

@api_router.get("/uploads/{filename}")
async def get_uploaded_image(filename: str):
    """Serve uploaded images"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Imagem não encontrada")
    
    # Determine content type
    extension = filename.split(".")[-1].lower()
    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp"
    }
    content_type = content_types.get(extension, "image/jpeg")
    
    return FileResponse(file_path, media_type=content_type)

# ============= BACKOFFICE ROUTES =============

@api_router.get("/backoffice/restaurants")
async def get_all_restaurants():
    """Get all restaurants for backoffice"""
    restaurants = await db.restaurants.find({}, {"_id": 0}).to_list(500)
    
    # Get admin count for each restaurant
    for r in restaurants:
        admin_count = await db.users.count_documents({"restaurant_id": r["id"], "role": "admin"})
        r["admin_count"] = admin_count
    
    return restaurants

@api_router.post("/backoffice/restaurants")
async def create_restaurant_with_admin(data: dict):
    """Create a new restaurant with admin account"""
    # Create restaurant
    restaurant = Restaurant(
        name=data.get("restaurant_name"),
        description=data.get("description"),
        address=data.get("address"),
        phone=data.get("phone")
    )
    rest_doc = restaurant.model_dump()
    rest_doc['created_at'] = rest_doc['created_at'].isoformat()
    await db.restaurants.insert_one(rest_doc)
    
    # Create admin user
    plain_password = data.get("admin_password")
    hashed_password = pwd_context.hash(plain_password)
    user = User(
        email=data.get("admin_email"),
        name=data.get("admin_name"),
        role="admin",
        restaurant_id=restaurant.id
    )
    user_doc = user.model_dump()
    user_doc['password'] = hashed_password
    user_doc['plain_password'] = plain_password  # Store for backoffice viewing
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    await db.users.insert_one(user_doc)
    
    return {
        "restaurant_id": restaurant.id,
        "user_id": user.id,
        "message": "Restaurante e administrador criados com sucesso"
    }

@api_router.delete("/backoffice/restaurants/{restaurant_id}")
async def delete_restaurant(restaurant_id: str):
    """Delete a restaurant and all associated data"""
    # Delete all related data
    await db.users.delete_many({"restaurant_id": restaurant_id})
    await db.tables.delete_many({"restaurant_id": restaurant_id})
    await db.categories.delete_many({"restaurant_id": restaurant_id})
    await db.products.delete_many({"restaurant_id": restaurant_id})
    await db.orders.delete_many({"restaurant_id": restaurant_id})
    await db.floor_zones.delete_many({"restaurant_id": restaurant_id})
    await db.floor_walls.delete_many({"restaurant_id": restaurant_id})
    await db.floor_elements.delete_many({"restaurant_id": restaurant_id})
    await db.floor_rooms.delete_many({"restaurant_id": restaurant_id})
    await db.restaurants.delete_one({"id": restaurant_id})
    
    return {"message": "Restaurante e todos os dados associados foram eliminados"}

@api_router.get("/backoffice/restaurants/{restaurant_id}/admins")
async def get_restaurant_admins(restaurant_id: str):
    """Get all admin users for a restaurant"""
    admins = await db.users.find(
        {"restaurant_id": restaurant_id, "role": "admin"},
        {"_id": 0, "password": 0}
    ).to_list(100)
    return admins

@api_router.post("/backoffice/restaurants/{restaurant_id}/admins")
async def add_restaurant_admin(restaurant_id: str, data: dict):
    """Add a new admin to a restaurant"""
    # Check if email already exists
    existing = await db.users.find_one({"email": data.get("email")})
    if existing:
        raise HTTPException(status_code=400, detail="Este email já está registado")
    
    plain_password = data.get("password")
    hashed_password = pwd_context.hash(plain_password)
    user = User(
        email=data.get("email"),
        name=data.get("name"),
        role="admin",
        restaurant_id=restaurant_id
    )
    user_doc = user.model_dump()
    user_doc['password'] = hashed_password
    user_doc['plain_password'] = plain_password  # Store for backoffice viewing
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    await db.users.insert_one(user_doc)
    
    return {"user_id": user.id, "message": "Administrador adicionado com sucesso"}

@api_router.delete("/backoffice/admins/{user_id}")
async def delete_admin(user_id: str):
    """Delete an admin user"""
    await db.users.delete_one({"id": user_id})
    return {"message": "Administrador eliminado com sucesso"}

# ============= BACKOFFICE EMAILS ROUTES =============

@api_router.get("/backoffice/emails")
async def get_emails():
    """Get all emails sent by the system"""
    emails = await db.emails.find({}, {"_id": 0}).sort("sent_at", -1).to_list(1000)
    return emails

@api_router.get("/backoffice/emails/{email_id}")
async def get_email_detail(email_id: str):
    """Get detailed information about a specific email"""
    email = await db.emails.find_one({"id": email_id}, {"_id": 0})
    if not email:
        raise HTTPException(status_code=404, detail="Email não encontrado")
    return email
# ============= PASSWORD RECOVERY ROUTES =============

@api_router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    """Gera um token de recuperação e envia por email"""
    user = await db.users.find_one({"email": request.email})
    
    # Por segurança, retornamos sucesso mesmo que o email não exista
    if not user:
        return {"message": "Se o email estiver registado, receberá um link de recuperação."}

    # Gerar token JWT temporário (expira em 1 hora)
    token_data = {
        "sub": user["id"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "purpose": "password_reset"
    }
    reset_token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)

    # Construir link para o frontend
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Recuperação de Password - ZentraQR</h2>
        <p>Recebemos um pedido para redefinir a sua password. Clique no botão abaixo para prosseguir:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #1a2342; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Redefinir Password</a>
        </div>
        <p>Este link expira em 1 hora.</p>
        <p>Se não solicitou esta alteração, pode ignorar este email.</p>
    </div>
    """
    
    # Enviar usando a função já existente
    send_email_gmail(user["email"], "Recuperação de Password - ZentraQR", html_body)
    
    return {"message": "Email de recuperação enviado com sucesso."}

@api_router.post("/auth/reset-password")
async def reset_password(data: PasswordResetConfirm):
    """Valida o token e atualiza a password na base de dados"""
    try:
        # Decodificar e validar o token
        payload = jwt.decode(data.token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if payload.get("purpose") != "password_reset":
            raise HTTPException(status_code=400, detail="Token inválido para esta operação")
            
        user_id = payload.get("sub")
        new_hashed_password = hash_password(data.new_password)
        
        # Atualizar no MongoDB
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {"password": new_hashed_password}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Utilizador não encontrado")
            
        return {"message": "Password atualizada com sucesso!"}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="O link de recuperação expirou")
    except jwt.JWTError:
        raise HTTPException(status_code=400, detail="Token de recuperação inválido")
        
# ============= INCLUDE ROUTER =============

fastapi_app.include_router(api_router)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@fastapi_app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Export socket_app as app for uvicorn to use Socket.IO
# This enables real-time WebSocket connections
app = socket_app



