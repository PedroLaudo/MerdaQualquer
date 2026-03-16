import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Mail,
  Phone,
  User,
  MessageSquare,
  Send,
  Loader2,
  Menu,
  X,
  ChevronDown,
  Globe,
  Check,
  CheckCircle2,
  Clock3,
  Headset,
  ArrowRight,
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
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: colors.gray }}
        />
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
              onClick={() => {
                setLanguage('pt');
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                language === 'pt' ? 'font-semibold' : ''
              }`}
              style={{ color: colors.dark }}
            >
              🇵🇹 Português
              {language === 'pt' && (
                <Check className="w-4 h-4 ml-auto" style={{ color: colors.accent }} />
              )}
            </button>
            <button
              onClick={() => {
                setLanguage('en');
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                language === 'en' ? 'font-semibold' : ''
              }`}
              style={{ color: colors.dark }}
            >
              🇬🇧 English
              {language === 'en' && (
                <Check className="w-4 h-4 ml-auto" style={{ color: colors.accent }} />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContactPage = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const API = process.env.REACT_APP_BACKEND_URL;

  const copy =
    language === 'pt'
      ? {
          badge: 'Fale com a equipa Zentra',
          heroTitle1: 'Vamos pôr o seu serviço a',
          heroTitle2: 'funcionar melhor',
          heroDescription:
            'Se quer marcar uma demonstração, tirar dúvidas comerciais ou perceber como a Zentra se adapta ao seu espaço, envie-nos uma mensagem. Respondemos rapidamente.',
          card1Title: 'Resposta rápida',
          card1Desc: 'Normalmente respondemos em menos de 24 horas úteis.',
          card2Title: 'Apoio comercial',
          card2Desc: 'Falamos consigo sobre pricing, setup e casos de uso.',
          card3Title: 'Implementação simples',
          card3Desc: 'Ajudamos a perceber o melhor caminho para lançar.',
          infoTitle: 'Outras formas de contacto',
          formEyebrow: 'Entre em contacto',
          formTitle: 'Envie-nos uma mensagem',
          formDescription:
            'Preencha o formulário e diga-nos o que precisa. Quanto mais contexto der, mais útil será a nossa resposta.',
          name: 'Nome',
          email: 'Email',
          phone: 'Telefone',
          optional: 'Opcional',
          message: 'Mensagem',
          responseTime: 'Tempo de resposta',
          responseTimeValue: '< 24h úteis',
          requiredFieldError: 'Por favor, preencha todos os campos obrigatórios.',
          invalidEmailError: 'Por favor, insira um email válido.',
          sendError: 'Erro ao enviar mensagem. Tente novamente.',
          sending: 'A enviar...',
          submit: 'Enviar mensagem',
          successBadge: 'Mensagem enviada',
          successTitle: 'Recebemos o seu contacto',
          successDescription:
            'Obrigado. A nossa equipa vai responder o mais rapidamente possível.',
          successPrimary: 'Voltar ao início',
          successSecondary: 'Ver demo',
          footerDescription: 'Soluções digitais para atendimento e gestão.',
          footerProduct: 'Produto',
          footerContact: 'Contacto',
          footerSendMessage: 'Enviar mensagem',
          footerRights: '© 2026 ZentraQR. Todos os direitos reservados.',
          footerTerms: 'Termos',
          footerPrivacy: 'Privacidade',
          clientArea: 'Área de Clientes →',
        }
      : {
          badge: 'Talk to the Zentra team',
          heroTitle1: 'Let’s make your service run',
          heroTitle2: 'better',
          heroDescription:
            'Whether you want a demo, pricing details, or to understand how Zentra fits your operation, send us a message. We will get back to you quickly.',
          card1Title: 'Fast replies',
          card1Desc: 'We usually reply within 24 business hours.',
          card2Title: 'Commercial support',
          card2Desc: 'We can help with pricing, setup, and use cases.',
          card3Title: 'Simple rollout',
          card3Desc: 'We help you find the best path to launch.',
          infoTitle: 'Other ways to reach us',
          formEyebrow: 'Get in touch',
          formTitle: 'Send us a message',
          formDescription:
            'Fill in the form and tell us what you need. The more context you share, the better we can help.',
          name: 'Name',
          email: 'Email',
          phone: 'Phone',
          optional: 'Optional',
          message: 'Message',
          responseTime: 'Response time',
          responseTimeValue: '< 24 business hours',
          requiredFieldError: 'Please fill in all required fields.',
          invalidEmailError: 'Please enter a valid email.',
          sendError: 'Error sending message. Please try again.',
          sending: 'Sending...',
          submit: 'Send message',
          successBadge: 'Message sent',
          successTitle: 'We received your message',
          successDescription:
            'Thanks. Our team will get back to you as soon as possible.',
          successPrimary: 'Back to home',
          successSecondary: 'View demo',
          footerDescription: 'Digital solutions for service and operations.',
          footerProduct: 'Product',
          footerContact: 'Contact',
          footerSendMessage: 'Send message',
          footerRights: '© 2026 ZentraQR. All rights reserved.',
          footerTerms: 'Terms',
          footerPrivacy: 'Privacy',
          clientArea: 'Client Area →',
        };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);

    if (window.location.pathname !== '/') {
      window.location.href = `/#${id}`;
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError(copy.requiredFieldError);
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(copy.invalidEmailError);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API}/api/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (err) {
      setError(copy.sendError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.white }}>
      {/* NAVBAR - same as landing */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b"
        style={{ borderColor: colors.border }}
      >
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
                style={{ color: colors.dark }}
                data-testid="nav-contact"
              >
                {t('nav.contact')}
              </button>

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
                <button
                  onClick={() => scrollToSection('features')}
                  className="py-2 text-left font-medium"
                  style={{ color: colors.gray }}
                >
                  {t('nav.features')}
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="py-2 text-left font-medium"
                  style={{ color: colors.gray }}
                >
                  {t('nav.pricing')}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/demo');
                  }}
                  className="py-2 text-left font-medium"
                  style={{ color: colors.gray }}
                >
                  {t('nav.demo')}
                </button>
                <button
                  onClick={() => scrollToSection('faq')}
                  className="py-2 text-left font-medium"
                  style={{ color: colors.gray }}
                >
                  {t('nav.faq')}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/contact');
                  }}
                  className="py-2 text-left font-medium"
                  style={{ color: colors.dark }}
                >
                  {t('nav.contact')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {success ? (
        <section
          className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 min-h-screen flex items-center"
          style={{ backgroundColor: colors.light }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border bg-white p-8 md:p-12 shadow-sm text-center"
              style={{ borderColor: colors.border }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
                style={{ borderColor: colors.border, backgroundColor: colors.light }}
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: colors.accent }} />
                <span className="text-sm font-medium" style={{ color: colors.dark }}>
                  {copy.successBadge}
                </span>
              </div>

              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
                style={{ color: colors.dark }}
              >
                {copy.successTitle}
              </h1>

              <p className="text-lg mb-8 leading-relaxed" style={{ color: colors.gray }}>
                {copy.successDescription}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/')}
                  className="px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 group shadow-lg"
                  style={{ backgroundColor: colors.accent, color: 'white' }}
                >
                  {copy.successPrimary}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/demo')}
                  className="px-8 py-4 rounded-full font-bold text-lg border-2 transition-all flex items-center justify-center gap-2"
                  style={{ borderColor: colors.primary, color: colors.primary }}
                >
                  {copy.successSecondary}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
      ) : (
        <>
          {/* HERO */}
          <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-20 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(30,42,74,0.08) 0%, rgba(30,42,74,0.02) 18%, rgba(255,255,255,0) 38%)',
              }}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
                  style={{ borderColor: colors.border, backgroundColor: colors.light }}
                >
                  <Mail className="w-4 h-4" style={{ color: colors.accent }} />
                  <span className="text-sm font-medium" style={{ color: colors.dark }}>
                    {copy.badge}
                  </span>
                </motion.div>

                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6"
                  style={{ color: colors.dark }}
                >
                  {copy.heroTitle1}{' '}
                  <span style={{ color: colors.accent }}>{copy.heroTitle2}</span>
                </h1>

                <p className="text-lg sm:text-xl max-w-3xl leading-relaxed" style={{ color: colors.gray }}>
                  {copy.heroDescription}
                </p>
              </motion.div>
            </div>
          </section>

          {/* INFO CARDS */}
          <section className="pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Clock3, title: copy.card1Title, description: copy.card1Desc },
                  { icon: Headset, title: copy.card2Title, description: copy.card2Desc },
                  { icon: ArrowRight, title: copy.card3Title, description: copy.card3Desc },
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
                    <h3 className="font-bold text-xl mb-3" style={{ color: colors.dark }}>
                      {item.title}
                    </h3>
                    <p className="leading-relaxed" style={{ color: colors.gray }}>
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CONTACT CONTENT */}
          <section className="py-12 lg:py-20" style={{ backgroundColor: colors.light }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-[0.95fr_1.35fr] gap-8 items-start">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="p-8 md:p-10 rounded-2xl border bg-white shadow-sm"
                  style={{ borderColor: colors.border }}
                >
                  <p
                    className="text-sm uppercase tracking-wider mb-6"
                    style={{ color: colors.gray }}
                  >
                    {copy.infoTitle}
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${colors.secondary}15` }}
                      >
                        <Mail className="w-5 h-5" style={{ color: colors.secondary }} />
                      </div>
                      <div>
                        <p className="font-semibold mb-1" style={{ color: colors.dark }}>
                          Email
                        </p>
                        <a
                          href="mailto:zentraqr@gmail.com"
                          className="transition-colors hover:opacity-70"
                          style={{ color: colors.gray }}
                        >
                          zentraqr@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${colors.secondary}15` }}
                      >
                        <Phone className="w-5 h-5" style={{ color: colors.secondary }} />
                      </div>
                      <div>
                        <p className="font-semibold mb-1" style={{ color: colors.dark }}>
                          {copy.phone}
                        </p>
                        <a
                          href="tel:+351912345678"
                          className="transition-colors hover:opacity-70"
                          style={{ color: colors.gray }}
                        >
                          +351 912 345 678
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${colors.secondary}15` }}
                      >
                        <Clock3 className="w-5 h-5" style={{ color: colors.secondary }} />
                      </div>
                      <div>
                        <p className="font-semibold mb-1" style={{ color: colors.dark }}>
                          {copy.responseTime}
                        </p>
                        <p style={{ color: colors.gray }}>{copy.responseTimeValue}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="p-8 md:p-10 rounded-2xl border bg-white shadow-sm"
                  style={{ borderColor: colors.border }}
                >
                  <p
                    className="text-sm uppercase tracking-wider mb-3"
                    style={{ color: colors.gray }}
                  >
                    {copy.formEyebrow}
                  </p>

                  <h2
                    className="text-3xl sm:text-4xl font-bold mb-4"
                    style={{ color: colors.dark }}
                  >
                    {copy.formTitle}
                  </h2>

                  <p className="text-base leading-relaxed mb-8" style={{ color: colors.gray }}>
                    {copy.formDescription}
                  </p>

                  {error && (
                    <div
                      className="mb-6 rounded-xl border px-4 py-3 text-sm"
                      style={{
                        borderColor: '#FECACA',
                        backgroundColor: '#FEF2F2',
                        color: '#B91C1C',
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label
                          className="block text-sm font-semibold mb-2"
                          style={{ color: colors.dark }}
                        >
                          {copy.name} *
                        </label>
                        <div className="relative">
                          <User
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                            style={{ color: colors.gray }}
                          />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full h-14 pl-12 pr-4 rounded-xl border bg-white outline-none transition-all"
                            style={{ borderColor: colors.border, color: colors.dark }}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          className="block text-sm font-semibold mb-2"
                          style={{ color: colors.dark }}
                        >
                          {copy.email} *
                        </label>
                        <div className="relative">
                          <Mail
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                            style={{ color: colors.gray }}
                          />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full h-14 pl-12 pr-4 rounded-xl border bg-white outline-none transition-all"
                            style={{ borderColor: colors.border, color: colors.dark }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: colors.dark }}
                      >
                        {copy.phone}{' '}
                        <span style={{ color: colors.gray, fontWeight: 400 }}>
                          ({copy.optional})
                        </span>
                      </label>
                      <div className="relative">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                          style={{ color: colors.gray }}
                        />
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full h-14 pl-12 pr-4 rounded-xl border bg-white outline-none transition-all"
                          style={{ borderColor: colors.border, color: colors.dark }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: colors.dark }}
                      >
                        {copy.message} *
                      </label>
                      <div className="relative">
                        <MessageSquare
                          className="absolute left-4 top-4 w-5 h-5"
                          style={{ color: colors.gray }}
                        />
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={6}
                          className="w-full pl-12 pr-4 py-4 rounded-xl border bg-white outline-none resize-none transition-all"
                          style={{ borderColor: colors.border, color: colors.dark }}
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: loading ? 1 : 1.01 }}
                      whileTap={{ scale: loading ? 1 : 0.99 }}
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 group shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                      style={{ backgroundColor: colors.accent, color: 'white' }}
                      data-testid="contact-submit"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {copy.sending}
                        </>
                      ) : (
                        <>
                          {copy.submit}
                          <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* FOOTER */}
      <footer
        className="py-12 border-t"
        style={{ borderColor: colors.border, backgroundColor: colors.light }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <img src={logoUrl} alt="ZentraQR Logo" className="h-10 object-contain" />
              </div>
              <p className="text-sm max-w-sm leading-relaxed" style={{ color: colors.gray }}>
                {copy.footerDescription}
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4" style={{ color: colors.dark }}>
                {copy.footerProduct}
              </h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="text-sm transition-colors hover:opacity-70"
                    style={{ color: colors.gray }}
                  >
                    {t('nav.features')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('pricing')}
                    className="text-sm transition-colors hover:opacity-70"
                    style={{ color: colors.gray }}
                  >
                    {t('nav.pricing')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/demo')}
                    className="text-sm transition-colors hover:opacity-70"
                    style={{ color: colors.gray }}
                  >
                    {t('nav.demo')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="text-sm transition-colors hover:opacity-70"
                    style={{ color: colors.gray }}
                  >
                    {t('nav.faq')}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4" style={{ color: colors.dark }}>
                {copy.footerContact}
              </h4>
              <ul className="space-y-3">
                <li className="text-sm" style={{ color: colors.gray }}>
                  zentraqr@gmail.com
                </li>
                <li className="text-sm" style={{ color: colors.gray }}>
                  +351 912 345 678
                </li>
                <li>
                  <button
                    onClick={() => navigate('/contact')}
                    className="text-sm transition-colors"
                    style={{ color: colors.accent }}
                  >
                    {copy.footerSendMessage}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4"
            style={{ borderColor: colors.border }}
          >
            <p className="text-sm" style={{ color: colors.gray }}>
              {copy.footerRights}
            </p>
            <div className="flex gap-6">
              <button
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
              >
                {copy.footerTerms}
              </button>
              <button
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
              >
                {copy.footerPrivacy}
              </button>
              <button
                onClick={() => navigate('/login')}
                className="text-sm transition-colors hover:opacity-70 font-medium"
                style={{ color: colors.accent }}
              >
                {copy.clientArea}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;