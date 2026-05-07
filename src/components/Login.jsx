import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const LOGO_URL = "https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg";
  const NAME_URL = "https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-secondary.webp";

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-soft p-10 rounded-3xl border border-surface-edge shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          {/* Logo Principal */}
          <div className="w-24 h-24 mb-6 drop-shadow-xl">
            <img 
              src={LOGO_URL} 
              alt="IHASIA Logo" 
              className="w-full h-full object-contain invert brightness-200"
            />
          </div>
          
          {/* Imagen del Nombre / Branding */}
          <div className="h-12 mb-2">
            <img 
              src={NAME_URL} 
              alt="IHASIA" 
              className="h-full object-contain brightness-110"
            />
          </div>
          
          <p className="text-gray-400 font-medium tracking-wide uppercase text-[10px]">
            Diving Center Management System
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm text-center animate-pulse">
              {error === "Invalid login credentials" ? "Credenciales inválidas" : error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-surface-edge rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all shadow-inner"
              placeholder="admin@ihasiakohtao.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-surface-edge rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all shadow-inner"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg shadow-brand/20 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cargando...
              </span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Acceder al Sistema
              </>
            )}
          </button>
        </form>
        
        <div className="mt-12 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-surface-edge to-transparent mb-6" />
          <p className="text-[10px] text-gray-500 font-medium tracking-tighter uppercase">
            Experimental Phase v1.0 • Exclusive Access for Authorized Staff
          </p>
        </div>
      </div>
    </div>
  );
}
