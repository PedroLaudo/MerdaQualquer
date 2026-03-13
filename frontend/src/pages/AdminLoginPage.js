import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { LogIn } from "lucide-react";

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
        navigate('/backoffice');
      } else {
        toast({ variant: "destructive", title: "Erro", description: "Credenciais inválidas." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha na conexão com o servidor." });
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
            {/* Logo da Zentra */}
            <img 
              src="/logo.png" 
              alt="Zentra Logo" 
              className="h-12 w-auto mb-4 self-start"
            />
            <h1 className="text-3xl font-bold tracking-tight">Login de Cliente</h1>
            <p className="text-muted-foreground text-sm">
              Introduza as suas credenciais para gerir o seu restaurante.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-primary text-primary-foreground font-medium" 
              disabled={isLoading}
            >
              {isLoading ? "A entrar..." : "Entrar na conta"}
            </Button>
          </form>
          
          <p className="px-8 text-center text-sm text-muted-foreground">
            Ao entrar, concorda com os nossos Termos de Serviço e Política de Privacidade.
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
              "A Zentra revolucionou a forma como gerimos os pedidos e a experiência dos nossos clientes à mesa."
            </p>
            <footer className="text-sm font-semibold">— Equipa Zentra QR</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;