import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ChefHat, ShoppingCart, ArrowLeft, Plus, Minus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const restaurantId = searchParams.get('restaurant_id');
  const tableId = searchParams.get('table_id');

  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId || !tableId) {
      navigate('/');
      return;
    }
    loadData();
  }, [restaurantId, tableId]);

  const loadData = async () => {
    try {
      const [restRes, catRes, prodRes] = await Promise.all([
        axios.get(`${API}/restaurants/${restaurantId}`),
        axios.get(`${API}/categories/restaurant/${restaurantId}`),
        axios.get(`${API}/products/restaurant/${restaurantId}`)
      ]);

      setRestaurant(restRes.data);
      setCategories(catRes.data);
      setProducts(prodRes.data);

      if (catRes.data.length > 0) {
        setSelectedCategory(catRes.data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, extras = [], notes = '') => {
    const extrasPrice = extras.reduce((sum, extra) => sum + extra.price, 0);
    const totalPrice = product.price + extrasPrice;

    setCart([...cart, {
      ...product,
      selectedExtras: extras,
      notes,
      itemPrice: totalPrice,
      cartId: Date.now()
    }]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.itemPrice, 0);
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5500]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF5500] rounded-full flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#18181B]">{restaurant?.name}</h1>
              <p className="text-sm text-[#71717A]">Mesa {searchParams.get('table_id')?.slice(-4)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="sticky top-[73px] z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              data-testid={`category-${cat.name.toLowerCase()}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat.id
                  ? 'bg-[#FF5500] text-white shadow-lg shadow-orange-500/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      </div>

      {/* Cart Button */}
      {cart.length > 0 && !document.querySelector('[data-modal-open="true"]') && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-4 left-4 right-4 z-40"
        >
          <button
            data-testid="view-cart-button"
            onClick={() => navigate(`/cart?restaurant_id=${restaurantId}&table_id=${tableId}`, { state: { cart, restaurant } })}
            className="w-full bg-[#FF5500] hover:bg-[#CC4400] text-white rounded-full py-4 px-6 font-bold shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center justify-between transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" />
              <span>Ver Carrinho</span>
              <span className="bg-white text-[#FF5500] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {cart.length}
              </span>
            </div>
            <span className="font-bold">€{getCartTotal().toFixed(2)}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

const ProductCard = ({ product, onAddToCart }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    // Add multiple items based on quantity
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, selectedExtras, notes);
    }
    setShowDetails(false);
    setSelectedExtras([]);
    setNotes('');
    setQuantity(1);
  };

  const toggleExtra = (extra) => {
    if (selectedExtras.find(e => e.id === extra.id)) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const getTotalPrice = () => {
    const extrasPrice = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
    return (product.price + extrasPrice) * quantity;
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.01 }}
        data-testid={`product-${product.name.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={() => setShowDetails(true)}
        className="card card-hover cursor-pointer overflow-hidden"
      >
        <div className="flex gap-4">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div className="flex-1 py-2">
            <h3 className="font-bold text-lg text-[#18181B]">{product.name}</h3>
            <p className="text-sm text-[#71717A] line-clamp-2 mt-1">{product.description}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold text-[#FF5500]">€{product.price.toFixed(2)}</span>
              <button
                data-testid={`add-${product.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-[#FF5500] hover:bg-[#CC4400] text-white rounded-full px-4 py-1 text-sm font-bold transition-all active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(true);
                }}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Product Details Modal */}
      {showDetails && (
        <div 
          data-modal-open="true"
          className="fixed inset-0 bg-black/50 z-50 flex items-end" 
          onClick={() => setShowDetails(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-[#18181B]">{product.name}</h2>
                <button
                  data-testid="close-product-details"
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              )}

              <p className="text-[#71717A] mb-6">{product.description}</p>

              {product.extras && product.extras.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-3">Extras</h3>
                  <div className="space-y-2">
                    {product.extras.map((extra) => (
                      <label
                        key={extra.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-[#FF5500] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedExtras.find(e => e.id === extra.id)}
                            onChange={() => toggleExtra(extra)}
                            className="w-5 h-5 accent-[#FF5500]"
                          />
                          <span className="font-medium">{extra.name}</span>
                        </div>
                        <span className="text-[#FF5500] font-bold">+€{extra.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Observações</h3>
                <textarea
                  data-testid="product-notes-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alguma observação especial?"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Quantidade</h3>
                <div className="flex items-center justify-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <button
                    data-testid="decrease-quantity"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-95"
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold text-[#18181B] w-12 text-center" data-testid="quantity-display">
                    {quantity}
                  </span>
                  <button
                    data-testid="increase-quantity"
                    onClick={increaseQuantity}
                    className="w-10 h-10 bg-[#FF5500] hover:bg-[#CC4400] text-white rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                data-testid="confirm-add-to-cart"
                onClick={handleAddToCart}
                className="w-full bg-[#FF5500] hover:bg-[#CC4400] text-white rounded-full py-4 px-6 font-bold shadow-lg flex items-center justify-between transition-all active:scale-95"
              >
                <span>Adicionar ao Carrinho</span>
                <span>€{getTotalPrice().toFixed(2)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default MenuPage;
