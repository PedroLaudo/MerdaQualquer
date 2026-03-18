import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ShieldCheck,
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

const PrivacyPage = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copy =
    language === 'pt'
      ? {
          badge: 'Informação legal',
          heroTitle1: 'Política de',
          heroTitle2: 'Privacidade',
          heroDescription:
            'Esta Política explica como a ZentraQR recolhe, utiliza, armazena e protege dados pessoais quando visita o nosso website, usa a plataforma ou interage connosco.',
          footerDescription: 'Soluções digitais para atendimento e gestão.',
          footerProduct: 'Produto',
          footerContact: 'Contacto',
          footerSendMessage: 'Enviar mensagem',
          footerRights: '© 2026 ZentraQR. Todos os direitos reservados.',
          footerTerms: 'Termos',
          footerPrivacy: 'Privacidade',
          clientArea: 'Área de Clientes →',
          contactTitle: 'Questões sobre privacidade',
        }
      : {
          badge: 'Legal information',
          heroTitle1: 'Privacy',
          heroTitle2: 'Policy',
          heroDescription:
            'This Policy explains how ZentraQR collects, uses, stores, and protects personal data when you visit our website, use the platform, or interact with us.',
          footerDescription: 'Digital solutions for service and operations.',
          footerProduct: 'Product',
          footerContact: 'Contact',
          footerSendMessage: 'Send message',
          footerRights: '© 2026 ZentraQR. All rights reserved.',
          footerTerms: 'Terms',
          footerPrivacy: 'Privacy',
          clientArea: 'Client Area →',
          contactTitle: 'Privacy questions',
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
              <ShieldCheck className="w-4 h-4" style={{ color: colors.accent }} />
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

            <Section title="1. Who We Are">
              <p>
                ZentraQR (“ZentraQR”, “we”, “us”, or “our”) is a platform that provides digital tools
                for hospitality businesses, including QR menus, ordering flows, and operational
                features.
              </p>
              <p><strong>Data Controller</strong></p>
              <p>Legal name: [INSERT LEGAL COMPANY NAME]</p>
              <p>Registered address: [INSERT ADDRESS]</p>
              <p>VAT / NIF: [INSERT VAT / NIF]</p>
              <p>Email: [INSERT PRIVACY EMAIL]</p>
            </Section>

            <Section title="2. Scope of This Policy">
              <p>This Privacy Policy applies to personal data collected through:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>our website;</li>
                <li>our software platform;</li>
                <li>account registration and management;</li>
                <li>demos, inquiries, and contact forms;</li>
                <li>communications with us;</li>
                <li>analytics, cookies, and similar technologies;</li>
                <li>restaurant-facing and end-user interactions where applicable.</li>
              </ul>
            </Section>

            <Section title="3. Personal Data We Collect">
              <p>Depending on how you interact with us, we may collect the following categories of personal data:</p>

              <p><strong>A. Information you provide directly</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>name;</li>
                <li>email address;</li>
                <li>phone number;</li>
                <li>company or restaurant name;</li>
                <li>billing details;</li>
                <li>account credentials;</li>
                <li>support messages;</li>
                <li>information submitted through forms or communications.</li>
              </ul>

              <p><strong>B. Business and account information</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>user role and permissions;</li>
                <li>restaurant profile details;</li>
                <li>menu and operational settings;</li>
                <li>subscription and billing status;</li>
                <li>service usage history.</li>
              </ul>

              <p><strong>C. Technical and usage data</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP address;</li>
                <li>browser type and version;</li>
                <li>device information;</li>
                <li>operating system;</li>
                <li>referral URLs;</li>
                <li>pages viewed;</li>
                <li>session activity;</li>
                <li>timestamps;</li>
                <li>approximate location derived from IP;</li>
                <li>log data and diagnostic information.</li>
              </ul>

              <p><strong>D. Customer interaction data</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>table number or location reference;</li>
                <li>order details;</li>
                <li>order notes;</li>
                <li>customer contact details when entered;</li>
                <li>interaction timestamps.</li>
              </ul>

              <p><strong>E. Cookies and similar technologies</strong></p>
              <p>
                We may collect information through cookies, pixels, tags, SDKs, or similar tools for
                essential functionality, analytics, performance, and marketing, depending on the
                technologies in use on the site.
              </p>
            </Section>

            <Section title="4. How We Use Personal Data">
              <ul className="list-disc pl-6 space-y-2">
                <li>provide and operate the Services;</li>
                <li>create and manage accounts;</li>
                <li>process subscriptions and billing;</li>
                <li>respond to inquiries and support requests;</li>
                <li>improve performance, usability, and security;</li>
                <li>monitor usage and prevent abuse or fraud;</li>
                <li>communicate product updates, service notices, and administrative messages;</li>
                <li>send marketing communications where permitted by law;</li>
                <li>comply with legal obligations;</li>
                <li>enforce our Terms and protect our rights.</li>
              </ul>
            </Section>

            <Section title="5. Legal Bases for Processing">
              <p>Where the GDPR applies, we rely on one or more of the following legal bases:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Contract</strong>: when processing is necessary to provide the Services or respond to your request before entering a contract;</li>
                <li><strong>Legitimate interests</strong>: for platform security, service improvement, fraud prevention, analytics, and business operations;</li>
                <li><strong>Legal obligation</strong>: when we must comply with tax, accounting, regulatory, or law enforcement requirements;</li>
                <li><strong>Consent</strong>: where required, for example for certain cookies or direct marketing communications.</li>
              </ul>
            </Section>

            <Section title="6. Cookies">
              <p>We may use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>keep the website and platform functioning properly;</li>
                <li>remember preferences;</li>
                <li>understand traffic and usage patterns;</li>
                <li>improve user experience;</li>
                <li>measure marketing and campaign performance.</li>
              </ul>
              <p>
                Where required by law, we will request your consent before placing non-essential
                cookies on your device.
              </p>
            </Section>

            <Section title="7. How We Share Personal Data">
              <p>We may share personal data with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>hosting and cloud infrastructure providers;</li>
                <li>analytics providers;</li>
                <li>customer support tools;</li>
                <li>payment processors;</li>
                <li>email and communications providers;</li>
                <li>contractors and service providers acting on our instructions;</li>
                <li>legal, regulatory, or public authorities when required by law;</li>
                <li>potential investors, buyers, or acquirers in connection with a business transaction.</li>
              </ul>
            </Section>

            <Section title="8. Processors and Restaurant Clients">
              <p>
                In some situations, ZentraQR acts as a <strong>data processor</strong> on behalf of
                restaurant or hospitality clients who use our platform.
              </p>
              <p>
                If you are an end customer placing an order or interacting with a restaurant through
                ZentraQR, the relevant restaurant may be the primary controller of your data for
                order fulfilment and customer service purposes.
              </p>
            </Section>

            <Section title="9. International Data Transfers">
              <p>
                Your personal data may be processed in countries outside your own, including outside
                the European Economic Area, depending on our service providers.
              </p>
            </Section>

            <Section title="10. Data Retention">
              <p>
                We retain personal data only for as long as necessary for the purposes described in
                this Privacy Policy.
              </p>
            </Section>

            <Section title="11. Security">
              <p>
                We use reasonable technical and organizational measures designed to protect personal
                data against unauthorized access, loss, misuse, alteration, or disclosure.
              </p>
            </Section>

            <Section title="12. Your Rights">
              <p>If the GDPR or similar privacy laws apply to you, you may have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>access your personal data;</li>
                <li>rectify inaccurate or incomplete data;</li>
                <li>request erasure;</li>
                <li>restrict processing;</li>
                <li>object to certain processing;</li>
                <li>request data portability;</li>
                <li>withdraw consent at any time;</li>
                <li>lodge a complaint with a supervisory authority.</li>
              </ul>
            </Section>

            <Section title="13. Marketing Communications">
              <p>
                We may send marketing emails or similar communications where permitted by law. You
                can opt out at any time by clicking the unsubscribe link in our communications or by
                contacting us directly.
              </p>
            </Section>

            <Section title="14. Children’s Privacy">
              <p>
                Our Services are not directed to children, and we do not knowingly collect personal
                data from children without appropriate legal basis or authorization.
              </p>
            </Section>

            <Section title="15. Third-Party Links and Services">
              <p>
                Our website or platform may contain links to third-party websites or services. We are
                not responsible for their privacy practices, content, or security.
              </p>
            </Section>

            <Section title="16. Changes to This Privacy Policy">
              <p>
                We may update this Privacy Policy from time to time. When we do, we will post the
                revised version on this page and update the “Last updated” date.
              </p>
            </Section>

            <Section title="17. Contact Us">
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: colors.light, border: `1px solid ${colors.border}` }}
              >
                <p className="font-semibold mb-3" style={{ color: colors.dark }}>
                  {copy.contactTitle}
                </p>
                <div className="space-y-2" style={{ color: colors.gray }}>
                  <p>[INSERT PRIVACY EMAIL]</p>
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

export default PrivacyPage;