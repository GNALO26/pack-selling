'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getErrorMessage } from '@/lib/utils';

const schema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router   = useRouter();
  const setAuth  = useAuthStore(s => s.setAuth);
  const [show, setShow] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data);
      setAuth(res.data.user, res.data.token);
      toast.success(`Bienvenue, ${res.data.user.firstName} !`);
      router.push(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.includes('non vérifié')) {
        toast.error('Vérifiez votre email avant de vous connecter.');
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-navy">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold-DEFAULT/20 border border-gold-DEFAULT/30 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7 text-gold-DEFAULT" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Connexion</h1>
          <p className="text-white/50 text-sm">Accédez à votre espace Pack Digital 360</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="label text-white/80">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                {...register('email')}
                type="email"
                placeholder="votre@email.com"
                autoComplete="email"
                className="input pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-gold-DEFAULT/50 focus:border-gold-DEFAULT/50"
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="label text-white/80">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                {...register('password')}
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                className="input pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-gold-DEFAULT/50 focus:border-gold-DEFAULT/50"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <Link href="/forgot-password" className="text-gold-DEFAULT/70 hover:text-gold-DEFAULT text-xs transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold w-full py-3.5 text-base"
          >
            {isSubmitting ? (
              <><div className="spinner" /> Connexion...</>
            ) : (
              <><LogIn className="w-5 h-5" /> Se connecter</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider my-6">
          <span className="text-white/30 text-xs px-2">ou</span>
        </div>

        {/* Register link */}
        <p className="text-center text-white/50 text-sm">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-gold-DEFAULT hover:text-gold-DEFAULT/80 font-semibold transition-colors">
            Créer un compte
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
