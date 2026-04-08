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
type F = z.infer<typeof schema>;

export default function LoginPage() {
  const router  = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    try {
      const res = await authApi.login(data);
      setAuth(res.data.user, res.data.token);
      toast.success(`ACCÈS AUTORISÉ`);
      router.push(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <motion.div initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }} className="w-full max-w-md">
      <div className="card corners p-8" style={{ border:'1px solid rgba(0,212,255,0.15)' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center anim-pulse-c"
            style={{ background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.25)', clipPath:'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)' }}>
            <LogIn className="w-6 h-6" style={{ color:'var(--cyan)' }} />
          </div>
          <h1 className="text-xl mb-1" style={{ fontFamily:'Orbitron,monospace', color:'var(--cyan)' }}>CONNEXION</h1>
          <p className="text-sm" style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>Accédez à votre espace GUI-LOK DEV</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'var(--text-3)' }} />
              <input {...register('email')} type="email" placeholder="votre@email.com" autoComplete="email"
                className={`input pl-10 ${errors.email ? 'input-error' : ''}`} />
            </div>
            {errors.email && <p className="text-xs mt-1" style={{ color:'var(--magenta)' }}>{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'var(--text-3)' }} />
              <input {...register('password')} type={show?'text':'password'} placeholder="••••••••" autoComplete="current-password"
                className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`} />
              <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color:'var(--text-3)' }} onMouseEnter={e=>(e.currentTarget.style.color='var(--cyan)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-3)')}>
                {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
            {errors.password && <p className="text-xs mt-1" style={{ color:'var(--magenta)' }}>{errors.password.message}</p>}
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-xs tracking-wider" style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace' }}
              onMouseEnter={e=>(e.currentTarget.style.color='var(--cyan)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-3)')}>
              Mot de passe oublié ?
            </Link>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 justify-center">
            {isSubmitting ? <><div className="spinner"/>&nbsp;Connexion...</> : <><LogIn className="w-4 h-4"/> SE CONNECTER</>}
          </button>
        </form>

        <div className="divider"><span className="text-xs px-2" style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace' }}>ou</span></div>

        <p className="text-center text-sm" style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-bold transition-colors" style={{ color:'var(--cyan)' }}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--magenta)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--cyan)')}>
            Créer un compte
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
