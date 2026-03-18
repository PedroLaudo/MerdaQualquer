import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  QrCode, 
  Utensils, 
  Clock, 
  BarChart3, 
  Smartphone, 
  CreditCard,
  Bell,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Zap,
  Shield,
  TrendingUp,
  ChefHat,
  Coffee,
  Wine,
  Store,
  Users,
  Receipt,
  Settings,
  ChevronDown,
  Play,
  Sparkles,
  Check,
  Globe
} from 'lucide-react';

// Color palette - Based on Logo
const colors = {
  primary: '#1E2A4A',
  secondary: '#3B5998',
  accent: '#1a2342',
  dark: '#1E2A4A',
  light: '#F8FAFC',
  white: '#FFFFFF',
  gray: '#64748B',
  border: '#E2E8F0',
};

// Logo URL
const logoUrl = '/logo.png';

// Images
const images = {
  hero1: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  hero2: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
  hero3: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
};

// Infinite Marquee Component
const InfiniteMarquee = ({ items, direction = 'left', speed = 30 }) => {
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div
        className="inline-flex"
        animate={{
          x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%']
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: speed,
            ease: 'linear'
          }
        }}
      >
        {[...items, ...items].map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 mx-4 px-5 py-2.5 rounded-full border bg-white shadow-sm"
            style={{ borderColor: colors.border }}
          >
            <item.icon className="w-5 h-5" style={{ color: colors.primary }} />
            <span className="font-medium" style={{ color: colors.dark }}>{item.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// FAQ Accordion Item
const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b" style={{ borderColor: colors.border }}>
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="font-semibold text-lg pr-8" style={{ color: colors.dark }}>{question}</span>
        <ChevronDown 
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: colors.gray }}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 leading-relaxed" style={{ color: colors.gray }}>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Language Selector Component
const LanguageSelector = ({ language, setLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        data-testid="language-selector"
      >
        <Globe className="w-4 h-4" style={{ color: colors.gray }} />
        <span className="font-medium text-sm" style={{ color: colors.dark }}>
          {language.toUpperCase()}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: colors.gray }} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border py-1 min-w-[100px] z-50"
            style={{ borderColor: colors.border }}
          >
            <button
              onClick={() => { setLanguage('pt'); setIsOpen(false); }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${language === 'pt' ? 'font-semibold' : ''}`}
              style={{ color: colors.dark }}
            >
              🇵🇹 Português
              {language === 'pt' && <Check className="w-4 h-4 ml-auto" style={{ color: colors.accent }} />}
            </button>
            <button
              onClick={() => { setLanguage('en'); setIsOpen(false); }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${language === 'en' ? 'font-semibold' : ''}`}
              style={{ color: colors.dark }}
            >
              🇬🇧 English
              {language === 'en' && <Check className="w-4 h-4 ml-auto" style={{ color: colors.accent }} />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('restaurant');
  const [openFAQ, setOpenFAQ] = useState(0);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [pricing, setPricing] = useState({
    starter: { monthly_price: 29, annual_price: 276, features: null },
    pro: { monthly_price: 59, annual_price: 564, features: null },
    enterprise: { monthly_price: null, annual_price: null, features: null }
  });
  
  // Launch Settings state
  const [plansSalesEnabled, setPlansSalesEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const API = process.env.REACT_APP_BACKEND_URL;

  // Hero image carousel
  const heroImages = [images.hero1, images.hero2, images.hero3];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load pricing from API
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const response = await fetch(`${API}/api/backoffice/pricing`);
        if (response.ok) {
          const data = await response.json();
          setPricing(data);
        }
      } catch (error) {
        console.log('Using default pricing');
      }
    };
    loadPricing();
  }, [API]);

  // Load global launch settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('🚀 [LandingPage] Loading global settings...');
        const response = await fetch(`${API}/api/settings/global`);
        const data = await response.json();
        console.log('📦 [LandingPage] Settings loaded:', data);
        setPlansSalesEnabled(data.plans_sales_enabled ?? true);
      } catch (error) {
        console.error('❌ [LandingPage] Error loading settings:', error);
        setPlansSalesEnabled(true);
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, [API]);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Establishment types for marquee
  const establishmentTypes = [
    { icon: Utensils, label: t('marquee.restaurants') },
    { icon: Coffee, label: t('marquee.cafes') },
    { icon: Wine, label: t('marquee.bars') },
    { icon: ChefHat, label: t('marquee.bistros') },
    { icon: Store, label: t('marquee.foodCourts') },
    { icon: Utensils, label: t('marquee.pizzerias') },
    { icon: Coffee, label: t('marquee.bakeries') },
    { icon: Wine, label: t('marquee.rooftops') },
    { icon: ChefHat, label: t('marquee.gastrobars') },
    { icon: Store, label: t('marquee.canteens') },
  ];

  // Features for tabs
  const restaurantFeatures = [
    { icon: BarChart3, title: t('features.dashboard'), description: t('features.dashboardDesc') },
    { icon: Receipt, title: t('features.orders'), description: t('features.ordersDesc') },
    { icon: CreditCard, title: t('features.payments'), description: t('features.paymentsDesc') },
    { icon: Settings, title: t('features.menu'), description: t('features.menuDesc') }
  ];

  const clientFeatures = [
    { icon: QrCode, title: t('features.scan'), description: t('features.scanDesc') },
    { icon: Smartphone, title: t('features.interface'), description: t('features.interfaceDesc') },
    { icon: Bell, title: t('features.callWaiter'), description: t('features.callWaiterDesc') },
    { icon: Clock, title: t('features.trackOrder'), description: t('features.trackOrderDesc') }
  ];

  const faqs = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
  ];

  // Pricing plans - using dynamic prices and features from API
  const pricingPlans = [
    {
      name: t('pricing.starter'),
      description: t('pricing.starterDesc'),
      monthlyPrice: pricing.starter?.monthly_price,
      annualPrice: pricing.starter?.annual_price ? Math.round(pricing.starter.annual_price / 12) : null,
      features: pricing.starter?.features?.map(f => f.label) || [t('pricing.tables10'), t('pricing.menuUnlimited'), t('pricing.dashboardBasic'), t('pricing.emailSupport')],
      highlighted: false
    },
    {
      name: t('pricing.pro'),
      description: t('pricing.proDesc'),
      monthlyPrice: pricing.pro?.monthly_price,
      annualPrice: pricing.pro?.annual_price ? Math.round(pricing.pro.annual_price / 12) : null,
      features: pricing.pro?.features?.map(f => f.label) || [t('pricing.tables30'), t('pricing.menuUnlimited'), t('pricing.dashboardAdvanced'), t('pricing.onlinePayments'), t('pricing.realTimeNotifications'), t('pricing.prioritySupport')],
      highlighted: true
    },
    {
      name: t('pricing.enterprise'),
      description: t('pricing.enterpriseDesc'),
      monthlyPrice: null,
      annualPrice: null,
      features: pricing.enterprise?.features?.map(f => f.label) || [t('pricing.tablesUnlimited'), t('pricing.multiRestaurants'), t('pricing.customAPI'), t('pricing.integrations'), t('pricing.dedicatedManager'), t('pricing.slaGuaranteed')],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.white }}>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b" style={{ borderColor: colors.border }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img src={logoUrl} alt="ZentraQR Logo" className="h-10 object-contain" />
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => scrollToSection('features')}
                className="font-medium text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
                data-testid="nav-features"
              >
                {t('nav.features')}
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="font-medium text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
                data-testid="nav-pricing"
              >
                {t('nav.pricing')}
              </button>
              <button 
                onClick={() => navigate('/demo')}
                className="font-medium text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
                data-testid="nav-demo"
              >
                {t('nav.demo')}
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="font-medium text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
                data-testid="nav-faq"
              >
                {t('nav.faq')}
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className="font-medium text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
                data-testid="nav-contact"
              >
                {t('nav.contact')}
              </button>
              
              {/* Language Selector */}
              <LanguageSelector language={language} setLanguage={setLanguage} />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSelector language={language} setLanguage={setLanguage} />
              <button 
                className="p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" style={{ color: colors.dark }} />
                ) : (
                  <Menu className="w-6 h-6" style={{ color: colors.dark }} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t"
              style={{ borderColor: colors.border }}
            >
              <div className="px-4 py-6 flex flex-col gap-4">
                <button onClick={() => scrollToSection('features')} className="py-2 text-left font-medium" style={{ color: colors.gray }}>
                  {t('nav.features')}
                </button>
                <button onClick={() => scrollToSection('pricing')} className="py-2 text-left font-medium" style={{ color: colors.gray }}>
                  {t('nav.pricing')}
                </button>
                <button onClick={() => { setMobileMenuOpen(false); navigate('/demo'); }} className="py-2 text-left font-medium" style={{ color: colors.gray }}>
                  {t('nav.demo')}
                </button>
                <button onClick={() => scrollToSection('faq')} className="py-2 text-left font-medium" style={{ color: colors.gray }}>
                  {t('nav.faq')}
                </button>
                <button onClick={() => { setMobileMenuOpen(false); navigate('/contact'); }} className="py-2 text-left font-medium" style={{ color: colors.gray }}>
                  {t('nav.contact')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
                style={{ borderColor: colors.border, backgroundColor: colors.light }}
              >
                <Sparkles className="w-4 h-4" style={{ color: colors.accent }} />
                <span className="text-sm font-medium" style={{ color: colors.dark }}>{t('hero.badge')}</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6" style={{ color: colors.dark }}>
                {t('hero.title1')}{' '}
                <span style={{ color: colors.accent }}>{t('hero.title2')}</span>
              </h1>
              <p className="text-lg sm:text-xl mb-8 leading-relaxed" style={{ color: colors.gray }}>
                {t('hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection('pricing')}
                  className="px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 group shadow-lg"
                  style={{ backgroundColor: colors.accent, color: 'white' }}
                  data-testid="hero-cta-primary"
                >
                  {t('hero.cta')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/demo')}
                  className="px-8 py-4 rounded-full font-bold text-lg border-2 transition-all flex items-center justify-center gap-2"
                  style={{ borderColor: colors.primary, color: colors.primary }}
                  data-testid="hero-cta-demo"
                >
                  <Play className="w-5 h-5" />
                  {t('hero.demo')}
                </motion.button>
              </div>

              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: i % 2 === 0 ? colors.primary : colors.secondary }}
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: colors.dark }}>{t('hero.socialProof')}</p>
                  <p className="text-sm" style={{ color: colors.gray }}>{t('hero.socialProofSub')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  className="col-span-2 rounded-2xl overflow-hidden shadow-2xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <img src={heroImages[currentHeroImage]} alt="Restaurant Interior" className="w-full h-64 object-cover transition-opacity duration-700" />
                </motion.div>
                
                <motion.div 
                  className="rounded-2xl p-4 border shadow-lg bg-white"
                  style={{ borderColor: colors.border }}
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm" style={{ color: colors.gray }}>{t('common.ordersToday')}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}>
                      {t('common.live')}
                    </span>
                  </div>
                  <div className="text-3xl font-bold mb-1" style={{ color: colors.dark }}>47</div>
                  <div className="flex items-center gap-1 text-sm" style={{ color: colors.accent }}>
                    <TrendingUp className="w-4 h-4" />
                    <span>+23% {t('common.vsYesterday')}</span>
                  </div>
                </motion.div>

                <motion.div 
                  className="rounded-2xl p-4 border shadow-lg bg-white"
                  style={{ borderColor: colors.border }}
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm" style={{ color: colors.gray }}>{t('common.revenue')}</span>
                    <CreditCard className="w-4 h-4" style={{ color: colors.gray }} />
                  </div>
                  <div className="text-3xl font-bold mb-1" style={{ color: colors.dark }}>€1,240</div>
                  <div className="text-sm" style={{ color: colors.gray }}>{t('common.lastHour')}: €180</div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="absolute -right-4 top-1/3 px-4 py-3 rounded-xl shadow-xl border bg-white"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.accent}15` }}>
                    <Bell className="w-5 h-5" style={{ color: colors.accent }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.dark }}>{t('common.newOrder')}</p>
                    <p className="text-xs" style={{ color: colors.gray }}>{t('common.table')} 5 · 3 itens · €24.50</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PROBLEM/SOLUTION SECTION */}
      <section className="py-20 lg:py-32" style={{ backgroundColor: colors.light }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style={{ color: colors.dark }}>
              {t('problem.title1')}<br />
              <span style={{ color: colors.accent }}>{t('problem.title2')}</span>
            </h2>
            <p className="max-w-2xl mx-auto text-lg" style={{ color: colors.gray }}>
              {t('problem.description')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: t('problem.card1Title'), description: t('problem.card1Desc') },
              { icon: CreditCard, title: t('problem.card2Title'), description: t('problem.card2Desc') },
              { icon: Shield, title: t('problem.card3Title'), description: t('problem.card3Desc') }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl border bg-white hover:shadow-lg transition-all group"
                style={{ borderColor: colors.border }}
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <item.icon className="w-7 h-7" style={{ color: colors.primary }} />
                </div>
                <h3 className="font-bold text-xl mb-3" style={{ color: colors.dark }}>{item.title}</h3>
                <p className="leading-relaxed" style={{ color: colors.gray }}>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE SECTION */}
      <section className="py-12 border-y" style={{ borderColor: colors.border }}>
        <div className="mb-8">
          <p className="text-center text-sm uppercase tracking-wider mb-6" style={{ color: colors.gray }}>
            {t('marquee.title')}
          </p>
          <InfiniteMarquee items={establishmentTypes} direction="left" speed={35} />
        </div>
        <InfiniteMarquee items={establishmentTypes} direction="right" speed={40} />
      </section>

      {/* FEATURES SECTION WITH TABS */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style={{ color: colors.dark }}>
              {t('features.title1')}<br />
              <span style={{ color: colors.accent }}>{t('features.title2')}</span>
            </h2>
            <p className="max-w-2xl mx-auto text-lg" style={{ color: colors.gray }}>
              {t('features.description')}
            </p>
          </motion.div>

          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1.5 rounded-full border" style={{ borderColor: colors.border, backgroundColor: colors.light }}>
              <button
                onClick={() => setActiveTab('restaurant')}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all ${activeTab === 'restaurant' ? 'text-white shadow-md' : ''}`}
                style={activeTab === 'restaurant' ? { backgroundColor: colors.primary } : { color: colors.gray }}
                data-testid="tab-restaurant"
              >
                <Users className="w-4 h-4 inline mr-2" />
                {t('features.tabRestaurant')}
              </button>
              <button
                onClick={() => setActiveTab('client')}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all ${activeTab === 'client' ? 'text-white shadow-md' : ''}`}
                style={activeTab === 'client' ? { backgroundColor: colors.primary } : { color: colors.gray }}
                data-testid="tab-client"
              >
                <Smartphone className="w-4 h-4 inline mr-2" />
                {t('features.tabClient')}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {(activeTab === 'restaurant' ? restaurantFeatures : clientFeatures).map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 rounded-2xl border bg-white hover:shadow-lg transition-all group flex gap-6"
                  style={{ borderColor: colors.border }}
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${colors.secondary}15` }}
                  >
                    <feature.icon className="w-7 h-7" style={{ color: colors.secondary }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2" style={{ color: colors.dark }}>{feature.title}</h3>
                    <p className="leading-relaxed" style={{ color: colors.gray }}>{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 lg:py-32" style={{ backgroundColor: colors.light }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style={{ color: colors.dark }}>
              {t('howItWorks.title')} <span style={{ color: colors.accent }}>{t('howItWorks.titleHighlight')}</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-20 left-[20%] right-[20%] h-0.5" style={{ backgroundColor: colors.border }}></div>
            
            {[
              { step: '01', title: t('howItWorks.step1'), description: t('howItWorks.step1Desc') },
              { step: '02', title: t('howItWorks.step2'), description: t('howItWorks.step2Desc') },
              { step: '03', title: t('howItWorks.step3'), description: t('howItWorks.step3Desc') }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center relative z-10"
              >
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold border bg-white shadow-sm"
                  style={{ borderColor: colors.border }}
                >
                  <span style={{ color: colors.accent }}>{item.step}</span>
                </div>
                <h3 className="font-bold text-xl mb-3" style={{ color: colors.dark }}>{item.title}</h3>
                <p className="leading-relaxed max-w-xs mx-auto" style={{ color: colors.gray }}>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style={{ color: colors.dark }}>
              {t('pricing.title')} <span style={{ color: colors.accent }}>{t('pricing.titleHighlight')}</span>
            </h2>
            <p className="max-w-2xl mx-auto text-lg mb-8" style={{ color: colors.gray }}>
              {t('pricing.description')}
            </p>

            <div className="inline-flex items-center gap-4 p-1.5 rounded-full border" style={{ borderColor: colors.border, backgroundColor: colors.light }}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-full font-medium transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-sm' : ''}`}
                style={{ color: billingCycle === 'monthly' ? colors.dark : colors.gray }}
                data-testid="billing-monthly"
              >
                {t('pricing.monthly')}
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${billingCycle === 'annual' ? 'bg-white shadow-sm' : ''}`}
                style={{ color: billingCycle === 'annual' ? colors.dark : colors.gray }}
                data-testid="billing-annual"
              >
                {t('pricing.annual')}
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: colors.accent }}>
                  {t('pricing.discount')}
                </span>
              </button>
            </div>
          </motion.div>

          {/* Launching Soon Badge */}
          {!plansSalesEnabled && !loadingSettings && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto mb-8 p-4 rounded-xl border-2 border-orange-400 bg-orange-50 text-center"
            >
              <p className="text-orange-600 font-bold flex items-center justify-center gap-2 mb-1">
                <Sparkles className="w-5 h-5" />
                {language === 'pt' ? '🚀 Lançamento em breve' : '🚀 Launching Soon'}
              </p>
              <p className="text-sm text-orange-700">
                {language === 'pt' 
                  ? 'Estamos a preparar algo incrível. Lançamento em breve.' 
                  : 'We are preparing something incredible. Launching soon.'}
              </p>
            </motion.div>
          )}

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-8 relative ${plan.highlighted ? 'shadow-xl transform lg:scale-105' : 'border'}`}
                style={{ 
                  backgroundColor: plan.highlighted ? colors.primary : 'white',
                  borderColor: !plan.highlighted ? colors.border : undefined
                }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: colors.accent }}>
                    {t('pricing.mostPopular')}
                  </div>
                )}
                <h3 className="font-bold text-xl mb-2" style={{ color: plan.highlighted ? 'white' : colors.dark }}>
                  {plan.name}
                </h3>
                <p className="text-sm mb-6" style={{ color: plan.highlighted ? 'rgba(255,255,255,0.7)' : colors.gray }}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  {plan.monthlyPrice ? (
                    <>
                      <span className="text-4xl font-bold" style={{ color: plan.highlighted ? 'white' : colors.dark }}>
                        €{billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                      </span>
                      <span style={{ color: plan.highlighted ? 'rgba(255,255,255,0.7)' : colors.gray }}>{t('pricing.month')}</span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold" style={{ color: plan.highlighted ? 'white' : colors.dark }}>
                      {t('pricing.custom')}
                    </span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2" style={{ color: plan.highlighted ? 'rgba(255,255,255,0.9)' : colors.gray }}>
                      <Check className="w-5 h-5" style={{ color: plan.highlighted ? 'white' : colors.accent }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => {
                    // If sales are disabled, don't navigate
                    if (!plansSalesEnabled) return;
                    
                    if (plan.monthlyPrice) {
                      navigate(`/onboarding?plan=${index === 0 ? 'starter' : index === 1 ? 'pro' : 'enterprise'}&billing=${billingCycle}`);
                    } else {
                      navigate('/contact');
                    }
                  }}
                  disabled={!plansSalesEnabled && plan.monthlyPrice}
                  className="w-full py-3 rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: plan.highlighted 
                      ? (plansSalesEnabled ? colors.accent : colors.gray)
                      : 'transparent',
                    color: plan.highlighted ? 'white' : (plansSalesEnabled ? colors.primary : colors.gray),
                    border: plan.highlighted ? 'none' : `2px solid ${plansSalesEnabled ? colors.primary : colors.gray}`
                  }}
                  data-testid={`plan-${plan.name.toLowerCase()}`}
                >
                  {!plansSalesEnabled && plan.monthlyPrice ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {language === 'pt' ? 'Lançamento em Breve' : 'Launching Soon'}
                    </>
                  ) : (
                    plan.monthlyPrice ? t('pricing.cta') : t('pricing.ctaEnterprise')
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 lg:py-32" style={{ backgroundColor: colors.light }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: colors.dark }}>
              {t('faq.title')}
            </h2>
            <p style={{ color: colors.gray }}>{t('faq.description')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border"
            style={{ borderColor: colors.border }}
          >
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => setOpenFAQ(openFAQ === index ? -1 : index)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style={{ color: colors.dark }}>
              {t('cta.title1')}<br />
              <span style={{ color: colors.accent }}>{t('cta.title2')}</span>
            </h2>
            <p className="mb-10 max-w-xl mx-auto text-lg" style={{ color: colors.gray }}>
              {t('cta.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollToSection('pricing')}
                className="px-10 py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 group shadow-lg"
                style={{ backgroundColor: colors.accent, color: 'white' }}
                data-testid="cta-start-trial"
              >
                {t('cta.button')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: colors.gray }}>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: colors.accent }} />
                {t('cta.noCard')}
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: colors.accent }} />
                {t('cta.quickSetup')}
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: colors.accent }} />
                {t('cta.cancelAnytime')}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t" style={{ borderColor: colors.border, backgroundColor: colors.light }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <img src={logoUrl} alt="ZentraQR Logo" className="h-10 object-contain" />
              </div>
              <p className="text-sm max-w-sm leading-relaxed" style={{ color: colors.gray }}>
                {t('footer.description')}
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4" style={{ color: colors.dark }}>{t('footer.product')}</h4>
              <ul className="space-y-3">
                <li><button onClick={() => scrollToSection('features')} className="text-sm transition-colors hover:opacity-70" style={{ color: colors.gray }}>{t('nav.features')}</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="text-sm transition-colors hover:opacity-70" style={{ color: colors.gray }}>{t('nav.pricing')}</button></li>
                <li><button onClick={() => navigate('/demo')} className="text-sm transition-colors hover:opacity-70" style={{ color: colors.gray }}>{t('nav.demo')}</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="text-sm transition-colors hover:opacity-70" style={{ color: colors.gray }}>{t('nav.faq')}</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4" style={{ color: colors.dark }}>{t('footer.contact')}</h4>
              <ul className="space-y-3">
                <li className="text-sm" style={{ color: colors.gray }}>zentraqr@gmail.com</li>
                <li className="text-sm" style={{ color: colors.gray }}>+351 912 345 678</li>
                <li>
                  <button onClick={() => navigate('/contact')} className="text-sm transition-colors" style={{ color: colors.accent }}>
                    {t('footer.sendMessage')}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderColor: colors.border }}>
            <p className="text-sm" style={{ color: colors.gray }}>{t('footer.rights')}</p>
            <div className="flex gap-6">
              <button className="text-sm transition-colors hover:opacity-70" style={{ color: colors.gray }} onClick={() => navigate('/terms')}>
                {t('footer.terms')}
              </button>
              <button className="text-sm transition-colors hover:opacity-70" style={{ color: colors.gray }} onClick={() => navigate('/privacy')}>
                {t('footer.privacy')}
              </button>
              <button 
                onClick={() => navigate('/login')} 
                className="text-sm transition-colors hover:opacity-70 font-medium"
                style={{ color: colors.accent }}
              >
                {language === 'pt' ? 'Área de Clientes →' : 'Client Area →'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
