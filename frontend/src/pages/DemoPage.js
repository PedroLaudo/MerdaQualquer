import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import {
  QrCode,
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Bell,
  ChefHat,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Users,
  CreditCard,
  Utensils,
  Coffee,
  Cake,
  Wine,
  Globe,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Play,
  Monitor,
  Smartphone,
} from 'lucide-react';

// Color palette
const colors = {
  primary: '#1E2A4A',
  secondary: '#3B5998',
  accent: '#1a2342',
  dark: '#1E2A4A',
  light: '#F8FAFC',
  white: '#FFFFFF',
  gray: '#64748B',
  border: '#E2E8F0',
  green: '#10B981',
  orange: '#1a2342',
  red: '#EF4444',
};

// Logo URL
const logoUrl = '/logo.png';

// Demo data
const demoCategories = [
  { id: 'all', name: { pt: 'Todos', en: 'All' }, icon: Utensils },
  { id: 'starters', name: { pt: 'Entradas', en: 'Starters' }, icon: Utensils },
  { id: 'mains', name: { pt: 'Pratos', en: 'Mains' }, icon: ChefHat },
  { id: 'drinks', name: { pt: 'Bebidas', en: 'Drinks' }, icon: Coffee },
  { id: 'desserts', name: { pt: 'Sobremesas', en: 'Desserts' }, icon: Cake },
];

const demoProducts = [
  {
    id: '1',
    category: 'starters',
    name: { pt: 'Bruschetta Tradicional', en: 'Traditional Bruschetta' },
    description: { pt: 'Pão torrado com tomate, alho e manjericão', en: 'Toasted bread with tomato, garlic and basil' },
    price: 6.50,
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=300&q=80',
  },
  {
    id: '2',
    category: 'starters',
    name: { pt: 'Carpaccio de Salmão', en: 'Salmon Carpaccio' },
    description: { pt: 'Salmão fresco com alcaparras e rúcula', en: 'Fresh salmon with capers and arugula' },
    price: 12.00,
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&q=80',
  },
  {
    id: '3',
    category: 'mains',
    name: { pt: 'Risotto de Cogumelos', en: 'Mushroom Risotto' },
    description: { pt: 'Risotto cremoso com mix de cogumelos', en: 'Creamy risotto with mushroom mix' },
    price: 16.50,
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=300&q=80',
  },
  {
    id: '4',
    category: 'mains',
    name: { pt: 'Bife à Portuguesa', en: 'Portuguese Steak' },
    description: { pt: 'Bife com ovo, batata frita e arroz', en: 'Steak with egg, fries and rice' },
    price: 18.90,
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=300&q=80',
  },
  {
    id: '5',
    category: 'drinks',
    name: { pt: 'Limonada Fresca', en: 'Fresh Lemonade' },
    description: { pt: 'Limonada caseira com hortelã', en: 'Homemade lemonade with mint' },
    price: 4.00,
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&q=80',
  },
  {
    id: '6',
    category: 'drinks',
    name: { pt: 'Vinho da Casa', en: 'House Wine' },
    description: { pt: 'Tinto ou branco, copo 150ml', en: 'Red or white, 150ml glass' },
    price: 5.50,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&q=80',
  },
  {
    id: '7',
    category: 'desserts',
    name: { pt: 'Tiramisu', en: 'Tiramisu' },
    description: { pt: 'Clássico italiano com mascarpone', en: 'Italian classic with mascarpone' },
    price: 7.00,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&q=80',
  },
  {
    id: '8',
    category: 'desserts',
    name: { pt: 'Mousse de Chocolate', en: 'Chocolate Mousse' },
    description: { pt: 'Mousse aerada de chocolate belga', en: 'Airy Belgian chocolate mousse' },
    price: 6.00,
    image: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=300&q=80',
  },
];

const demoOrders = [
  { id: '1', table: '5', items: 3, total: 42.50, status: 'preparing', time: '2 min' },
  { id: '2', table: '3', items: 2, total: 28.00, status: 'received', time: 'agora' },
  { id: '3', table: '8', items: 4, total: 56.90, status: 'ready', time: '8 min' },
  { id: '4', table: '1', items: 2, total: 24.00, status: 'delivered', time: '15 min' },
];

// Tour steps configuration
const tourSteps = [
  { id: 'welcome', view: 'client', highlight: null },
  { id: 'menu', view: 'client', highlight: 'menu-grid' },
  { id: 'cart', view: 'client', highlight: 'cart-section' },
  { id: 'order', view: 'client', highlight: 'order-button' },
  { id: 'dashboard', view: 'admin', highlight: 'stats-cards' },
  { id: 'orders', view: 'admin', highlight: 'orders-list' },
  { id: 'complete', view: 'admin', highlight: null },
];

const DemoPage = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [activeView, setActiveView] = useState('client'); // 'client' or 'admin'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  
  // Tour state
  const [showTour, setShowTour] = useState(true);
  const [tourStep, setTourStep] = useState(0);
  const [tourStarted, setTourStarted] = useState(false);

  // Filter products by category
  const filteredProducts = selectedCategory === 'all' 
    ? demoProducts 
    : demoProducts.filter(p => p.category === selectedCategory);

  // Cart functions
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    const existing = cart.find(item => item.id === productId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.id !== productId));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = () => {
    setShowOrderSuccess(true);
    setTimeout(() => {
      setShowOrderSuccess(false);
      setCart([]);
    }, 2000);
  };

  // Tour navigation
  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      const nextStep = tourSteps[tourStep + 1];
      setActiveView(nextStep.view);
      setTourStep(tourStep + 1);
    }
  };

  const prevTourStep = () => {
    if (tourStep > 0) {
      const prevStep = tourSteps[tourStep - 1];
      setActiveView(prevStep.view);
      setTourStep(tourStep - 1);
    }
  };

  const startTour = () => {
    setTourStarted(true);
    setTourStep(0);
    setActiveView('client');
  };

  const skipTour = () => {
    setShowTour(false);
    setTourStarted(false);
  };

  const finishTour = () => {
    setShowTour(false);
    setTourStarted(false);
  };

  // Get current tour content
  const getCurrentTourContent = () => {
    const step = tourSteps[tourStep];
    const stepId = step.id;
    return {
      title: t(`demo.tour${stepId.charAt(0).toUpperCase() + stepId.slice(1)}`),
      description: t(`demo.tour${stepId.charAt(0).toUpperCase() + stepId.slice(1)}Desc`),
    };
  };

  // Status color helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'received': return colors.secondary;
      case 'preparing': return colors.orange;
      case 'ready': return colors.green;
      case 'delivered': return colors.gray;
      default: return colors.gray;
    }
  };

  const getStatusText = (status) => {
    return t(`demo.status.${status}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b" style={{ borderColor: colors.border }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back + Logo */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                data-testid="back-button"
              >
                <ArrowLeft className="w-5 h-5" style={{ color: colors.dark }} />
              </button>
              <div className="flex items-center gap-2">
                <img src={logoUrl} alt="ZentraQR" className="w-8 h-8 object-contain" />
                <span className="font-bold text-lg" style={{ color: colors.primary }}>ZentraQR Demo</span>
              </div>
            </div>

            {/* View Toggle */}
            <div className="hidden sm:flex items-center gap-2 p-1 rounded-full border" style={{ borderColor: colors.border, backgroundColor: colors.light }}>
              <button
                onClick={() => setActiveView('client')}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 ${
                  activeView === 'client' ? 'bg-white shadow-sm' : ''
                }`}
                style={{ color: activeView === 'client' ? colors.dark : colors.gray }}
                data-testid="view-client"
              >
                <Smartphone className="w-4 h-4" />
                {t('demo.clientView')}
              </button>
              <button
                onClick={() => setActiveView('admin')}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 ${
                  activeView === 'admin' ? 'bg-white shadow-sm' : ''
                }`}
                style={{ color: activeView === 'admin' ? colors.dark : colors.gray }}
                data-testid="view-admin"
              >
                <Monitor className="w-4 h-4" />
                {t('demo.adminView')}
              </button>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                data-testid="language-toggle"
              >
                <Globe className="w-4 h-4" style={{ color: colors.gray }} />
                <span className="font-medium text-sm" style={{ color: colors.dark }}>
                  {language.toUpperCase()}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile View Toggle */}
      <div className="sm:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b p-2" style={{ borderColor: colors.border }}>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('client')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeView === 'client' ? 'text-white' : ''
            }`}
            style={{ 
              backgroundColor: activeView === 'client' ? colors.primary : colors.light,
              color: activeView === 'client' ? 'white' : colors.gray 
            }}
          >
            <Smartphone className="w-4 h-4" />
            {t('demo.clientView')}
          </button>
          <button
            onClick={() => setActiveView('admin')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeView === 'admin' ? 'text-white' : ''
            }`}
            style={{ 
              backgroundColor: activeView === 'admin' ? colors.primary : colors.light,
              color: activeView === 'admin' ? 'white' : colors.gray 
            }}
          >
            <Monitor className="w-4 h-4" />
            {t('demo.adminView')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-16 sm:pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center py-8 sm:py-12">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: colors.dark }}>
              {t('demo.title')}
            </h1>
            <p style={{ color: colors.gray }}>{t('demo.subtitle')}</p>
            
            {/* Start Tour Button */}
            {!tourStarted && showTour && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={startTour}
                className="mt-6 px-6 py-3 rounded-full font-semibold text-white flex items-center gap-2 mx-auto"
                style={{ backgroundColor: colors.accent }}
                data-testid="start-tour"
              >
                <Play className="w-5 h-5" />
                {t('demo.startTour')}
              </motion.button>
            )}
          </div>

          {/* Demo Content */}
          <div className="grid lg:grid-cols-3 gap-6 sm:mt-0 mt-12">
            {/* Client View */}
            <AnimatePresence mode="wait">
              {activeView === 'client' && (
                <motion.div
                  key="client"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="lg:col-span-2"
                >
                  <div 
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border"
                    style={{ borderColor: colors.border }}
                    id="menu-grid"
                  >
                    {/* Menu Header */}
                    <div className="p-4 sm:p-6 border-b" style={{ borderColor: colors.border }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="font-bold text-lg" style={{ color: colors.dark }}>Restaurante Demo</h2>
                          <p className="text-sm" style={{ color: colors.gray }}>{t('demo.table')} 5</p>
                        </div>
                        <button className="p-2 rounded-lg border" style={{ borderColor: colors.border }}>
                          <Bell className="w-5 h-5" style={{ color: colors.gray }} />
                        </button>
                      </div>
                      
                      {/* Categories */}
                      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {demoCategories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                              selectedCategory === cat.id ? 'text-white' : ''
                            }`}
                            style={{ 
                              backgroundColor: selectedCategory === cat.id ? colors.primary : colors.light,
                              color: selectedCategory === cat.id ? 'white' : colors.gray
                            }}
                          >
                            {cat.name[language]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="p-4 sm:p-6 grid sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all"
                          style={{ borderColor: colors.border }}
                        >
                          <img 
                            src={product.image} 
                            alt={product.name[language]}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-3">
                            <h3 className="font-semibold text-sm mb-1" style={{ color: colors.dark }}>
                              {product.name[language]}
                            </h3>
                            <p className="text-xs mb-2 line-clamp-2" style={{ color: colors.gray }}>
                              {product.description[language]}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold" style={{ color: colors.accent }}>
                                €{product.price.toFixed(2)}
                              </span>
                              <button
                                onClick={() => addToCart(product)}
                                className="px-3 py-1.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
                                style={{ backgroundColor: colors.accent }}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Admin View */}
              {activeView === 'admin' && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-2"
                >
                  <div className="space-y-6">
                    {/* Stats Cards */}
                    <div id="stats-cards" className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl p-4 border" style={{ borderColor: colors.border }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm" style={{ color: colors.gray }}>{t('demo.todayOrders')}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}>
                            Live
                          </span>
                        </div>
                        <div className="text-2xl font-bold" style={{ color: colors.dark }}>47</div>
                        <div className="flex items-center gap-1 text-sm" style={{ color: colors.green }}>
                          <TrendingUp className="w-4 h-4" />
                          +23%
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border" style={{ borderColor: colors.border }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm" style={{ color: colors.gray }}>{t('demo.revenue')}</span>
                          <CreditCard className="w-4 h-4" style={{ color: colors.gray }} />
                        </div>
                        <div className="text-2xl font-bold" style={{ color: colors.dark }}>€1,240</div>
                        <div className="text-sm" style={{ color: colors.gray }}>+€180</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border" style={{ borderColor: colors.border }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm" style={{ color: colors.gray }}>{t('demo.activeOrders')}</span>
                          <Users className="w-4 h-4" style={{ color: colors.gray }} />
                        </div>
                        <div className="text-2xl font-bold" style={{ color: colors.dark }}>12</div>
                        <div className="text-sm" style={{ color: colors.orange }}>4 {t('demo.status.preparing')}</div>
                      </div>
                    </div>

                    {/* Orders List */}
                    <div 
                      id="orders-list"
                      className="bg-white rounded-xl border overflow-hidden"
                      style={{ borderColor: colors.border }}
                    >
                      <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                        <h3 className="font-bold" style={{ color: colors.dark }}>{t('demo.recentOrders')}</h3>
                      </div>
                      <div className="divide-y" style={{ borderColor: colors.border }}>
                        {demoOrders.map((order) => (
                          <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: colors.primary }}
                              >
                                {order.table}
                              </div>
                              <div>
                                <p className="font-medium" style={{ color: colors.dark }}>
                                  {t('demo.table')} {order.table}
                                </p>
                                <p className="text-sm" style={{ color: colors.gray }}>
                                  {order.items} {t('demo.items')} · €{order.total.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: `${getStatusColor(order.status)}15`,
                                  color: getStatusColor(order.status)
                                }}
                              >
                                {getStatusText(order.status)}
                              </span>
                              <p className="text-xs mt-1" style={{ color: colors.gray }}>{order.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cart Sidebar (Client View) / Quick Stats (Admin View) */}
            <div className="lg:col-span-1">
              {activeView === 'client' ? (
                <div 
                  id="cart-section"
                  className="bg-white rounded-2xl shadow-lg border sticky top-24"
                  style={{ borderColor: colors.border }}
                >
                  <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold" style={{ color: colors.dark }}>
                        <ShoppingCart className="w-5 h-5 inline mr-2" />
                        {t('demo.cart')}
                      </h3>
                      {cartCount > 0 && (
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: colors.accent }}
                        >
                          {cartCount}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 max-h-[300px] overflow-y-auto">
                    {cart.length === 0 ? (
                      <p className="text-center py-8" style={{ color: colors.gray }}>
                        {t('demo.emptyCart')}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <img 
                              src={item.image} 
                              alt={item.name[language]}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate" style={{ color: colors.dark }}>
                                {item.name[language]}
                              </p>
                              <p className="text-sm" style={{ color: colors.accent }}>
                                €{(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: colors.light }}
                              >
                                <Minus className="w-3 h-3" style={{ color: colors.gray }} />
                              </button>
                              <span className="font-medium text-sm w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: colors.light }}
                              >
                                <Plus className="w-3 h-3" style={{ color: colors.gray }} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="p-4 border-t" style={{ borderColor: colors.border }}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-medium" style={{ color: colors.gray }}>{t('demo.total')}</span>
                        <span className="text-xl font-bold" style={{ color: colors.dark }}>
                          €{cartTotal.toFixed(2)}
                        </span>
                      </div>
                      <button
                        id="order-button"
                        onClick={placeOrder}
                        className="w-full py-3 rounded-full font-bold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: colors.accent }}
                        data-testid="place-order"
                      >
                        {t('demo.placeOrder')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="bg-white rounded-2xl shadow-lg border p-6 sticky top-24"
                  style={{ borderColor: colors.border }}
                >
                  <h3 className="font-bold mb-4" style={{ color: colors.dark }}>
                    <BarChart3 className="w-5 h-5 inline mr-2" />
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span style={{ color: colors.gray }}>Avg. Order Value</span>
                      <span className="font-bold" style={{ color: colors.dark }}>€26.38</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: colors.gray }}>Orders/Hour</span>
                      <span className="font-bold" style={{ color: colors.dark }}>8.2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: colors.gray }}>Best Seller</span>
                      <span className="font-bold" style={{ color: colors.dark }}>Risotto</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: colors.gray }}>Tables Active</span>
                      <span className="font-bold" style={{ color: colors.dark }}>8/12</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Order Success Modal */}
      <AnimatePresence>
        {showOrderSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 text-center max-w-sm"
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${colors.green}15` }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: colors.green }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.dark }}>
                {t('demo.orderPlaced')}
              </h3>
              <p style={{ color: colors.gray }}>
                {language === 'pt' ? 'O pedido foi enviado para a cozinha.' : 'The order has been sent to the kitchen.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tour Overlay */}
      <AnimatePresence>
        {tourStarted && showTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full"
            >
              {/* Tour Progress */}
              <div className="flex gap-1 mb-6">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 h-1 rounded-full transition-all"
                    style={{ 
                      backgroundColor: index <= tourStep ? colors.accent : colors.border 
                    }}
                  />
                ))}
              </div>

              {/* Tour Content */}
              <div className="text-center mb-6">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${colors.accent}15` }}
                >
                  <Sparkles className="w-7 h-7" style={{ color: colors.accent }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.dark }}>
                  {getCurrentTourContent().title}
                </h3>
                <p style={{ color: colors.gray }}>
                  {getCurrentTourContent().description}
                </p>
              </div>

              {/* Tour Navigation */}
              <div className="flex gap-3">
                {tourStep > 0 && (
                  <button
                    onClick={prevTourStep}
                    className="flex-1 py-3 rounded-full font-semibold border transition-all"
                    style={{ borderColor: colors.border, color: colors.gray }}
                  >
                    <ChevronLeft className="w-4 h-4 inline mr-1" />
                    {t('demo.prevStep')}
                  </button>
                )}
                {tourStep === 0 && (
                  <button
                    onClick={skipTour}
                    className="flex-1 py-3 rounded-full font-semibold border transition-all"
                    style={{ borderColor: colors.border, color: colors.gray }}
                  >
                    {t('demo.skipTour')}
                  </button>
                )}
                {tourStep < tourSteps.length - 1 ? (
                  <button
                    onClick={nextTourStep}
                    className="flex-1 py-3 rounded-full font-semibold text-white transition-all"
                    style={{ backgroundColor: colors.accent }}
                  >
                    {t('demo.nextStep')}
                    <ChevronRight className="w-4 h-4 inline ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={finishTour}
                    className="flex-1 py-3 rounded-full font-semibold text-white transition-all"
                    style={{ backgroundColor: colors.green }}
                  >
                    {t('demo.finishTour')}
                    <CheckCircle2 className="w-4 h-4 inline ml-1" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DemoPage;
