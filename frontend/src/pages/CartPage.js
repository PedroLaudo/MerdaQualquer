import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CartPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get data from navigation state
  const { 
    cart: initialCart = [], 
    restaurantId: stateRestaurantId,
    tableId: stateTableId,
    tableNumber: stateTableNumber 
  } = location.state || {};

  const [cart, setCart] = useState(initialCart || []);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableNumber, setTableNumber] = useState(stateTableNumber || '');

  // Get IDs from URL params or state
  const restaurantId = searchParams.get('restaurant_id') || stateRestaurantId;
  const tableId = searchParams.get('table_id') || stateTableId;

  // Fetch table number if not provided
  useEffect(() => {
    const fetchTableNumber = async () => {
      if (tableId && !tableNumber) {
        try {
          const response = await axios.get(`${API}/tables/${tableId}`);
          setTableNumber(response.data.table_number || tableId.slice(-4));
        } catch (error) {
          console.error('Error fetching table:', error);
          setTableNumber(tableId.slice(-4));
        }
      }
    };
    fetchTableNumber();
  }, [tableId, tableNumber]);

  // Calculate item total (price + extras) * quantity
  const getItemTotal = (item) => {
    const basePrice = item.price || 0;
    const extrasTotal = (item.extras || []).reduce((sum, e) => sum + (e.price || 0), 0);
    const quantity = item.quantity || 1;
    return (basePrice + extrasTotal) * quantity;
  };

  // Calculate cart total
  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + getItemTotal(item), 0);
  };

  // Get total items count
  const getItemsCount = () => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  // Update item quantity
  const updateQuantity = (index, delta) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity = (updated[index].quantity || 1) + delta;
      if (updated[index].quantity <= 0) {
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      // Format items for the order
      const orderItems = cart.map(item => ({
        product_id: item.product_id || item.id,
        product_name: item.product_name || item.name,
        quantity: item.quantity || 1,
        price: item.price || 0,
        extras: item.extras || [],
        notes: item.notes || ''
      }));

      const total = getCartTotal();

      // Create order
      const orderResponse = await axios.post(`${API}/orders`, {
        restaurant_id: restaurantId,
        table_id: tableId,
        table_number: tableNumber,
        items: orderItems,
        total,
        notes
      });

      const orderId = orderResponse.data.id;

      // Navigate to order tracking
      navigate(`/order-tracking?order_id=${orderId}`);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      alert('Erro ao criar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Handle empty cart or no state
  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#18181B] mb-2">Carrinho Vazio</h2>
          <p className="text-[#71717A] mb-6">Adicione itens ao seu carrinho</p>
          <button
            data-testid="back-to-menu-button"
            onClick={() => navigate(`/menu?restaurant_id=${restaurantId}&table_id=${tableId}`)}
            className="bg-[#FF5500] hover:bg-[#CC4400] text-white px-6 py-3 rounded-full font-bold transition-all"
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              data-testid="back-button"
              onClick={() => navigate(`/menu?restaurant_id=${restaurantId}&table_id=${tableId}`, {
                state: { cart, restaurantId, tableId, tableNumber }
              })}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#18181B]">Carrinho</h1>
              <p className="text-sm text-[#71717A]">{getItemsCount()} item{getItemsCount() !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cart.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex gap-4">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.product_name || item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-[#18181B]">{item.product_name || item.name}</h3>
                  
                  {/* Extras */}
                  {item.extras && item.extras.length > 0 && (
                    <p className="text-sm text-[#71717A] mt-1">
                      + {item.extras.map(e => e.name).join(', ')}
                    </p>
                  )}
                  
                  {/* Notes */}
                  {item.notes && (
                    <p className="text-sm text-[#71717A] mt-1 italic">Obs: {item.notes}</p>
                  )}
                  
                  {/* Price and Quantity */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-[#FF5500]">
                      €{getItemTotal(item).toFixed(2)}
                    </span>
                    
                    <div className="flex items-center gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                        <button
                          data-testid={`decrease-quantity-${index}`}
                          onClick={() => updateQuantity(index, -1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#FF5500] transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold">{item.quantity || 1}</span>
                        <button
                          data-testid={`increase-quantity-${index}`}
                          onClick={() => updateQuantity(index, 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#FF5500] transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        data-testid={`remove-item-${index}`}
                        onClick={() => removeFromCart(index)}
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Notes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <h3 className="font-bold text-lg mb-3">Observações do Pedido</h3>
          <textarea
            data-testid="order-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguma observação para o seu pedido?"
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-[#71717A]">
              <span>Subtotal ({getItemsCount()} itens)</span>
              <span>€{getCartTotal().toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-xl font-bold text-[#18181B]">
              <span>Total</span>
              <span className="text-[#FF5500]">€{getCartTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-4 left-4 right-4 z-50">
        <button
          data-testid="checkout-button"
          onClick={handleCheckout}
          disabled={loading || cart.length === 0}
          className="w-full bg-[#FF5500] hover:bg-[#CC4400] text-white rounded-full py-4 px-6 font-bold shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'A processar...' : `Finalizar Pedido • €${getCartTotal().toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

export default CartPage;
