import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import {
  FileText,
  Menu,
  X,
  ChevronDown,
  Globe,
  Check,
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

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2
      className="text-2xl md:text-3xl font-bold mb-4"
      style={{ color: colors.dark }}
    >
      {title}
    </h2>
    <div className="space-y-4 text-sm md:text-base leading-8" style={{ color: colors.gray }}>
      {children}
    </div>
  </section>
);

const TermsPage = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copy =
    language === 'pt'
      ? {
          badge: 'Informação legal',
          heroTitle1: 'Termos de',
          heroTitle2: 'Serviço',
          heroDescription:
            'Estes Termos regulam o acesso e a utilização da ZentraQR, incluindo o website, a plataforma e os serviços relacionados.',
          footerDescription: 'Soluções digitais para atendimento e gestão.',
          footerProduct: 'Produto',
          footerContact: 'Contacto',
          footerSendMessage: 'Enviar mensagem',
          footerRights: '© 2026 ZentraQR. Todos os direitos reservados.',
          footerTerms: 'Termos',
          footerPrivacy: 'Privacidade',
          clientArea: 'Área de Clientes →',
          contactTitle: 'Questões sobre estes Termos',
        }
      : {
          badge: 'Legal information',
          heroTitle1: 'Terms of',
          heroTitle2: 'Service',
          heroDescription:
            'These Terms govern access to and use of ZentraQR, including the website, platform, and related services.',
          footerDescription: 'Digital solutions for service and operations.',
          footerProduct: 'Product',
          footerContact: 'Contact',
          footerSendMessage: 'Send message',
          footerRights: '© 2026 ZentraQR. All rights reserved.',
          footerTerms: 'Terms',
          footerPrivacy: 'Privacy',
          clientArea: 'Client Area →',
          contactTitle: 'Questions about these Terms',
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.white }}>
      {/* NAVBAR - same as landing/contact */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b"
        style={{ borderColor: colors.border }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src={logoUrl} alt="ZentraQR Logo" className="h-10 object-contain" />
            </div>

            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('features')}
                className="font-medium text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
              >
                {t('nav.features')}
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="font-medium text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
              >
                {t('nav.pricing')}
              </button>
              <button
                onClick={() => navigate('/demo')}
                className="font-medium text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
              >
                {t('nav.demo')}
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="font-medium text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
              >
                {t('nav.faq')}
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="font-medium text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
              >
                {t('nav.contact')}
              </button>

              <LanguageSelector language={language} setLanguage={setLanguage} />
            </div>

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
                  style={{ color: colors.gray }}
                >
                  {t('nav.contact')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO */}
      <section className="relative pt-24 pb-10 lg:pt-32 lg:pb-14 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(30,42,74,0.08) 0%, rgba(30,42,74,0.02) 18%, rgba(255,255,255,0) 38%)',
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
              style={{ borderColor: colors.border, backgroundColor: colors.light }}
            >
              <FileText className="w-4 h-4" style={{ color: colors.accent }} />
              <span className="text-sm font-medium" style={{ color: colors.dark }}>
                {copy.badge}
              </span>
            </motion.div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6"
              style={{ color: colors.dark }}
            >
              {copy.heroTitle1} <span style={{ color: colors.accent }}>{copy.heroTitle2}</span>
            </h1>

            <p className="text-lg sm:text-xl max-w-3xl leading-relaxed" style={{ color: colors.gray }}>
              {copy.heroDescription}
            </p>
          </motion.div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="pb-16 lg:pb-20" style={{ backgroundColor: colors.light }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="rounded-3xl border bg-white p-8 md:p-12 shadow-sm"
            style={{ borderColor: colors.border }}
          >
            <p className="text-sm mb-8" style={{ color: colors.gray }}>
              Last updated: 18 March 2026
            </p>

            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using ZentraQR, including the website <strong>zentraqr.com</strong>,
                the ZentraQR platform, and any related services, features, or content
                (collectively, the “Services”), you agree to be bound by these Terms of Service
                (“Terms”).
              </p>
              <p>If you do not agree to these Terms, you must not use the Services.</p>
            </Section>

            <Section title="2. Who We Are">
              <p>
                ZentraQR (“ZentraQR”, “we”, “us”, or “our”) provides digital tools for hospitality
                businesses, including QR menus, ordering experiences, menu management, and related
                operational features.
              </p>
              <p><strong>Operator details</strong></p>
              <p>Legal name: [INSERT LEGAL COMPANY NAME]</p>
              <p>Registered address: [INSERT ADDRESS]</p>
              <p>Tax / VAT number: [INSERT VAT / NIF]</p>
              <p>Contact email: [INSERT CONTACT EMAIL]</p>
            </Section>

            <Section title="3. Eligibility">
              <p>
                You may use the Services only if you are legally able to enter into a binding
                contract on behalf of yourself or the business you represent.
              </p>
              <p>
                If you use the Services on behalf of a company, restaurant, café, hotel, or other
                entity, you represent and warrant that you have authority to bind that entity to
                these Terms.
              </p>
            </Section>

            <Section title="4. Our Services">
              <p>
                ZentraQR provides software and related digital services designed to help hospitality
                businesses manage and present menus, enable QR-based customer interactions, and
                streamline ordering and service workflows.
              </p>
              <p>
                We may update, improve, remove, or modify features from time to time. We do not
                guarantee that any specific feature will always be available.
              </p>
            </Section>

            <Section title="5. Account Registration">
              <p>To access some parts of the Services, you may need to create an account.</p>
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>provide accurate and complete information;</li>
                <li>keep your login credentials secure;</li>
                <li>promptly update any information that changes;</li>
                <li>be responsible for all activity under your account.</li>
              </ul>
              <p>
                You must notify us immediately if you believe your account has been accessed without
                authorization.
              </p>
            </Section>

            <Section title="6. Business Data and Content">
              <p>
                You may upload or submit content and data through the Services, including menu items,
                product descriptions, prices, allergens and dietary information, images, branding
                assets, operating details, and customer-facing text.
              </p>
              <p>
                You retain ownership of your content. However, you grant ZentraQR a non-exclusive,
                worldwide, royalty-free license to host, process, reproduce, adapt, display, and use
                that content solely as necessary to provide, maintain, improve, and support the
                Services.
              </p>
              <p>
                You are solely responsible for the content you upload and for ensuring it is accurate,
                lawful, and up to date.
              </p>
            </Section>

            <Section title="7. Customer Orders and Restaurant Responsibility">
              <p>
                ZentraQR may facilitate menu display, order capture, and communication workflows.
                Unless explicitly agreed otherwise in writing, ZentraQR is not the merchant of record
                for restaurant sales and is not responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>food preparation;</li>
                <li>stock availability;</li>
                <li>pricing mistakes entered by the restaurant;</li>
                <li>order fulfilment;</li>
                <li>delivery or pickup execution;</li>
                <li>food safety;</li>
                <li>allergen accuracy;</li>
                <li>local legal compliance of restaurant operations.</li>
              </ul>
              <p>
                Each business using the Services remains fully responsible for its own products,
                prices, tax obligations, consumer disclosures, and regulatory compliance.
              </p>
            </Section>

            <Section title="8. Fees and Payment">
              <p>Certain features may require a paid subscription or other fees.</p>
              <p>
                By subscribing to a paid plan, you agree to pay all applicable fees as described at
                the time of purchase. Unless stated otherwise:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>fees are billed in advance;</li>
                <li>subscriptions renew automatically until cancelled;</li>
                <li>fees are non-refundable except where required by law or expressly stated by us.</li>
              </ul>
              <p>
                We may change pricing in the future. If we do, we will provide notice before the new
                pricing takes effect for your next billing cycle.
              </p>
            </Section>

            <Section title="9. Acceptable Use">
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>use the Services for any unlawful, harmful, fraudulent, or deceptive purpose;</li>
                <li>upload false, misleading, defamatory, infringing, or illegal content;</li>
                <li>interfere with or disrupt the Services or servers;</li>
                <li>attempt to gain unauthorized access to accounts, systems, or data;</li>
                <li>reverse engineer, copy, scrape, or exploit the Services except as permitted by law;</li>
                <li>use the Services to transmit malware, spam, or abusive communications;</li>
                <li>infringe the intellectual property or privacy rights of others.</li>
              </ul>
            </Section>

            <Section title="10. Integrations and Third-Party Services">
              <p>
                The Services may integrate with or rely on third-party providers, such as hosting
                providers, analytics tools, payment processors, communication tools, maps, or other
                external services.
              </p>
              <p>
                We are not responsible for third-party services and do not guarantee their
                availability, accuracy, or performance.
              </p>
            </Section>

            <Section title="11. Intellectual Property">
              <p>
                All rights, title, and interest in and to the Services, including the software,
                design, branding, logos, interface elements, documentation, and underlying
                technology, are owned by or licensed to ZentraQR.
              </p>
            </Section>

            <Section title="12. Availability and Support">
              <p>
                We aim to provide a reliable service, but we do not guarantee that the Services will
                be uninterrupted, error-free, or available at all times.
              </p>
            </Section>

            <Section title="13. Termination">
              <p>You may stop using the Services at any time.</p>
              <p>
                We may suspend or terminate your access, with or without notice, if you breach these
                Terms, payment is overdue, your use creates legal or security risk, or we discontinue
                the Services.
              </p>
            </Section>

            <Section title="14. Disclaimers">
              <p>
                The Services are provided on an <strong>“as is”</strong> and{' '}
                <strong>“as available”</strong> basis to the fullest extent permitted by law.
              </p>
            </Section>

            <Section title="15. Limitation of Liability">
              <p>
                To the fullest extent permitted by law, ZentraQR shall not be liable for indirect,
                incidental, special, consequential, exemplary, or punitive damages.
              </p>
            </Section>

            <Section title="16. Privacy">
              <p>Your use of the Services is also subject to our Privacy Policy.</p>
            </Section>

            <Section title="17. Governing Law and Jurisdiction">
              <p>
                These Terms are governed by the laws of Portugal, unless mandatory local consumer law
                requires otherwise.
              </p>
            </Section>

            <Section title="18. Contact">
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: colors.light, border: `1px solid ${colors.border}` }}
              >
                <p className="font-semibold mb-3" style={{ color: colors.dark }}>
                  {copy.contactTitle}
                </p>
                <div className="space-y-2" style={{ color: colors.gray }}>
                  <p>[INSERT CONTACT EMAIL]</p>
                  <p>[INSERT LEGAL COMPANY NAME]</p>
                  <p>[INSERT ADDRESS]</p>
                </div>
              </div>
            </Section>
          </motion.div>
        </div>
      </section>

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
                onClick={() => navigate('/terms')}
              >
                {copy.footerTerms}
              </button>
              <button
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: colors.gray }}
                onClick={() => navigate('/privacy')}
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

export default TermsPage;