import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

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

const logoUrl = '/logo.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const { language } = useLanguage();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const copy =
    language === 'pt'
      ? {
          badge: 'Recuperação de acesso',
          title: 'Recuperar password',
          description:
            'Introduza o seu email para receber um link de recuperação e voltar a aceder à sua conta.',
          email: 'Email',
          placeholder: 'nome@exemplo.com',
          submit: 'Enviar link',
          loading: 'A enviar...',
          back: 'Voltar ao login',
          successBadge: 'Email enviado',
          successTitle: 'Verifique o seu email',
          successBack: 'Voltar ao login',
          sideTitle1: 'Acesso seguro à',
          sideTitle2: 'sua conta',
          sideDescription:
            'Se a sua conta existir, iremos enviar um link de recuperação para o email indicado.',
          errorFallback: 'Ocorreu um erro. Tente novamente.',
        }
      : {
          badge: 'Account recovery',
          title: 'Recover password',
          description:
            'Enter your email to receive a recovery link and regain access to your account.',
          email: 'Email',
          placeholder: 'name@example.com',
          submit: 'Send link',
          loading: 'Sending...',
          back: 'Back to login',
          successBadge: 'Email sent',
          successTitle: 'Check your email',
          successBack: 'Back to login',
          sideTitle1: 'Secure access to',
          sideTitle2: 'your account',
          sideDescription:
            'If your account exists, we will send a recovery link to the email you entered.',
          errorFallback: 'Something went wrong. Please try again.',
        };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.error || copy.errorFallback);
      }
    } catch (error) {
      setStatus('error');
      setMessage(copy.errorFallback);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: colors.light }}>
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-120px] left-[-60px] w-[280px] h-[280px] rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: colors.secondary }}
        />
        <div
          className="absolute bottom-[-120px] right-[-60px] w-[320px] h-[320px] rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: colors.primary }}
        />
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between px-10 xl:px-16 py-10">
          <button onClick={() => navigate('/')} className="flex items-center">
            <img src={logoUrl} alt="ZentraQR Logo" className="h-10 object-contain" />
          </button>

          <div className="max-w-xl">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
              style={{ borderColor: colors.border, backgroundColor: colors.white }}
            >
              <Mail className="w-4 h-4" style={{ color: colors.accent }} />
              <span className="text-sm font-medium" style={{ color: colors.dark }}>
                {copy.badge}
              </span>
            </div>

            <h1
              className="text-4xl xl:text-5xl font-bold leading-[1.1] mb-6"
              style={{ color: colors.dark }}
            >
              {copy.sideTitle1}{' '}
              <span style={{ color: colors.accent }}>{copy.sideTitle2}</span>
            </h1>

            <p className="text-lg leading-relaxed max-w-lg" style={{ color: colors.gray }}>
              {copy.sideDescription}
            </p>
          </div>

          <div className="text-sm" style={{ color: colors.gray }}>
            © 2026 ZentraQR
          </div>
        </div>

        <div className="flex items-center justify-center px-4 sm:px-6 lg:px-10 py-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div
              className="rounded-[28px] border bg-white p-8 md:p-10 shadow-[0_20px_60px_rgba(30,42,74,0.08)]"
              style={{ borderColor: colors.border }}
            >
              <div className="lg:hidden mb-8">
                <button onClick={() => navigate('/')} className="flex items-center mb-6">
                  <img src={logoUrl} alt="ZentraQR Logo" className="h-10 object-contain" />
                </button>
              </div>

              {status === 'success' ? (
                <div className="text-center">
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
                    style={{ borderColor: colors.border, backgroundColor: colors.light }}
                  >
                    <CheckCircle2 className="w-4 h-4" style={{ color: colors.accent }} />
                    <span className="text-sm font-medium" style={{ color: colors.dark }}>
                      {copy.successBadge}
                    </span>
                  </div>

                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: `${colors.primary}10` }}
                  >
                    <CheckCircle2 className="w-8 h-8" style={{ color: colors.primary }} />
                  </div>

                  <h2
                    className="text-3xl font-bold tracking-tight mb-4"
                    style={{ color: colors.dark }}
                  >
                    {copy.successTitle}
                  </h2>

                  <p className="leading-relaxed mb-8" style={{ color: colors.gray }}>
                    {message}
                  </p>

                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-4 rounded-full font-bold text-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: colors.accent, color: colors.white }}
                  >
                    {copy.successBack}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-5"
                      style={{ borderColor: colors.border, backgroundColor: colors.light }}
                    >
                      <Mail className="w-4 h-4" style={{ color: colors.accent }} />
                      <span className="text-sm font-medium" style={{ color: colors.dark }}>
                        {copy.badge}
                      </span>
                    </div>

                    <h2
                      className="text-3xl font-bold tracking-tight mb-3"
                      style={{ color: colors.dark }}
                    >
                      {copy.title}
                    </h2>

                    <p className="text-sm leading-relaxed" style={{ color: colors.gray }}>
                      {copy.description}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {status === 'error' && (
                      <div
                        className="rounded-2xl border px-4 py-3 text-sm"
                        style={{
                          borderColor: '#FECACA',
                          backgroundColor: '#FEF2F2',
                          color: '#B91C1C',
                        }}
                      >
                        {message}
                      </div>
                    )}

                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: colors.dark }}
                      >
                        {copy.email}
                      </label>

                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                          style={{ color: colors.gray }}
                        />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 rounded-2xl border bg-white outline-none transition-all"
                          style={{
                            borderColor: colors.border,
                            color: colors.dark,
                            boxShadow: 'none',
                          }}
                          placeholder={copy.placeholder}
                          onFocus={(e) => {
                            e.target.style.borderColor = colors.secondary;
                            e.target.style.boxShadow = '0 0 0 4px rgba(59, 89, 152, 0.12)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = colors.border;
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full py-4 rounded-full font-bold text-lg transition-all hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: colors.accent, color: colors.white }}
                    >
                      {status === 'loading' ? copy.loading : copy.submit}
                    </button>
                  </form>

                  <button
                    onClick={() => navigate('/login')}
                    className="mt-6 inline-flex items-center text-sm font-medium transition-colors hover:opacity-70"
                    style={{ color: colors.gray }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {copy.back}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;