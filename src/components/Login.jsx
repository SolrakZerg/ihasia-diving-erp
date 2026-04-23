import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn, Waves, UserPlus } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Registration successful! Check your email to confirm (if enabled) or try logging in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-soft p-8 rounded-2xl border border-surface-edge shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand/20 rounded-2xl flex items-center justify-center mb-4 border border-brand/30">
            <Waves className="w-10 h-10 text-brand" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">IHASIA ERP</h1>
          <p className="text-gray-400 mt-2">Diving Center Management System</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg text-sm">
              {message}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              placeholder="admin@ihasiakohtao.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? 'Processing...' : (
              <>
                {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                {isSignUp ? 'Create Account' : 'Access System'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-gray-400 hover:text-brand text-sm transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create one'}
          </button>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          Experimental Phase v1.0 • Built by IHASIA
        </div>
      </div>
    </div>
  );
}
