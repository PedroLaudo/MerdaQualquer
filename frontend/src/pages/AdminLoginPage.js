import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Extraímos também o isAuthenticated e o loading do AuthContext
  const { login, isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Efeito que verifica se o utilizador já tem sessão iniciada
  useEffect(() => {
    // Se a verificação de sessão terminou e o utilizador está autenticado, avança direto
    if (!loading && isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast({ title: "Zentra", description: t('login.toastSuccess') });
        navigate('/admin/dashboard');
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error || t('login.toastError'),
        });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: t('login.toastConnError') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* LADO ESQUERDO: Formulário */}
      <div className="flex w-full flex-col justify-center px-8 md:w-[450px] lg:w-[600px] xl:w-[700px]">
        <div className="mx-auto w-full max-w-[400px] space-y-6">
          <div className="flex flex-col space-y-2 text-left">
            <img
              src="/logo.png"
              alt="Zentra Logo"
              className="h-12 w-auto mb-4 self-start"
            />
            <h1 className="text-3xl font-bold tracking-tight">{t('login.title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('login.description')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('login.passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('Forgot Password') ?? 'Esqueceu-se da password?'}
              </button>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground font-medium"
              disabled={isLoading}
            >
              {isLoading ? t('login.buttonLoading') : t('login.button')}
            </Button>
          </form>

          <p className="px-8 text-center text-sm text-muted-foreground">
            {t('login.footer')}
          </p>
        </div>
      </div>

      {/* LADO DIREITO: Imagem */}
      <div className="relative hidden w-full bg-muted lg:block">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
          alt="Restaurante Interior"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.7]"
        />
        <div className="absolute inset-0 flex items-end p-12 bg-gradient-to-t from-black/60 to-transparent">
          <blockquote className="space-y-2 text-white">
            <p className="text-lg italic font-light">
              {t('login.quote')}
            </p>
            <footer className="text-sm font-semibold">— Equipa Zentra QR</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
