'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getErrorMessage } from '@/lib/utils';

const schema = z.object({
  firstName: z.string().min(2,'Prénom requis'),
  lastName:  z.string().min(2,'Nom requis'),
  email:     z.string().email('Email invalide'),
  phone:     z.string().optional(),
  password:  z.string().min(8,'Minimum 8 caractères'),
  confirm:   z.string(),
}).refine(d=>d.password===d.confirm,{ message:'Les mots de passe ne correspondent pas', path:['confirm'] });
type F = z.infer<typeof schema>;

export default function RegisterPage() {
  const router  = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [done, setDone]   = useState(false);
  const [email, setEmail] = useState('');
  const [show, setShow]   = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    try {
      const res = await authApi.register({
        firstName: data.firstName, lastName: data.lastName,
        email: data.email, password: data.password, phone: data.phone,
      });
      // Si le serveur retourne un token (SKIP_EMAIL_VERIFY=true) → connexion directe
      if ((res.data as any).autoLogin && (res.data as any).token) {
        setAuth((res.data as any).user, (res.data as any).token);
        toast.success('Compte créé — Bienvenue !');
        router.push('/dashboard');
      } else {
        setEmail(data.email);
        setDone(true);
      }
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (done) return (
    <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} className="w-full max-w-md">
      <div className="card corners p-10 text-center" style={{ border:'1px solid rgba(0,255,136,0.2)' }}>
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background:'rgba(0,255,136,0.1)', border:'2px solid rgba(0,255,136,0.35)' }}>
          <CheckCircle className="w-10 h-10" style={{ color:'var(--green)' }}/>
        </div>
        <h1 className="text-xl mb-3" style={{ fontFamily:'Orbitron,monospace', color:'var(--green)' }}>EMAIL ENVOYÉ</h1>
        <p className="mb-2 text-sm" style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>Vérifiez votre boîte mail :</p>
        <p className="font-bold mb-6 text-sm" style={{ color:'var(--cyan)', fontFamily:'JetBrains Mono,monospace' }}>{email}</p>
        <p className="text-sm mb-8" style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>
          Cliquez sur le lien de confirmation pour activer votre compte. Valable <strong style={{color:'var(--text-1)'}}>24 heures</strong>.
        </p>
        <Link href="/login" className="btn-outline w-full justify-center">Retour à la connexion</Link>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{opacity:0,y:32}} animate={{opacity:1,y:0}} transition={{duration:.5}} className="w-full max-w-md">
      <div className="card corners p-8" style={{ border:'1px solid rgba(0,212,255,0.15)' }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center"
            style={{ background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.25)', clipPath:'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)' }}>
            <UserPlus className="w-6 h-6" style={{ color:'var(--cyan)' }}/>
          </div>
          <h1 className="text-xl mb-1" style={{ fontFamily:'Orbitron,monospace', color:'var(--cyan)' }}>CRÉER UN COMPTE</h1>
          <p className="text-sm" style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>Accédez aux guides GUI-LOK DEV</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Prénom</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text-3)'}}/>
                <input {...register('firstName')} placeholder="Olympe" className={`input pl-9 text-sm ${errors.firstName?'input-error':''}`}/>
              </div>
              {errors.firstName && <p className="text-xs mt-1" style={{color:'var(--magenta)'}}>{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label text-xs">Nom</label>
              <input {...register('lastName')} placeholder="GUIDO" className={`input text-sm ${errors.lastName?'input-error':''}`}/>
              {errors.lastName && <p className="text-xs mt-1" style={{color:'var(--magenta)'}}>{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="label text-xs">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text-3)'}}/>
              <input {...register('email')} type="email" placeholder="votre@email.com"
                className={`input pl-9 text-sm ${errors.email?'input-error':''}`}/>
            </div>
            {errors.email && <p className="text-xs mt-1" style={{color:'var(--magenta)'}}>{errors.email.message}</p>}
          </div>

          <div>
            <label className="label text-xs">Téléphone <span style={{color:'var(--text-3)'}}>(optionnel)</span></label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text-3)'}}/>
              <input {...register('phone')} type="tel" placeholder="+229 XX XX XX XX" className="input pl-9 text-sm"/>
            </div>
          </div>

          <div>
            <label className="label text-xs">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text-3)'}}/>
              <input {...register('password')} type={show?'text':'password'} placeholder="Minimum 8 caractères"
                className={`input pl-9 pr-9 text-sm ${errors.password?'input-error':''}`}/>
              <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'var(--text-3)'}}>
                {show?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
              </button>
            </div>
            {errors.password && <p className="text-xs mt-1" style={{color:'var(--magenta)'}}>{errors.password.message}</p>}
          </div>

          <div>
            <label className="label text-xs">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text-3)'}}/>
              <input {...register('confirm')} type={show?'text':'password'} placeholder="••••••••"
                className={`input pl-9 text-sm ${errors.confirm?'input-error':''}`}/>
            </div>
            {errors.confirm && <p className="text-xs mt-1" style={{color:'var(--magenta)'}}>{errors.confirm.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 justify-center mt-2">
            {isSubmitting?<><div className="spinner"/>&nbsp;CRÉATION...</>:<><UserPlus className="w-4 h-4"/> CRÉER MON COMPTE</>}
          </button>
        </form>

        <div className="divider"><span className="text-xs px-2" style={{color:'var(--text-3)',fontFamily:'JetBrains Mono,monospace'}}>ou</span></div>
        <p className="text-center text-sm" style={{color:'var(--text-2)',fontFamily:'Rajdhani,sans-serif'}}>
          Déjà un compte ?{' '}
          <Link href="/login" className="font-bold" style={{color:'var(--cyan)'}}>Se connecter</Link>
        </p>
      </div>
    </motion.div>
  );
}