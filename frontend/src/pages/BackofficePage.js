import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Mail,
  Phone,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Search,
  Filter,
  ChevronDown,
  Building2,
  CreditCard,
  Loader2,
  Send,
  Reply,
  History,
  Plus,
  Store,
  UserPlus,
  DollarSign,
  Save,
  Edit2,
  GripVertical,
  Sparkles,
  Shield,
  RefreshCw,
  ArrowLeft,
  ListChecks,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios to send cookies
axios.defaults.withCredentials = true;

// ZentraQR Brand Colors
const colors = {
  primary: '#1E2A4A',
  secondary: '#3B5998',
  accent: '#1a2342',
  dark: '#1E2A4A',
  light: '#F8FAFC',
  white: '#FFFFFF',
  gray: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
};

// Reusable Components
const SectionHeader = ({ title, description, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: colors.dark }}>{title}</h1>
      {description && <p className="text-sm mt-1" style={{ color: colors.gray }}>{description}</p>}
    </div>
    {children}
  </div>
);

const StatCard = ({ icon: Icon, value, label, color = colors.primary, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-5 lg:p-6 rounded-2xl border shadow-sm"
    style={{ borderColor: colors.border }}
  >
    <div className="flex items-center justify-between mb-3">
      <div 
        className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}10` }}
      >
        <Icon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color }} />
      </div>
    </div>
    <p className="text-2xl lg:text-3xl font-bold" style={{ color: colors.dark }}>{value}</p>
    <p className="text-sm" style={{ color: colors.gray }}>{label}</p>
  </motion.div>
);

const Panel = ({ children, className = '' }) => (
  <div 
    className={`bg-white rounded-2xl border shadow-sm ${className}`}
    style={{ borderColor: colors.border }}
  >
    {children}
  </div>
);

const SidebarButton = ({ active, icon: Icon, label, badge, onClick, testId }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
      active ? 'text-white shadow-md' : 'hover:bg-slate-50'
    }`}
    style={active ? { backgroundColor: colors.primary, color: colors.white } : { color: colors.gray }}
    data-testid={testId}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span 
        className="ml-auto text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
        style={active ? { backgroundColor: 'rgba(255,255,255,0.2)', color: colors.white } : { backgroundColor: colors.success, color: colors.white }}
      >
        {badge}
      </span>
    )}
    {badge !== undefined && badge === 0 && null}
  </button>
);

const ModalShell = ({ title, subtitle, children, onClose, maxWidth = 'max-w-lg' }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-hidden`}
    >
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border }}>
        <div>
          <h2 className="text-xl font-bold" style={{ color: colors.dark }}>{title}</h2>
          {subtitle && <p className="text-sm mt-0.5" style={{ color: colors.gray }}>{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          style={{ color: colors.gray }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </motion.div>
  </div>
);

const BackofficePage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Reply state
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyData, setReplyData] = useState({ subject: '', message: '' });
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [replySuccess, setReplySuccess] = useState(false);
  const [contactMessages, setContactMessages] = useState([]);
  const [showMessagesModal, setShowMessagesModal] = useState(false);

  // Restaurants state
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantAdmins, setRestaurantAdmins] = useState([]);
  const [newRestaurant, setNewRestaurant] = useState({
    restaurant_name: '',
    description: '',
    address: '',
    phone: '',
    admin_name: '',
    admin_email: '',
    admin_password: ''
  });
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [savingRestaurant, setSavingRestaurant] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);

  // Pricing state
  const [pricing, setPricing] = useState({
    starter: { 
      monthly_price: 29, 
      annual_price: 276,
      features: [
        { key: "tables", value: "10", label: "Até 10 mesas" },
        { key: "menu", value: "unlimited", label: "Menu ilimitado" },
        { key: "dashboard", value: "basic", label: "Dashboard básico" },
        { key: "support", value: "email", label: "Suporte por email" }
      ]
    },
    pro: { 
      monthly_price: 59, 
      annual_price: 564,
      features: [
        { key: "tables", value: "30", label: "Até 30 mesas" },
        { key: "menu", value: "unlimited", label: "Menu ilimitado" },
        { key: "dashboard", value: "advanced", label: "Dashboard avançado" },
        { key: "payments", value: "online", label: "Pagamentos online" },
        { key: "notifications", value: "realtime", label: "Notificações em tempo real" },
        { key: "support", value: "priority", label: "Suporte prioritário" }
      ]
    },
    enterprise: {
      monthly_price: null,
      annual_price: null,
      features: [
        { key: "tables", value: "unlimited", label: "Mesas ilimitadas" },
        { key: "restaurants", value: "multi", label: "Multi-restaurantes" },
        { key: "api", value: "custom", label: "API personalizada" },
        { key: "integrations", value: "full", label: "Integrações" },
        { key: "manager", value: "dedicated", label: "Gestor dedicado" },
        { key: "sla", value: "guaranteed", label: "SLA garantido" }
      ]
    }
  });
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [pricingSaved, setPricingSaved] = useState(false);

  // Launch Settings state
  const [launchSettings, setLaunchSettings] = useState({
    plans_sales_enabled: true,
    landing_mode: 'plans'
  });
  const [loadingLaunchSettings, setLoadingLaunchSettings] = useState(false);
  const [savingLaunchSettings, setSavingLaunchSettings] = useState(false);
  const [launchSettingsSaved, setLaunchSettingsSaved] = useState(false);

  // Waitlist state
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);

  // Emails state
  const [emails, setEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/backoffice/auth/me`);
      if (response.data.authenticated) {
        setIsAuthenticated(true);
        loadAllData();
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadAllData = () => {
    loadContacts();
    loadRestaurants();
    loadPricing();
    loadLaunchSettings();
    loadEmails();
    loadWaitlist();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      await axios.post(`${API}/backoffice/auth/login`, { password });
      setIsAuthenticated(true);
      loadAllData();
    } catch (error) {
      setLoginError(error.response?.data?.detail || 'Senha incorreta');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/backoffice/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      navigate('/');
    }
  };

  // Handle 401 errors globally
  const handleApiError = useCallback((error) => {
    if (error.response?.status === 401) {
      setIsAuthenticated(false);
    }
    throw error;
  }, []);

  const loadPricing = async () => {
    setLoadingPricing(true);
    try {
      const response = await axios.get(`${API}/backoffice/pricing`);
      setPricing(response.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingPricing(false);
    }
  };

  const savePricing = async () => {
    setSavingPricing(true);
    try {
      await axios.put(`${API}/backoffice/pricing`, pricing);
      setPricingSaved(true);
      setTimeout(() => setPricingSaved(false), 3000);
    } catch (error) {
      handleApiError(error);
      alert('Erro ao guardar preços');
    } finally {
      setSavingPricing(false);
    }
  };

  const loadLaunchSettings = async () => {
    setLoadingLaunchSettings(true);
    try {
      const response = await axios.get(`${API}/settings/global`);
      setLaunchSettings({
        plans_sales_enabled: response.data.plans_sales_enabled ?? true,
        landing_mode: response.data.landing_mode ?? 'plans'
      });
    } catch (error) {
      console.error('Erro ao carregar configurações de lançamento:', error);
    } finally {
      setLoadingLaunchSettings(false);
    }
  };

  const saveLaunchSettings = async () => {
    setSavingLaunchSettings(true);
    try {
      await axios.put(`${API}/backoffice/settings/global`, launchSettings);
      setLaunchSettingsSaved(true);
      setTimeout(() => setLaunchSettingsSaved(false), 3000);
    } catch (error) {
      handleApiError(error);
      alert('Erro ao guardar configurações de lançamento');
    } finally {
      setSavingLaunchSettings(false);
    }
  };

  // Waitlist functions
  const loadWaitlist = async () => {
    setLoadingWaitlist(true);
    try {
      const response = await axios.get(`${API}/backoffice/waitlist`);
      setWaitlistEntries(response.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingWaitlist(false);
    }
  };

  const updateWaitlistStatus = async (entryId, status) => {
    try {
      await axios.put(`${API}/backoffice/waitlist/${entryId}/status`, { status });
      setWaitlistEntries(waitlistEntries.map(e => 
        e.id === entryId ? { ...e, status } : e
      ));
    } catch (error) {
      handleApiError(error);
      alert('Erro ao atualizar status');
    }
  };

  const deleteWaitlistEntry = async (entryId) => {
    if (!window.confirm('Tem certeza que deseja eliminar esta entrada?')) return;
    
    try {
      await axios.delete(`${API}/backoffice/waitlist/${entryId}`);
      setWaitlistEntries(waitlistEntries.filter(e => e.id !== entryId));
    } catch (error) {
      handleApiError(error);
      alert('Erro ao eliminar entrada');
    }
  };

  const loadEmails = async () => {
    setLoadingEmails(true);
    try {
      const response = await axios.get(`${API}/backoffice/emails`);
      setEmails(response.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingEmails(false);
    }
  };

  const viewEmail = async (emailId) => {
    try {
      const response = await axios.get(`${API}/backoffice/emails/${emailId}`);
      setSelectedEmail(response.data);
      setShowEmailModal(true);
    } catch (error) {
      handleApiError(error);
      alert('Erro ao carregar email');
    }
  };

  const loadContacts = async () => {
    try {
      const response = await axios.get(`${API}/contacts`);
      setContacts(response.data);
    } catch (error) {
      console.error('Erro ao carregar contactos:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const updateContactStatus = async (contactId, status) => {
    try {
      await axios.put(`${API}/contacts/${contactId}/status`, { status });
      setContacts(contacts.map(c => 
        c.id === contactId ? { ...c, status } : c
      ));
      if (selectedContact?.id === contactId) {
        setSelectedContact({ ...selectedContact, status });
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const deleteContact = async (contactId) => {
    if (!window.confirm('Tem certeza que deseja eliminar este contacto?')) return;
    
    try {
      await axios.delete(`${API}/contacts/${contactId}`);
      setContacts(contacts.filter(c => c.id !== contactId));
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
    } catch (error) {
      console.error('Erro ao eliminar contacto:', error);
    }
  };

  const loadRestaurants = async () => {
    setLoadingRestaurants(true);
    try {
      const response = await axios.get(`${API}/backoffice/restaurants`);
      setRestaurants(response.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const createRestaurant = async () => {
    if (!newRestaurant.restaurant_name || !newRestaurant.admin_email || !newRestaurant.admin_password) {
      alert('Por favor preencha os campos obrigatórios');
      return;
    }
    
    setSavingRestaurant(true);
    try {
      await axios.post(`${API}/backoffice/restaurants`, newRestaurant);
      setShowAddRestaurantModal(false);
      setNewRestaurant({
        restaurant_name: '',
        description: '',
        address: '',
        phone: '',
        admin_name: '',
        admin_email: '',
        admin_password: ''
      });
      loadRestaurants();
    } catch (error) {
      handleApiError(error);
      alert('Erro ao criar restaurante: ' + (error.response?.data?.detail || 'Tente novamente'));
    } finally {
      setSavingRestaurant(false);
    }
  };

  const deleteRestaurant = async (restaurantId, restaurantName) => {
    if (!window.confirm(`Tem certeza que deseja eliminar o restaurante "${restaurantName}" e TODOS os dados associados? Esta ação é irreversível!`)) return;
    
    try {
      await axios.delete(`${API}/backoffice/restaurants/${restaurantId}`);
      loadRestaurants();
    } catch (error) {
      handleApiError(error);
      alert('Erro ao eliminar restaurante');
    }
  };

  const loadRestaurantAdmins = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    try {
      const response = await axios.get(`${API}/backoffice/restaurants/${restaurant.id}/admins`);
      setRestaurantAdmins(response.data);
    } catch (error) {
      handleApiError(error);
    }
  };

  const addAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.name) {
      alert('Por favor preencha todos os campos');
      return;
    }
    
    setSavingAdmin(true);
    try {
      await axios.post(`${API}/backoffice/restaurants/${selectedRestaurant.id}/admins`, newAdmin);
      setShowAddAdminModal(false);
      setNewAdmin({ name: '', email: '', password: '' });
      loadRestaurantAdmins(selectedRestaurant);
      loadRestaurants();
    } catch (error) {
      handleApiError(error);
      alert('Erro: ' + (error.response?.data?.detail || 'Tente novamente'));
    } finally {
      setSavingAdmin(false);
    }
  };

  const deleteAdmin = async (userId, userName) => {
    if (!window.confirm(`Tem certeza que deseja eliminar o administrador "${userName}"?`)) return;
    
    try {
      await axios.delete(`${API}/backoffice/admins/${userId}`);
      loadRestaurantAdmins(selectedRestaurant);
      loadRestaurants();
    } catch (error) {
      handleApiError(error);
      alert('Erro ao eliminar administrador');
    }
  };

  const openReplyModal = (contact) => {
    setReplyData({
      subject: `Re: Contacto de ${contact.name}`,
      message: ''
    });
    setReplyError('');
    setReplySuccess(false);
    setShowReplyModal(true);
  };

  const sendReply = async () => {
    if (!replyData.subject.trim() || !replyData.message.trim()) {
      setReplyError('Por favor, preencha o assunto e a mensagem.');
      return;
    }

    setSendingReply(true);
    setReplyError('');

    try {
      await axios.post(`${API}/contacts/${selectedContact.id}/reply`, {
        subject: replyData.subject,
        message: replyData.message
      });
      
      setReplySuccess(true);
      
      if (selectedContact.status === 'new') {
        setContacts(contacts.map(c => 
          c.id === selectedContact.id ? { ...c, status: 'contacted' } : c
        ));
        setSelectedContact({ ...selectedContact, status: 'contacted' });
      }
      
      setTimeout(() => {
        setShowReplyModal(false);
        setReplySuccess(false);
      }, 2000);
    } catch (error) {
      setReplyError(error.response?.data?.detail || 'Erro ao enviar email. Verifique a configuração.');
    } finally {
      setSendingReply(false);
    }
  };

  const loadContactMessages = async (contactId) => {
    try {
      const response = await axios.get(`${API}/contacts/${contactId}/messages`);
      setContactMessages(response.data);
      setShowMessagesModal(true);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      new: 'bg-blue-50 text-blue-700 border-blue-200',
      contacted: 'bg-amber-50 text-amber-700 border-amber-200',
      converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      closed: 'bg-slate-100 text-slate-600 border-slate-200'
    };
    return statusColors[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      new: 'Novo',
      contacted: 'Contactado',
      converted: 'Convertido',
      closed: 'Fechado'
    };
    return statusTexts[status] || status;
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.phone && contact.phone.includes(searchTerm));
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: contacts.length,
    new: contacts.filter(c => c.status === 'new').length,
    contacted: contacts.filter(c => c.status === 'contacted').length,
    converted: contacts.filter(c => c.status === 'converted').length
  };

  // Loading state
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.light }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: colors.light }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-5"
            style={{ backgroundColor: colors.primary }}
          />
          <div 
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5"
            style={{ backgroundColor: colors.secondary }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8 lg:p-10 w-full max-w-md relative z-10 border"
          style={{ borderColor: colors.border }}
        >
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: `${colors.primary}08`, color: colors.primary }}
            >
              <Shield className="w-4 h-4" />
              Backoffice ZentraQR
            </span>
          </div>

          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/logo.png" 
              alt="ZentraQR" 
              className="h-12 mx-auto mb-4"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: colors.dark }}>
              Área Administrativa
            </h1>
            <p className="mt-2" style={{ color: colors.gray }}>
              Acesso restrito a administradores
            </p>
          </div>

          {loginError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl text-sm text-center border"
              style={{ backgroundColor: colors.dangerBg, color: colors.danger, borderColor: `${colors.danger}20` }}
            >
              {loginError}
            </motion.div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>
                Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full px-5 py-4 rounded-2xl border-2 focus:outline-none transition-all text-base"
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: colors.light
                }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
                data-testid="backoffice-password"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-4 rounded-full font-semibold text-white transition-all hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ backgroundColor: colors.primary }}
              data-testid="backoffice-login"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  A autenticar...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 py-3 font-medium flex items-center justify-center gap-2 rounded-full hover:bg-slate-50 transition-all"
            style={{ color: colors.gray }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: colors.light }}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        w-72 bg-white border-r h-screen overflow-y-auto
        fixed lg:static
        z-50
        transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ borderColor: colors.border }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="ZentraQR" 
                className="h-10"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="w-10 h-10 rounded-xl items-center justify-center hidden"
                style={{ backgroundColor: colors.primary }}
              >
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold" style={{ color: colors.dark }}>ZentraQR</h2>
                <p className="text-xs" style={{ color: colors.gray }}>Backoffice</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
              style={{ color: colors.gray }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <SidebarButton
              active={activeTab === 'dashboard'}
              icon={LayoutDashboard}
              label="Dashboard"
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              testId="backoffice-dashboard-tab"
            />
            <SidebarButton
              active={activeTab === 'contacts'}
              icon={Users}
              label="Contactos"
              badge={stats.new}
              onClick={() => { setActiveTab('contacts'); setSidebarOpen(false); }}
              testId="backoffice-contacts-tab"
            />
            <SidebarButton
              active={activeTab === 'clients'}
              icon={CreditCard}
              label="Clientes & Planos"
              onClick={() => { setActiveTab('clients'); setSidebarOpen(false); }}
              testId="backoffice-clients-tab"
            />
            <SidebarButton
              active={activeTab === 'restaurants'}
              icon={Store}
              label="Restaurantes"
              onClick={() => { setActiveTab('restaurants'); setSidebarOpen(false); loadRestaurants(); }}
              testId="backoffice-restaurants-tab"
            />
            <SidebarButton
              active={activeTab === 'launch'}
              icon={Sparkles}
              label="Lançamento"
              onClick={() => { setActiveTab('launch'); setSidebarOpen(false); }}
              testId="backoffice-launch-tab"
            />
            <SidebarButton
              active={activeTab === 'waitlist'}
              icon={ListChecks}
              label="Whitelist"
              badge={waitlistEntries.filter(e => e.status === 'new').length}
              onClick={() => { setActiveTab('waitlist'); setSidebarOpen(false); loadWaitlist(); }}
              testId="backoffice-waitlist-tab"
            />
            <SidebarButton
              active={activeTab === 'emails'}
              icon={Mail}
              label="Emails Enviados"
              onClick={() => { setActiveTab('emails'); setSidebarOpen(false); loadEmails(); }}
              testId="backoffice-emails-tab"
            />
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 w-72 p-6 border-t" style={{ borderColor: colors.border }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium hover:bg-red-50"
            style={{ color: colors.danger }}
            data-testid="backoffice-logout"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: colors.border }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-all"
          >
            <Menu className="w-6 h-6" style={{ color: colors.dark }} />
          </button>
          <span className="font-bold" style={{ color: colors.dark }}>ZentraQR Backoffice</span>
          <div className="w-10" />
        </div>

        <div className="p-4 lg:p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <SectionHeader 
                title="Dashboard" 
                description="Visão geral do sistema"
              />
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                <StatCard 
                  icon={Users} 
                  value={stats.total} 
                  label="Total Contactos" 
                  color={colors.secondary}
                  delay={0}
                />
                <StatCard 
                  icon={Clock} 
                  value={stats.new} 
                  label="Novos" 
                  color="#3B82F6"
                  delay={0.1}
                />
                <StatCard 
                  icon={MessageSquare} 
                  value={stats.contacted} 
                  label="Contactados" 
                  color={colors.warning}
                  delay={0.2}
                />
                <StatCard 
                  icon={CheckCircle} 
                  value={stats.converted} 
                  label="Convertidos" 
                  color={colors.success}
                  delay={0.3}
                />
              </div>

              {/* Quick Stats */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Panel className="p-6">
                  <h2 className="text-lg font-bold mb-4" style={{ color: colors.dark }}>
                    Contactos Recentes
                  </h2>
                  {contacts.slice(0, 5).map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: colors.border }}>
                      <div>
                        <p className="font-medium" style={{ color: colors.dark }}>{contact.name}</p>
                        <p className="text-sm" style={{ color: colors.gray }}>{contact.email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(contact.status)}`}>
                        {getStatusText(contact.status)}
                      </span>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <p className="text-center py-8" style={{ color: colors.gray }}>Nenhum contacto ainda</p>
                  )}
                </Panel>

                <Panel className="p-6">
                  <h2 className="text-lg font-bold mb-4" style={{ color: colors.dark }}>
                    Restaurantes ({restaurants.length})
                  </h2>
                  {restaurants.slice(0, 5).map((restaurant) => (
                    <div key={restaurant.id} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: colors.border }}>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${colors.primary}10` }}
                        >
                          <Store className="w-5 h-5" style={{ color: colors.primary }} />
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>{restaurant.name}</p>
                          <p className="text-xs" style={{ color: colors.gray }}>{restaurant.admin_count || 0} admin(s)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {restaurants.length === 0 && (
                    <p className="text-center py-8" style={{ color: colors.gray }}>Nenhum restaurante ainda</p>
                  )}
                </Panel>
              </div>
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div>
              <SectionHeader title="Contactos" description="Gerir leads e contactos">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.gray }} />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-2.5 rounded-xl border-2 focus:outline-none transition-all"
                      style={{ borderColor: colors.border, backgroundColor: colors.white }}
                      onFocus={(e) => e.target.style.borderColor = colors.primary}
                      onBlur={(e) => e.target.style.borderColor = colors.border}
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border-2 focus:outline-none transition-all appearance-none cursor-pointer"
                    style={{ borderColor: colors.border, backgroundColor: colors.white, color: colors.dark }}
                  >
                    <option value="all">Todos</option>
                    <option value="new">Novos</option>
                    <option value="contacted">Contactados</option>
                    <option value="converted">Convertidos</option>
                    <option value="closed">Fechados</option>
                  </select>
                </div>
              </SectionHeader>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Contacts List */}
                <Panel className="lg:col-span-2 overflow-hidden">
                  {loadingContacts ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: colors.gray }} />
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: colors.gray }}>
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Nenhum contacto encontrado</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: colors.border }}>
                      {filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${
                            selectedContact?.id === contact.id ? 'bg-slate-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium" style={{ color: colors.dark }}>{contact.name}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(contact.status)}`}>
                                  {getStatusText(contact.status)}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm" style={{ color: colors.gray }}>
                                <span className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {contact.email}
                                </span>
                                {contact.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {contact.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs" style={{ color: colors.gray }}>
                              {new Date(contact.created_at).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                {/* Contact Details */}
                <Panel className="p-6">
                  {selectedContact ? (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold" style={{ color: colors.dark }}>Detalhes</h2>
                        <button
                          onClick={() => deleteContact(selectedContact.id)}
                          className="p-2 rounded-xl hover:bg-red-50 transition-all"
                          style={{ color: colors.danger }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div>
                          <p className="text-sm mb-1" style={{ color: colors.gray }}>Nome</p>
                          <p className="font-medium" style={{ color: colors.dark }}>{selectedContact.name}</p>
                        </div>
                        <div>
                          <p className="text-sm mb-1" style={{ color: colors.gray }}>Email</p>
                          <a href={`mailto:${selectedContact.email}`} className="font-medium" style={{ color: colors.secondary }}>
                            {selectedContact.email}
                          </a>
                        </div>
                        {selectedContact.phone && (
                          <div>
                            <p className="text-sm mb-1" style={{ color: colors.gray }}>Telefone</p>
                            <a href={`tel:${selectedContact.phone}`} className="font-medium" style={{ color: colors.secondary }}>
                              {selectedContact.phone}
                            </a>
                          </div>
                        )}
                        <div>
                          <p className="text-sm mb-1" style={{ color: colors.gray }}>Data</p>
                          <p className="font-medium" style={{ color: colors.dark }}>
                            {new Date(selectedContact.created_at).toLocaleString('pt-PT')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm mb-1" style={{ color: colors.gray }}>Mensagem</p>
                          <p className="text-sm p-3 rounded-xl" style={{ backgroundColor: colors.light, color: colors.dark }}>
                            {selectedContact.message}
                          </p>
                        </div>
                      </div>

                      {/* Status Actions */}
                      <div>
                        <p className="text-sm mb-2" style={{ color: colors.gray }}>Alterar Status</p>
                        <div className="grid grid-cols-2 gap-2">
                          {['new', 'contacted', 'converted', 'closed'].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateContactStatus(selectedContact.id, status)}
                              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                                selectedContact.status === status
                                  ? getStatusColor(status)
                                  : 'border-transparent hover:bg-slate-100'
                              }`}
                              style={selectedContact.status !== status ? { color: colors.gray } : {}}
                            >
                              {getStatusText(status)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reply & History Actions */}
                      <div className="mt-6 pt-6 border-t space-y-3" style={{ borderColor: colors.border }}>
                        <button
                          onClick={() => openReplyModal(selectedContact)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: colors.success }}
                          data-testid="reply-button"
                        >
                          <Reply className="w-5 h-5" />
                          Responder por Email
                        </button>
                        <button
                          onClick={() => loadContactMessages(selectedContact.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border transition-all hover:bg-slate-50"
                          style={{ borderColor: colors.border, color: colors.dark }}
                          data-testid="history-button"
                        >
                          <History className="w-5 h-5" />
                          Ver Histórico
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8" style={{ color: colors.gray }}>
                      <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Selecione um contacto para ver os detalhes</p>
                    </div>
                  )}
                </Panel>
              </div>
            </div>
          )}

          {/* Clients & Plans Tab */}
          {activeTab === 'clients' && (
            <div>
              <SectionHeader title="Gestão de Planos" description="Configure os planos e suas características">
                {pricingSaved && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: colors.successBg, color: colors.success }}>
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Guardado!</span>
                  </div>
                )}
              </SectionHeader>

              {loadingPricing ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Starter Plan */}
                  <Panel className="overflow-hidden">
                    <div className="p-6 border-b" style={{ borderColor: colors.border, backgroundColor: `${colors.secondary}05` }}>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: colors.secondary }}
                        >
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold" style={{ color: colors.dark }}>Plano Starter</h2>
                          <p className="text-sm" style={{ color: colors.gray }}>Para pequenos restaurantes</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Preço Mensal (€)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: colors.gray }}>€</span>
                            <input
                              type="number"
                              step="0.01"
                              value={pricing.starter.monthly_price || ''}
                              onChange={(e) => setPricing({
                                ...pricing,
                                starter: { ...pricing.starter, monthly_price: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none text-lg font-semibold transition-all"
                              style={{ borderColor: colors.border }}
                              onFocus={(e) => e.target.style.borderColor = colors.primary}
                              onBlur={(e) => e.target.style.borderColor = colors.border}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Preço Anual (€)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: colors.gray }}>€</span>
                            <input
                              type="number"
                              step="0.01"
                              value={pricing.starter.annual_price || ''}
                              onChange={(e) => setPricing({
                                ...pricing,
                                starter: { ...pricing.starter, annual_price: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none text-lg font-semibold transition-all"
                              style={{ borderColor: colors.border }}
                              onFocus={(e) => e.target.style.borderColor = colors.primary}
                              onBlur={(e) => e.target.style.borderColor = colors.border}
                            />
                          </div>
                          <p className="text-xs mt-1" style={{ color: colors.gray }}>
                            Equivalente a €{((pricing.starter.annual_price || 0) / 12).toFixed(2)}/mês
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium" style={{ color: colors.dark }}>Características do Plano</label>
                          <button
                            onClick={() => {
                              const newFeature = { key: `feature_${Date.now()}`, value: "", label: "Nova característica" };
                              setPricing({
                                ...pricing,
                                starter: {
                                  ...pricing.starter,
                                  features: [...(pricing.starter.features || []), newFeature]
                                }
                              });
                            }}
                            className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all hover:bg-slate-100"
                            style={{ color: colors.primary }}
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(pricing.starter.features || []).map((feature, index) => (
                            <div key={feature.key} className="flex items-center gap-2 p-3 rounded-xl group" style={{ backgroundColor: colors.light }}>
                              <GripVertical className="w-4 h-4 opacity-30" />
                              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: colors.success }} />
                              <input
                                type="text"
                                value={feature.label}
                                onChange={(e) => {
                                  const newFeatures = [...pricing.starter.features];
                                  newFeatures[index] = { ...feature, label: e.target.value };
                                  setPricing({
                                    ...pricing,
                                    starter: { ...pricing.starter, features: newFeatures }
                                  });
                                }}
                                className="flex-1 bg-transparent border-none focus:outline-none"
                                style={{ color: colors.dark }}
                                placeholder="Descrição da característica"
                              />
                              <button
                                onClick={() => {
                                  const newFeatures = pricing.starter.features.filter((_, i) => i !== index);
                                  setPricing({
                                    ...pricing,
                                    starter: { ...pricing.starter, features: newFeatures }
                                  });
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-all"
                                style={{ color: colors.danger }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Panel>

                  {/* Pro Plan */}
                  <Panel className="overflow-hidden border-2" style={{ borderColor: colors.primary }}>
                    <div className="p-6 border-b" style={{ borderColor: colors.border, backgroundColor: `${colors.primary}05` }}>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold" style={{ color: colors.dark }}>Plano Pro</h2>
                          <p className="text-sm" style={{ color: colors.gray }}>O mais popular</p>
                        </div>
                        <span 
                          className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: colors.success }}
                        >
                          Mais Popular
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Preço Mensal (€)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: colors.gray }}>€</span>
                            <input
                              type="number"
                              step="0.01"
                              value={pricing.pro.monthly_price || ''}
                              onChange={(e) => setPricing({
                                ...pricing,
                                pro: { ...pricing.pro, monthly_price: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none text-lg font-semibold transition-all"
                              style={{ borderColor: colors.border }}
                              onFocus={(e) => e.target.style.borderColor = colors.primary}
                              onBlur={(e) => e.target.style.borderColor = colors.border}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Preço Anual (€)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: colors.gray }}>€</span>
                            <input
                              type="number"
                              step="0.01"
                              value={pricing.pro.annual_price || ''}
                              onChange={(e) => setPricing({
                                ...pricing,
                                pro: { ...pricing.pro, annual_price: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none text-lg font-semibold transition-all"
                              style={{ borderColor: colors.border }}
                              onFocus={(e) => e.target.style.borderColor = colors.primary}
                              onBlur={(e) => e.target.style.borderColor = colors.border}
                            />
                          </div>
                          <p className="text-xs mt-1" style={{ color: colors.gray }}>
                            Equivalente a €{((pricing.pro.annual_price || 0) / 12).toFixed(2)}/mês
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium" style={{ color: colors.dark }}>Características do Plano</label>
                          <button
                            onClick={() => {
                              const newFeature = { key: `feature_${Date.now()}`, value: "", label: "Nova característica" };
                              setPricing({
                                ...pricing,
                                pro: {
                                  ...pricing.pro,
                                  features: [...(pricing.pro.features || []), newFeature]
                                }
                              });
                            }}
                            className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all hover:bg-slate-100"
                            style={{ color: colors.primary }}
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(pricing.pro.features || []).map((feature, index) => (
                            <div key={feature.key} className="flex items-center gap-2 p-3 rounded-xl group" style={{ backgroundColor: colors.light }}>
                              <GripVertical className="w-4 h-4 opacity-30" />
                              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: colors.success }} />
                              <input
                                type="text"
                                value={feature.label}
                                onChange={(e) => {
                                  const newFeatures = [...pricing.pro.features];
                                  newFeatures[index] = { ...feature, label: e.target.value };
                                  setPricing({
                                    ...pricing,
                                    pro: { ...pricing.pro, features: newFeatures }
                                  });
                                }}
                                className="flex-1 bg-transparent border-none focus:outline-none"
                                style={{ color: colors.dark }}
                                placeholder="Descrição da característica"
                              />
                              <button
                                onClick={() => {
                                  const newFeatures = pricing.pro.features.filter((_, i) => i !== index);
                                  setPricing({
                                    ...pricing,
                                    pro: { ...pricing.pro, features: newFeatures }
                                  });
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-all"
                                style={{ color: colors.danger }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Panel>

                  {/* Enterprise Plan */}
                  <Panel className="overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-white" style={{ borderColor: colors.border }}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold" style={{ color: colors.dark }}>Plano Enterprise</h2>
                          <p className="text-sm" style={{ color: colors.gray }}>Para cadeias e franchises</p>
                        </div>
                        <span className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: colors.light, color: colors.gray }}>
                          Preço Personalizado
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: colors.light }}>
                        <p className="text-sm" style={{ color: colors.gray }}>
                          <strong>Nota:</strong> O plano Enterprise tem preço personalizado baseado nas necessidades do cliente. 
                          Configure apenas as características que serão incluídas.
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium" style={{ color: colors.dark }}>Características do Plano</label>
                          <button
                            onClick={() => {
                              const newFeature = { key: `feature_${Date.now()}`, value: "", label: "Nova característica" };
                              setPricing({
                                ...pricing,
                                enterprise: {
                                  ...pricing.enterprise,
                                  features: [...(pricing.enterprise?.features || []), newFeature]
                                }
                              });
                            }}
                            className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all hover:bg-slate-100"
                            style={{ color: colors.primary }}
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(pricing.enterprise?.features || []).map((feature, index) => (
                            <div key={feature.key} className="flex items-center gap-2 p-3 rounded-xl group" style={{ backgroundColor: colors.light }}>
                              <GripVertical className="w-4 h-4 opacity-30" />
                              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: colors.success }} />
                              <input
                                type="text"
                                value={feature.label}
                                onChange={(e) => {
                                  const newFeatures = [...(pricing.enterprise?.features || [])];
                                  newFeatures[index] = { ...feature, label: e.target.value };
                                  setPricing({
                                    ...pricing,
                                    enterprise: { ...pricing.enterprise, features: newFeatures }
                                  });
                                }}
                                className="flex-1 bg-transparent border-none focus:outline-none"
                                style={{ color: colors.dark }}
                                placeholder="Descrição da característica"
                              />
                              <button
                                onClick={() => {
                                  const newFeatures = (pricing.enterprise?.features || []).filter((_, i) => i !== index);
                                  setPricing({
                                    ...pricing,
                                    enterprise: { ...pricing.enterprise, features: newFeatures }
                                  });
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-all"
                                style={{ color: colors.danger }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Panel>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={savePricing}
                      disabled={savingPricing}
                      className="flex items-center gap-2 px-8 py-3 rounded-full font-medium text-white transition-all hover:shadow-lg disabled:opacity-50"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {savingPricing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Guardar Alterações
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Restaurants Tab */}
          {activeTab === 'restaurants' && (
            <div>
              <SectionHeader title="Restaurantes" description="Gerir restaurantes e administradores">
                <button
                  onClick={() => setShowAddRestaurantModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Plus className="w-5 h-5" />
                  Novo Restaurante
                </button>
              </SectionHeader>
              
              {loadingRestaurants ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
                </div>
              ) : restaurants.length === 0 ? (
                <Panel className="p-12 text-center">
                  <Store className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h2 className="text-xl font-bold mb-2" style={{ color: colors.dark }}>
                    Nenhum Restaurante
                  </h2>
                  <p style={{ color: colors.gray }}>
                    Adicione o primeiro restaurante para começar.
                  </p>
                </Panel>
              ) : (
                <div className="grid gap-4">
                  {restaurants.map((restaurant) => (
                    <Panel key={restaurant.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${colors.primary}10` }}
                          >
                            <Store className="w-6 h-6" style={{ color: colors.primary }} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg" style={{ color: colors.dark }}>
                              {restaurant.name}
                            </h3>
                            {restaurant.address && (
                              <p className="text-sm mt-1" style={{ color: colors.gray }}>{restaurant.address}</p>
                            )}
                            {restaurant.phone && (
                              <p className="text-sm flex items-center gap-1 mt-1" style={{ color: colors.gray }}>
                                <Phone className="w-3 h-3" /> {restaurant.phone}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-3">
                              <span className="text-xs px-2.5 py-1 rounded-full border" style={{ backgroundColor: `${colors.secondary}10`, color: colors.secondary, borderColor: `${colors.secondary}20` }}>
                                {restaurant.admin_count || 0} admin(s)
                              </span>
                              <span className="text-xs" style={{ color: colors.gray }}>
                                ID: {restaurant.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadRestaurantAdmins(restaurant)}
                            className="p-2.5 rounded-xl hover:bg-slate-100 transition-all"
                            style={{ color: colors.gray }}
                            title="Ver Administradores"
                          >
                            <Users className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteRestaurant(restaurant.id, restaurant.name)}
                            className="p-2.5 rounded-xl hover:bg-red-50 transition-all"
                            style={{ color: colors.danger }}
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </Panel>
                  ))}
                </div>
              )}

              {/* Admin List Panel */}
              {selectedRestaurant && (
                <Panel className="mt-6 overflow-hidden">
                  <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: colors.dark }}>
                        Administradores de {selectedRestaurant.name}
                      </h2>
                      <p className="text-sm" style={{ color: colors.gray }}>{restaurantAdmins.length} utilizador(es)</p>
                    </div>
                    <button
                      onClick={() => setShowAddAdminModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: colors.success }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                  <div className="divide-y" style={{ borderColor: colors.border }}>
                    {restaurantAdmins.length === 0 ? (
                      <div className="p-8 text-center" style={{ color: colors.gray }}>
                        Nenhum administrador encontrado
                      </div>
                    ) : (
                      restaurantAdmins.map((admin) => (
                        <div key={admin.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-white"
                              style={{ backgroundColor: colors.primary }}
                            >
                              {admin.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: colors.dark }}>{admin.name}</p>
                              <p className="text-sm" style={{ color: colors.gray }}>{admin.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteAdmin(admin.id, admin.name)}
                            className="p-2 rounded-xl hover:bg-red-50 transition-all"
                            style={{ color: colors.danger }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </Panel>
              )}
            </div>
          )}

          {/* Launch Settings Tab */}
          {activeTab === 'launch' && (
            <div>
              <SectionHeader title="Configurações de Lançamento" description="Controle funcionalidades do sistema">
                {launchSettingsSaved && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: colors.successBg, color: colors.success }}>
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Guardado!</span>
                  </div>
                )}
              </SectionHeader>

              {loadingLaunchSettings ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
                </div>
              ) : (
                <Panel className="p-6">
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: colors.light }}>
                    <div>
                      <h3 className="font-bold" style={{ color: colors.dark }}>Vendas de Planos Ativas</h3>
                      <p className="text-sm mt-1" style={{ color: colors.gray }}>
                        Quando desativado, os utilizadores não conseguem subscrever planos pagos
                      </p>
                    </div>
                    <button
                      onClick={() => setLaunchSettings({
                        ...launchSettings,
                        plans_sales_enabled: !launchSettings.plans_sales_enabled
                      })}
                      className={`relative w-14 h-8 rounded-full transition-all ${
                        launchSettings.plans_sales_enabled ? '' : 'bg-slate-200'
                      }`}
                      style={launchSettings.plans_sales_enabled ? { backgroundColor: colors.success } : {}}
                    >
                      <span 
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                          launchSettings.plans_sales_enabled ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Landing Mode Control */}
                  <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: colors.border }}>
                    <h3 className="font-bold mb-3" style={{ color: colors.dark }}>Modo da Landing Page</h3>
                    <p className="text-sm mb-4" style={{ color: colors.gray }}>
                      Controla o que é mostrado na secção de pricing da landing page
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setLaunchSettings({...launchSettings, landing_mode: 'plans'})}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          launchSettings.landing_mode === 'plans' ? 'shadow-md' : 'hover:border-slate-300'
                        }`}
                        style={{ 
                          borderColor: launchSettings.landing_mode === 'plans' ? colors.primary : colors.border,
                          backgroundColor: launchSettings.landing_mode === 'plans' ? `${colors.primary}05` : colors.white
                        }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <CreditCard className="w-5 h-5" style={{ color: launchSettings.landing_mode === 'plans' ? colors.primary : colors.gray }} />
                          <span className="font-medium" style={{ color: launchSettings.landing_mode === 'plans' ? colors.primary : colors.dark }}>
                            Planos
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: colors.gray }}>
                          Mostra a secção de pricing com os 3 planos
                        </p>
                      </button>
                      
                      <button
                        onClick={() => setLaunchSettings({...launchSettings, landing_mode: 'waitlist'})}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          launchSettings.landing_mode === 'waitlist' ? 'shadow-md' : 'hover:border-slate-300'
                        }`}
                        style={{ 
                          borderColor: launchSettings.landing_mode === 'waitlist' ? colors.primary : colors.border,
                          backgroundColor: launchSettings.landing_mode === 'waitlist' ? `${colors.primary}05` : colors.white
                        }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <ListChecks className="w-5 h-5" style={{ color: launchSettings.landing_mode === 'waitlist' ? colors.primary : colors.gray }} />
                          <span className="font-medium" style={{ color: launchSettings.landing_mode === 'waitlist' ? colors.primary : colors.dark }}>
                            Whitelist
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: colors.gray }}>
                          Mostra formulário de acesso antecipado
                        </p>
                      </button>
                    </div>
                    
                    {launchSettings.landing_mode === 'waitlist' && (
                      <div className="mt-3 p-3 rounded-xl text-sm" style={{ backgroundColor: colors.warningBg, color: colors.warning }}>
                        <strong>Modo Waitlist ativo:</strong> Os preços não são mostrados na landing, mas continuam editáveis no backoffice.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={saveLaunchSettings}
                      disabled={savingLaunchSettings}
                      className="flex items-center gap-2 px-8 py-3 rounded-full font-medium text-white transition-all hover:shadow-lg disabled:opacity-50"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {savingLaunchSettings ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Guardar
                    </button>
                  </div>
                </Panel>
              )}
            </div>
          )}

          {/* Emails Tab */}
          {activeTab === 'emails' && (
            <div>
              <SectionHeader title="Emails Enviados" description="Histórico de emails do sistema">
                <button
                  onClick={loadEmails}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:bg-slate-50"
                  style={{ borderColor: colors.border, color: colors.dark }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </button>
              </SectionHeader>

              {loadingEmails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
                </div>
              ) : emails.length === 0 ? (
                <Panel className="p-12 text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h2 className="text-xl font-bold mb-2" style={{ color: colors.dark }}>
                    Nenhum Email
                  </h2>
                  <p style={{ color: colors.gray }}>
                    Os emails enviados pelo sistema aparecerão aqui.
                  </p>
                </Panel>
              ) : (
                <Panel className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: colors.light }}>
                          <th className="text-left p-4 text-sm font-medium" style={{ color: colors.gray }}>Destinatário</th>
                          <th className="text-left p-4 text-sm font-medium" style={{ color: colors.gray }}>Assunto</th>
                          <th className="text-left p-4 text-sm font-medium" style={{ color: colors.gray }}>Tipo</th>
                          <th className="text-left p-4 text-sm font-medium" style={{ color: colors.gray }}>Status</th>
                          <th className="text-left p-4 text-sm font-medium" style={{ color: colors.gray }}>Data</th>
                          <th className="text-right p-4 text-sm font-medium" style={{ color: colors.gray }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: colors.border }}>
                        {emails.map((email) => (
                          <tr key={email.id} className="hover:bg-slate-50">
                            <td className="p-4">
                              <p className="font-medium" style={{ color: colors.dark }}>{email.recipient}</p>
                              {email.recipient_name && (
                                <p className="text-sm" style={{ color: colors.gray }}>{email.recipient_name}</p>
                              )}
                            </td>
                            <td className="p-4">
                              <p className="text-sm truncate max-w-xs" style={{ color: colors.dark }}>{email.subject}</p>
                            </td>
                            <td className="p-4">
                              <span className="text-xs px-2 py-1 rounded-full capitalize" style={{ backgroundColor: colors.light, color: colors.gray }}>
                                {email.email_type}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                                email.status === 'sent' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {email.status === 'sent' ? 'Enviado' : 'Falhado'}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="text-sm" style={{ color: colors.gray }}>
                                {new Date(email.sent_at).toLocaleString('pt-PT')}
                              </p>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => viewEmail(email.id)}
                                className="p-2 rounded-xl hover:bg-slate-100 transition-all"
                                style={{ color: colors.primary }}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}
            </div>
          )}

          {/* Waitlist Tab */}
          {activeTab === 'waitlist' && (
            <div>
              <SectionHeader title="Whitelist" description="Pedidos de acesso antecipado">
                <button
                  onClick={loadWaitlist}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:bg-slate-50"
                  style={{ borderColor: colors.border, color: colors.dark }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </button>
              </SectionHeader>

              {loadingWaitlist ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
                </div>
              ) : waitlistEntries.length === 0 ? (
                <Panel className="p-12 text-center">
                  <ListChecks className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h2 className="text-xl font-bold mb-2" style={{ color: colors.dark }}>
                    Nenhum Pedido
                  </h2>
                  <p style={{ color: colors.gray }}>
                    Os pedidos de acesso antecipado aparecerão aqui.
                  </p>
                </Panel>
              ) : (
                <Panel className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: colors.light }}>
                          <th className="text-left p-4 text-sm font-medium" style={{ color: colors.gray }}>Negócio</th>
                          <th className="text-left p-4 text-sm font-medium" style={{ color: colors.gray }}>Contacto</th>
                          <th className="text-left p-4 text-sm font-medium" style={{ color: colors.gray }}>Mesas</th>
                          <th className="text-left p-4 text-sm font-medium" style={{ color: colors.gray }}>Status</th>
                          <th className="text-left p-4 text-sm font-medium" style={{ color: colors.gray }}>Data</th>
                          <th className="text-right p-4 text-sm font-medium" style={{ color: colors.gray }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: colors.border }}>
                        {waitlistEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50">
                            <td className="p-4">
                              <p className="font-medium" style={{ color: colors.dark }}>{entry.business_name}</p>
                              <p className="text-sm" style={{ color: colors.gray }}>{entry.name}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-sm flex items-center gap-1" style={{ color: colors.dark }}>
                                <Mail className="w-3 h-3" /> {entry.email}
                              </p>
                              {entry.phone && (
                                <p className="text-sm flex items-center gap-1 mt-1" style={{ color: colors.gray }}>
                                  <Phone className="w-3 h-3" /> {entry.phone}
                                </p>
                              )}
                            </td>
                            <td className="p-4">
                              <p className="text-sm" style={{ color: colors.dark }}>
                                {entry.table_count || '-'}
                              </p>
                            </td>
                            <td className="p-4">
                              <select
                                value={entry.status}
                                onChange={(e) => updateWaitlistStatus(entry.id, e.target.value)}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium border cursor-pointer ${
                                  entry.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  entry.status === 'contacted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  entry.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <option value="new">Novo</option>
                                <option value="contacted">Contactado</option>
                                <option value="approved">Aprovado</option>
                                <option value="closed">Fechado</option>
                              </select>
                            </td>
                            <td className="p-4">
                              <p className="text-sm" style={{ color: colors.gray }}>
                                {new Date(entry.created_at).toLocaleDateString('pt-PT')}
                              </p>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => deleteWaitlistEntry(entry.id)}
                                className="p-2 rounded-xl hover:bg-red-50 transition-all"
                                style={{ color: colors.danger }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      
      {/* View Email Modal */}
      {showEmailModal && selectedEmail && (
        <ModalShell
          title="Detalhes do Email"
          onClose={() => setShowEmailModal(false)}
          maxWidth="max-w-4xl"
        >
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Email Info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl" style={{ backgroundColor: colors.light }}>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.gray }}>Destinatário</p>
                <p className="font-medium" style={{ color: colors.dark }}>{selectedEmail.recipient}</p>
                {selectedEmail.recipient_name && (
                  <p className="text-sm" style={{ color: colors.gray }}>{selectedEmail.recipient_name}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.gray }}>Status</p>
                <span className={`inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full border ${
                  selectedEmail.status === 'sent' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {selectedEmail.status === 'sent' ? 'Enviado' : 'Falhado'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.gray }}>Tipo</p>
                <p className="font-medium capitalize" style={{ color: colors.dark }}>{selectedEmail.email_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.gray }}>Data de Envio</p>
                <p className="font-medium" style={{ color: colors.dark }}>
                  {new Date(selectedEmail.sent_at).toLocaleString('pt-PT')}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium mb-1" style={{ color: colors.gray }}>Assunto</p>
                <p className="font-medium" style={{ color: colors.dark }}>{selectedEmail.subject}</p>
              </div>
              {selectedEmail.error_message && (
                <div className="col-span-2">
                  <p className="text-sm font-medium mb-1" style={{ color: colors.danger }}>Erro</p>
                  <p className="text-sm p-3 rounded-xl" style={{ backgroundColor: colors.dangerBg, color: colors.danger }}>
                    {selectedEmail.error_message}
                  </p>
                </div>
              )}
            </div>

            {/* Email Content Preview */}
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: colors.dark }}>Pré-visualização do Email:</p>
              <div 
                className="border rounded-2xl p-4 bg-white max-h-96 overflow-y-auto"
                style={{ borderColor: colors.border }}
                dangerouslySetInnerHTML={{ __html: selectedEmail.content_html }}
              />
            </div>
          </div>

          <div className="p-6 border-t flex justify-end" style={{ borderColor: colors.border }}>
            <button
              onClick={() => setShowEmailModal(false)}
              className="px-6 py-2.5 rounded-full font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: colors.primary }}
            >
              Fechar
            </button>
          </div>
        </ModalShell>
      )}

      {/* Add Restaurant Modal */}
      {showAddRestaurantModal && (
        <ModalShell
          title="Novo Restaurante"
          onClose={() => setShowAddRestaurantModal(false)}
        >
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <h3 className="font-medium" style={{ color: colors.dark }}>Dados do Restaurante</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Nome *</label>
              <input
                type="text"
                value={newRestaurant.restaurant_name}
                onChange={(e) => setNewRestaurant({...newRestaurant, restaurant_name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                style={{ borderColor: colors.border }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
                placeholder="Nome do restaurante"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Descrição</label>
              <textarea
                value={newRestaurant.description}
                onChange={(e) => setNewRestaurant({...newRestaurant, description: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all resize-none"
                style={{ borderColor: colors.border }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
                rows={2}
                placeholder="Descrição breve"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Morada</label>
                <input
                  type="text"
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                  style={{ borderColor: colors.border }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.border}
                  placeholder="Morada"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Telefone</label>
                <input
                  type="text"
                  value={newRestaurant.phone}
                  onChange={(e) => setNewRestaurant({...newRestaurant, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                  style={{ borderColor: colors.border }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.border}
                  placeholder="Telefone"
                />
              </div>
            </div>

            <hr className="my-4" style={{ borderColor: colors.border }} />
            <h3 className="font-medium" style={{ color: colors.dark }}>Conta de Administrador</h3>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Nome do Admin *</label>
              <input
                type="text"
                value={newRestaurant.admin_name}
                onChange={(e) => setNewRestaurant({...newRestaurant, admin_name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                style={{ borderColor: colors.border }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Email *</label>
              <input
                type="email"
                value={newRestaurant.admin_email}
                onChange={(e) => setNewRestaurant({...newRestaurant, admin_email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                style={{ borderColor: colors.border }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Password *</label>
              <input
                type="password"
                value={newRestaurant.admin_password}
                onChange={(e) => setNewRestaurant({...newRestaurant, admin_password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                style={{ borderColor: colors.border }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
                placeholder="Senha de acesso"
              />
            </div>
          </div>

          <div className="p-6 border-t flex gap-3" style={{ borderColor: colors.border }}>
            <button
              onClick={() => setShowAddRestaurantModal(false)}
              className="flex-1 py-3 rounded-full font-medium border transition-all hover:bg-slate-50"
              style={{ borderColor: colors.border, color: colors.dark }}
            >
              Cancelar
            </button>
            <button
              onClick={createRestaurant}
              disabled={savingRestaurant}
              className="flex-1 py-3 rounded-full font-medium text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ backgroundColor: colors.primary }}
            >
              {savingRestaurant ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Criar Restaurante
                </>
              )}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && selectedRestaurant && (
        <ModalShell
          title="Novo Administrador"
          subtitle={selectedRestaurant.name}
          onClose={() => setShowAddAdminModal(false)}
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Nome *</label>
              <input
                type="text"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                style={{ borderColor: colors.border }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Email *</label>
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                style={{ borderColor: colors.border }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Password *</label>
              <input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                style={{ borderColor: colors.border }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
                placeholder="Senha de acesso"
              />
            </div>
          </div>

          <div className="p-6 border-t flex gap-3" style={{ borderColor: colors.border }}>
            <button
              onClick={() => setShowAddAdminModal(false)}
              className="flex-1 py-3 rounded-full font-medium border transition-all hover:bg-slate-50"
              style={{ borderColor: colors.border, color: colors.dark }}
            >
              Cancelar
            </button>
            <button
              onClick={addAdmin}
              disabled={savingAdmin}
              className="flex-1 py-3 rounded-full font-medium text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ backgroundColor: colors.success }}
            >
              {savingAdmin ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Adicionar
                </>
              )}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedContact && (
        <ModalShell
          title="Responder"
          subtitle={`Para: ${selectedContact.email}`}
          onClose={() => setShowReplyModal(false)}
        >
          <div className="p-6">
            {replySuccess ? (
              <div className="text-center py-8">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: colors.successBg }}
                >
                  <CheckCircle className="w-8 h-8" style={{ color: colors.success }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.dark }}>
                  Email Enviado!
                </h3>
                <p style={{ color: colors.gray }}>
                  A sua resposta foi enviada para {selectedContact.email}
                </p>
              </div>
            ) : (
              <>
                {replyError && (
                  <div className="mb-4 p-4 rounded-xl text-sm border" style={{ backgroundColor: colors.dangerBg, color: colors.danger, borderColor: `${colors.danger}20` }}>
                    {replyError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>
                      Assunto
                    </label>
                    <input
                      type="text"
                      value={replyData.subject}
                      onChange={(e) => setReplyData({ ...replyData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                      style={{ borderColor: colors.border }}
                      onFocus={(e) => e.target.style.borderColor = colors.primary}
                      onBlur={(e) => e.target.style.borderColor = colors.border}
                      data-testid="reply-subject"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>
                      Mensagem
                    </label>
                    <textarea
                      value={replyData.message}
                      onChange={(e) => setReplyData({ ...replyData, message: e.target.value })}
                      rows={6}
                      placeholder="Escreva a sua resposta..."
                      className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all resize-none"
                      style={{ borderColor: colors.border }}
                      onFocus={(e) => e.target.style.borderColor = colors.primary}
                      onBlur={(e) => e.target.style.borderColor = colors.border}
                      data-testid="reply-message"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowReplyModal(false)}
                    className="flex-1 px-4 py-3 border rounded-full font-medium transition-all hover:bg-slate-50"
                    style={{ borderColor: colors.border, color: colors.dark }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={sendingReply}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: colors.primary }}
                    data-testid="send-reply-button"
                  >
                    {sendingReply ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        A enviar...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Email
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </ModalShell>
      )}

      {/* Messages History Modal */}
      {showMessagesModal && selectedContact && (
        <ModalShell
          title="Histórico"
          subtitle={selectedContact.name}
          onClose={() => setShowMessagesModal(false)}
        >
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Original message */}
            <div className="mb-4">
              <p className="text-xs mb-1" style={{ color: colors.gray }}>
                Mensagem original - {new Date(selectedContact.created_at).toLocaleString('pt-PT')}
              </p>
              <div className="p-4 rounded-xl border-l-4" style={{ backgroundColor: `${colors.secondary}05`, borderLeftColor: colors.secondary }}>
                <p className="text-sm" style={{ color: colors.dark }}>{selectedContact.message}</p>
              </div>
            </div>

            {/* Sent messages */}
            {contactMessages.length > 0 ? (
              <div className="space-y-4">
                {contactMessages.map((msg) => (
                  <div key={msg.id}>
                    <p className="text-xs mb-1" style={{ color: colors.gray }}>
                      Resposta enviada - {new Date(msg.created_at).toLocaleString('pt-PT')}
                    </p>
                    <div className="p-4 rounded-xl border-l-4" style={{ backgroundColor: colors.successBg, borderLeftColor: colors.success }}>
                      <p className="font-medium text-sm mb-1" style={{ color: colors.dark }}>
                        {msg.subject}
                      </p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: colors.dark }}>{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4" style={{ color: colors.gray }}>
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma resposta enviada ainda</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t" style={{ borderColor: colors.border }}>
            <button
              onClick={() => {
                setShowMessagesModal(false);
                openReplyModal(selectedContact);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: colors.success }}
            >
              <Reply className="w-5 h-5" />
              Enviar Nova Resposta
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default BackofficePage;
