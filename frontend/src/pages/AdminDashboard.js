import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  QrCode,
  LogOut,
  TrendingUp,
  Clock,
  Euro,
  CheckCircle,
  ChefHat,
  Package,
  Bell
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import MenuManagement from './MenuManagement';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, joinRestaurant } = useSocket();

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
      return;
    }
    loadData();
    if (socket) {
      joinRestaurant(user.restaurant_id);
    }
  }, [user, socket]);

  useEffect(() => {
    if (socket && user) {
      socket.on('new_order', (data) => {
        if (data.restaurant_id === user.restaurant_id) {
          loadOrders();
          loadStats();
        }
      });

      socket.on('waiter_called', (data) => {
        if (data.restaurant_id === user.restaurant_id) {
          loadWaiterCalls();
        }
      });

      return () => {
        socket.off('new_order');
        socket.off('waiter_called');
      };
    }
  }, [socket, user]);

  const loadData = async () => {
    await Promise.all([loadStats(), loadOrders(), loadWaiterCalls()]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API}/stats/restaurant/${user.restaurant_id}`);
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders/restaurant/${user.restaurant_id}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  const loadWaiterCalls = async () => {
    try {
      const response = await axios.get(`${API}/call-waiter/restaurant/${user.restaurant_id}`);
      setWaiterCalls(response.data);
    } catch (error) {
      console.error('Erro ao carregar chamadas:', error);
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status: newStatus });
      loadOrders();
      loadStats();
    } catch (error) {
      console.error('Erro ao atualizar estado:', error);
    }
  };

  const handleResolveWaiterCall = async (callId) => {
    try {
      await axios.put(`${API}/call-waiter/${callId}/resolve`);
      loadWaiterCalls();
    } catch (error) {
      console.error('Erro ao resolver chamada:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    const colors = {
      received: 'bg-blue-100 text-blue-700',
      preparing: 'bg-orange-100 text-orange-700',
      ready: 'bg-green-100 text-green-700',
      delivered: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status) => {
    const texts = {
      received: 'Recebido',
      preparing: 'Em Preparação',
      ready: 'Pronto',
      delivered: 'Entregue'
    };
    return texts[status] || status;
  };

  const activeOrders = orders.filter(o => ['received', 'preparing', 'ready'].includes(o.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F3F4F6]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5500]"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#FF5500] rounded-full flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[#18181B]">Menu QR</h2>
              <p className="text-xs text-[#71717A]">{user?.name}</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              data-testid="dashboard-tab"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-orange-50 text-[#FF5500]'
                  : 'text-[#71717A] hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              data-testid="orders-tab"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'orders'
                  ? 'bg-orange-50 text-[#FF5500]'
                  : 'text-[#71717A] hover:bg-gray-50'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="font-medium">Pedidos</span>
              {activeOrders.length > 0 && (
                <span className="ml-auto bg-[#FF5500] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeOrders.length}
                </span>
              )}
            </button>

            <button
              data-testid="menu-tab"
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'menu'
                  ? 'bg-orange-50 text-[#FF5500]'
                  : 'text-[#71717A] hover:bg-gray-50'
              }`}
            >
              <UtensilsCrossed className="w-5 h-5" />
              <span className="font-medium">Menu</span>
            </button>

            <button
              data-testid="tables-tab"
              onClick={() => setActiveTab('tables')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'tables'
                  ? 'bg-orange-50 text-[#FF5500]'
                  : 'text-[#71717A] hover:bg-gray-50'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span className="font-medium">Mesas</span>
            </button>
          </nav>
        </div>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
          <button
            data-testid="logout-button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold text-[#18181B] mb-8">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#18181B] mb-1">{stats?.total_orders_today || 0}</p>
                <p className="text-sm text-[#71717A]">Pedidos Hoje</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Euro className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#18181B] mb-1">€{(stats?.revenue_today || 0).toFixed(2)}</p>
                <p className="text-sm text-[#71717A]">Faturação Hoje</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#18181B] mb-1">{stats?.active_orders || 0}</p>
                <p className="text-sm text-[#71717A]">Pedidos Ativos</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#18181B] mb-1">{waiterCalls.length}</p>
                <p className="text-sm text-[#71717A]">Chamadas Pendentes</p>
              </motion.div>
            </div>

            {/* Waiter Calls */}
            {waiterCalls.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                <h2 className="text-xl font-bold text-[#18181B] mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-600" />
                  Chamadas de Empregado
                </h2>
                <div className="space-y-3">
                  {waiterCalls.map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-bold text-red-900">Mesa {call.table_number}</p>
                        <p className="text-sm text-red-700">{new Date(call.created_at).toLocaleTimeString('pt-PT')}</p>
                      </div>
                      <button
                        onClick={() => handleResolveWaiterCall(call.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                      >
                        Resolver
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Orders */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-[#18181B] mb-4">Pedidos Ativos</h2>
              {activeOrders.length === 0 ? (
                <p className="text-[#71717A] text-center py-8">Nenhum pedido ativo</p>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleOrderStatusUpdate}
                      getStatusColor={getStatusColor}
                      getStatusText={getStatusText}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h1 className="text-3xl font-bold text-[#18181B] mb-8">Todos os Pedidos</h1>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              {orders.length === 0 ? (
                <p className="text-[#71717A] text-center py-8">Nenhum pedido</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleOrderStatusUpdate}
                      getStatusColor={getStatusColor}
                      getStatusText={getStatusText}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Menu & Tables Tabs */}
        {activeTab === 'menu' && <MenuManagement />}

        {activeTab === 'tables' && (
          <div>
            <h1 className="text-3xl font-bold text-[#18181B] mb-8">Gestão de Mesas</h1>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-[#71717A]">Funcionalidade em desenvolvimento</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OrderCard = ({ order, onStatusUpdate, getStatusColor, getStatusText }) => {
  const statusOptions = ['received', 'preparing', 'ready', 'delivered'];
  const currentIndex = statusOptions.indexOf(order.status);
  const nextStatus = statusOptions[currentIndex + 1];

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-lg text-[#18181B]">Pedido #{order.id.slice(-8)}</p>
          <p className="text-sm text-[#71717A]">Mesa {order.table_number} • {new Date(order.created_at).toLocaleTimeString('pt-PT')}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {getStatusText(order.status)}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        {order.items.map((item, index) => (
          <p key={index} className="text-sm text-[#71717A]">
            {item.quantity}x {item.product_name}
            {item.extras && item.extras.length > 0 && ` (+ ${item.extras.map(e => e.name).join(', ')})`}
          </p>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="font-bold text-lg text-[#FF5500]">€{order.total.toFixed(2)}</span>
        {nextStatus && order.status !== 'delivered' && (
          <button
            data-testid={`update-order-${order.id}`}
            onClick={() => onStatusUpdate(order.id, nextStatus)}
            className="bg-[#FF5500] hover:bg-[#CC4400] text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
          >
            Marcar como {getStatusText(nextStatus)}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
