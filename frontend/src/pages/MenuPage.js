import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, Bell, Plus, Minus, X, 
  ChefHat, Utensils, Pizza, Coffee, IceCream, Wine,
  Check, AlertCircle
} from 'lucide-react';
import { RestaurantProvider, useRestaurant } from '../contexts/RestaurantContext';
import TextMenuRenderer from '../components/menu/TextMenuRenderer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Category icons mapping
const categoryIcons = {
  'hambúrgueres': ChefHat,
  'hamburger': ChefHat,
  'burgers': ChefHat,
  'pizzas': Pizza,
  'pizza': Pizza,
  'bebidas': Wine,
  'drinks': Wine,
  'sobremesas': IceCream,
  'desserts': IceCream,
  'dessert': IceCream,
  'sushi': Utensils,
  'saladas': Utensils,
  'salads': Utensils,
  'coffee': Coffee,
  'café': Coffee,
};

const getCategoryIcon = (categoryName) => {
  const name = categoryName?.toLowerCase() || '';
  for (const [key, Icon] of Object.entries(categoryIcons)) {
    if (name.includes(key)) return Icon;
  }
  return Utensils;
};

// Helper to convert hex to rgba
const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(255, 85, 0, ${alpha})`; // fallback
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const restaurantId = searchParams.get('restaurant_id');
  const tableId = searchParams.get('table_id');

  return (
    <RestaurantProvider restaurantId={restaurantId}>
      <MenuPageContent 
        restaurantId={restaurantId}
        tableId={tableId}
        navigate={navigate}
        searchParams={searchParams}
      />
    </RestaurantProvider>
  );
};

const MenuPageContent = ({ restaurantId, tableId, navigate }) => {
  const { restaurant, primaryColor, secondaryColor, logoUrl, restaurantName } = useRestaurant();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [showCart, setShowCart] = useState(false);
  
  // Menu type support (uses same categories/products)
  const [menuType, setMenuType] = useState('image'); // 'image' | 'text'
  const [textMenuTemplate, setTextMenuTemplate] = useState('classic');

  // Use primary color or fallback
  const brandPrimary = primaryColor || '#1E2A4A';
  const brandSecondary = secondaryColor || '#10B981';

  useEffect(() => {
    if (!restaurantId || !tableId) {
      navigate('/');
      return;
    }
    loadData();
    fetchTableNumber();
  }, [restaurantId, tableId]);

  const fetchTableNumber = async () => {
    try {
      const response = await axios.get(`${API}/tables/${tableId}`);
      setTableNumber(response.data.table_number || tableId.slice(-4));
    } catch (error) {
      setTableNumber(tableId.slice(-4));
    }
  };

  const loadData = async () => {
    try {
      // ALWAYS load categories and products (unified data source)
      const [catRes, prodRes, menuConfigRes] = await Promise.all([
        axios.get(`${API}/categories/restaurant/${restaurantId}`),
        axios.get(`${API}/products/restaurant/${restaurantId}`),
        axios.get(`${API}/restaurants/${restaurantId}/menu-config`)
      ]);

      setCategories(catRes.data);
      setProducts(prodRes.data);
      
      const menuConfig = menuConfigRes.data;
      setMenuType(menuConfig.active_menu_type || 'image');
      setTextMenuTemplate(menuConfig.text_menu_template || 'classic');

      if (catRes.data.length > 0) {
        setSelectedCategory(catRes.data[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const callWaiter = async () => {
    if (callingWaiter || waiterCalled) return;
    
    setCallingWaiter(true);
    try {
      await axios.post(`${API}/call-waiter`, {
        restaurant_id: restaurantId,
        table_id: tableId,
        table_number: tableNumber
      });
      setWaiterCalled(true);
      setTimeout(() => setWaiterCalled(false), 30000);
    } catch (error) {
      console.error('Error calling waiter:', error);
    } finally {
      setCallingWaiter(false);
    }
  };

  const addToCart = (product, extras = [], quantity = 1) => {
    const cartItem = {
      product_id: product.id,
      product_name: product.name,
      quantity,
      price: product.price,
      extras: extras,
      image_url: product.image_url,
      notes: ''
    };

    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.product_id === product.id && 
        JSON.stringify(item.extras) === JSON.stringify(extras)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [...prev, cartItem];
    });
  };

  // Add item from text menu to cart (same product structure, no extras by default)
  const addTextMenuItemToCart = (product) => {
    addToCart(product, [], 1);
  };

  const updateCartQuantity = (index, delta) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity += delta;
      if (updated[index].quantity <= 0) {
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  const goToCart = () => {
    navigate('/cart', {
      state: {
        cart,
        restaurantId,
        tableId,
        tableNumber
      }
    });
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch = searchQuery ? 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const isAvailable = p.availability_status !== 'sold_out';
    return matchesCategory && matchesSearch && isAvailable;
  });

  const cartTotal = cart.reduce((sum, item) => {
    const extrasTotal = item.extras.reduce((s, e) => s + e.price, 0);
    return sum + (item.price + extrasTotal) * item.quantity;
  }, 0);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: hexToRgba(brandPrimary, 0.2), borderTopColor: 'transparent' }}
          ></div>
          <p className="text-[#71717A] font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  // Filter out sold_out products for customer view
  const availableProducts = products.filter(p => p.availability_status !== 'sold_out');

  // Render text menu if active (uses same categories/products)
  if (menuType === 'text') {
    return (
      <div className="relative min-h-screen">
        {/* Text Menu - Using unified categories/products */}
        <TextMenuRenderer
          categories={categories}
          products={availableProducts}
          template={textMenuTemplate}
          onAddToCart={addTextMenuItemToCart}
          brandPrimary={brandPrimary}
          brandSecondary={brandSecondary}
          previewMode={false}
        />

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={goToCart}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl text-white font-bold"
            style={{ 
              background: `linear-gradient(135deg, ${brandPrimary} 0%, ${hexToRgba(brandPrimary, 0.8)} 100%)` 
            }}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-lg">{cart.length}</span>
            <span className="hidden sm:inline">Ver Carrinho</span>
          </motion.button>
        )}
      </div>
    );
  }

  // Render image menu (current behavior)
  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32">
      {/* REDESIGNED HEADER - CENTERED LAYOUT */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white sticky top-0 z-40 shadow-sm"
      >
        <div className="px-5 py-5">
          {/* Top Row: Logo Left, Call Waiter Right */}
          <div className="flex items-center justify-between mb-4">
            {/* Logo */}
            <div className="w-14 flex-shrink-0">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={restaurantName}
                  className="w-14 h-14 rounded-full object-cover ring-2"
                  style={{ ringColor: hexToRgba(brandPrimary, 0.2) }}
                />
              ) : (
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${brandPrimary} 0%, ${hexToRgba(brandPrimary, 0.8)} 100%)` 
                  }}
                >
                  <ChefHat className="w-7 h-7 text-white" />
                </div>
              )}
            </div>

            {/* CENTER: Restaurant Name + Table Number */}
            <div className="flex-1 text-center px-4">
              <h1 
                className="text-xl font-bold text-[#18181B] leading-tight mb-0.5" 
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {restaurantName || 'Restaurant'}
              </h1>
              <p className="text-sm text-[#71717A] font-medium">
                Table {tableNumber}
              </p>
            </div>

            {/* Call Waiter Button */}
            <div className="w-14 flex-shrink-0 flex justify-end">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={callWaiter}
                disabled={callingWaiter || waiterCalled}
                className="p-3.5 rounded-full transition-all shadow-lg"
                style={{
                  backgroundColor: waiterCalled ? brandSecondary : 'white',
                  color: waiterCalled ? 'white' : brandPrimary,
                  borderWidth: waiterCalled ? '0' : '2px',
                  borderColor: waiterCalled ? 'transparent' : brandPrimary,
                }}
                data-testid="call-waiter-button"
              >
                {waiterCalled ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Bell className={`w-5 h-5 ${callingWaiter ? 'animate-bounce' : ''}`} />
                )}
              </motion.button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
            <input
              type="text"
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-[#F4F4F5] rounded-full text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 transition-all"
              style={{ 
                '--tw-ring-color': hexToRgba(brandPrimary, 0.3)
              }}
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Category Navigation with Dynamic Colors */}
        <div className="overflow-x-auto hide-scrollbar px-5 pb-4">
          <div className="flex gap-2.5 min-w-max">
            {categories.map(category => {
              const Icon = getCategoryIcon(category.name);
              const isSelected = selectedCategory === category.id;
              
              return (
                <motion.button
                  key={category.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: isSelected ? brandPrimary : 'white',
                    color: isSelected ? 'white' : '#71717A',
                    borderWidth: isSelected ? '0' : '1px',
                    borderColor: isSelected ? 'transparent' : '#E4E4E7',
                    boxShadow: isSelected ? `0 4px 12px ${hexToRgba(brandPrimary, 0.3)}` : '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                  data-testid={`category-${category.id}`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.header>

      {/* Products Grid with Improved Spacing */}
      <div className="px-5 pt-6 space-y-5">
        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <AlertCircle className="w-16 h-16 text-[#A1A1AA] mx-auto mb-4" />
            <p className="text-[#71717A] text-lg font-medium">No items found</p>
            <p className="text-[#A1A1AA] text-sm mt-1">Try searching for something else</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onSelect={setSelectedProduct}
                onQuickAdd={() => addToCart(product, [], 1)}
                brandPrimary={brandPrimary}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product, extras, quantity) => {
          addToCart(product, extras, quantity);
          setSelectedProduct(null);
        }}
        brandPrimary={brandPrimary}
        brandSecondary={brandSecondary}
      />

      {/* Floating Cart Button with Dynamic Colors */}
      <AnimatePresence>
        {cartItemsCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white to-transparent pointer-events-none"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={goToCart}
              className="w-full text-white rounded-2xl py-5 px-6 flex items-center justify-between pointer-events-auto"
              style={{
                background: `linear-gradient(135deg, ${brandPrimary} 0%, ${hexToRgba(brandPrimary, 0.9)} 100%)`,
                boxShadow: `0 8px 24px ${hexToRgba(brandPrimary, 0.4)}`
              }}
              data-testid="view-cart-button"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium opacity-90">View Order</p>
                  <p className="text-base font-bold">{cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  €{cartTotal.toFixed(2)}
                </p>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Product Card Component with Dynamic Colors and Larger Images
const ProductCard = ({ product, index, onSelect, onQuickAdd, brandPrimary }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      onClick={() => onSelect(product)}
      data-testid={`product-card-${product.id}`}
    >
      <div className="flex gap-4 p-5">
        {/* Product Image - LARGER */}
        <div className="flex-shrink-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-28 h-28 rounded-xl object-cover"
            />
          ) : (
            <div 
              className="w-28 h-28 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: hexToRgba(brandPrimary, 0.08) }}
            >
              <Utensils className="w-10 h-10" style={{ color: hexToRgba(brandPrimary, 0.4) }} />
            </div>
          )}
        </div>

        {/* Product Info - Better Spacing */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 
              className="text-base font-bold text-[#18181B] mb-1.5 truncate" 
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-[#71717A] mb-3 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p 
              className="text-xl font-bold" 
              style={{ 
                fontFamily: 'Outfit, sans-serif',
                color: brandPrimary 
              }}
            >
              €{product.price.toFixed(2)}
            </p>
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd();
              }}
              className="text-white p-2.5 rounded-full transition-all"
              style={{
                backgroundColor: brandPrimary,
                boxShadow: `0 4px 12px ${hexToRgba(brandPrimary, 0.35)}`
              }}
              data-testid={`add-product-${product.id}`}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Product Modal Component with Dynamic Colors
const ProductModal = ({ product, onClose, onAddToCart, brandPrimary, brandSecondary }) => {
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setSelectedExtras([]);
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const toggleExtra = (extra) => {
    setSelectedExtras(prev => {
      const exists = prev.find(e => e.id === extra.id);
      if (exists) {
        return prev.filter(e => e.id !== extra.id);
      }
      return [...prev, extra];
    });
  };

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const totalPrice = (product.price + extrasTotal) * quantity;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          data-testid="product-modal"
        >
          {/* Hero Image */}
          <div className="relative h-72 sm:h-80">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: hexToRgba(brandPrimary, 0.1) }}
              >
                <Utensils className="w-20 h-20" style={{ color: hexToRgba(brandPrimary, 0.4) }} />
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-white transition-colors"
              data-testid="close-modal"
            >
              <X className="w-6 h-6 text-[#18181B]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title and Price */}
            <div>
              <h2 
                className="text-2xl font-bold text-[#18181B] mb-2" 
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {product.name}
              </h2>
              {product.description && (
                <p className="text-[#71717A] leading-relaxed mb-4">
                  {product.description}
                </p>
              )}
              <p 
                className="text-3xl font-bold" 
                style={{ 
                  fontFamily: 'Outfit, sans-serif',
                  color: brandPrimary 
                }}
              >
                €{product.price.toFixed(2)}
              </p>
            </div>

            {/* Extras */}
            {product.extras && product.extras.length > 0 && (
              <div>
                <h3 
                  className="text-lg font-bold text-[#18181B] mb-3" 
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Add Extras
                </h3>
                <div className="space-y-3">
                  {product.extras.map(extra => {
                    const isSelected = selectedExtras.find(e => e.id === extra.id);
                    return (
                      <motion.button
                        key={extra.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleExtra(extra)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all"
                        style={{
                          borderColor: isSelected ? brandPrimary : '#E4E4E7',
                          backgroundColor: isSelected ? hexToRgba(brandPrimary, 0.05) : 'white'
                        }}
                        data-testid={`extra-${extra.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                            style={{
                              borderColor: isSelected ? brandPrimary : '#D4D4D8',
                              backgroundColor: isSelected ? brandPrimary : 'transparent'
                            }}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <span className="font-medium text-[#18181B]">{extra.name}</span>
                        </div>
                        <span className="font-bold" style={{ color: brandPrimary }}>
                          +€{extra.price.toFixed(2)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <h3 
                className="text-lg font-bold text-[#18181B] mb-3" 
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Quantity
              </h3>
              <div className="flex items-center justify-center gap-6 bg-[#F4F4F5] rounded-2xl p-2 max-w-xs mx-auto">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-white p-3 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                  disabled={quantity <= 1}
                  data-testid="decrease-quantity"
                >
                  <Minus className="w-5 h-5 text-[#18181B]" />
                </motion.button>
                <span 
                  className="text-2xl font-bold text-[#18181B] w-12 text-center" 
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {quantity}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-white p-3 rounded-xl shadow-sm hover:shadow-md transition-all"
                  data-testid="increase-quantity"
                >
                  <Plus className="w-5 h-5 text-[#18181B]" />
                </motion.button>
              </div>
            </div>

            {/* Add to Order Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onAddToCart(product, selectedExtras, quantity)}
              className="w-full text-white rounded-2xl py-5 px-6 font-bold text-lg transition-all"
              style={{
                background: `linear-gradient(135deg, ${brandPrimary} 0%, ${hexToRgba(brandPrimary, 0.9)} 100%)`,
                boxShadow: `0 8px 24px ${hexToRgba(brandPrimary, 0.35)}`
              }}
              data-testid="add-to-order-button"
            >
              <div className="flex items-center justify-between">
                <span>Add to Order</span>
                <span className="text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  €{totalPrice.toFixed(2)}
                </span>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MenuPage;
