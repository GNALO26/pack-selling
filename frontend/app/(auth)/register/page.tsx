'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

const schema = z.object({
  firstName: z.string().min(2, 'Prénom requis (min 2 caractères)'),
  lastName:  z.string().min(2, 'Nom requis (min 2 caractères)'),
  email:     z.string().email('Email invalide'),
  phone:     z.string().optional(),
  password:  z.string().min(8, 'Minimum 8 caractères'),
  confirm:   z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [done, setDone]   = useState(false);
  const [email, setEmail] = useState('');
  const [show, setShow]   = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.register({
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        password:  data.password,
        phone:     data.phone,
      });
      setEmail(data.email);
      setDone(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-10 text-center shadow-navy">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-3">
            Vérifiez votre email
          </h1>
          <p className="text-white/60 leading-relaxed mb-2">
            Un email de confirmation a été envoyé à
          </p>
          <p className="text-gold-DEFAULT font-semibold mb-6">{email}</p>
          <p className="text-white/50 text-sm mb-8">
            Cliquez sur le lien dans l&apos;email pour activer votre compte et procéder au paiement.
            Le lien est valable <strong className="text-white">24 heures</strong>.
          </p>
          <Link href="/login" className="btn-outline border-white/30 text-white hover:bg-white/10 w-full justify-center">
            Retour à la connexion
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-navy">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold-DEFAULT/20 border border-gold-DEFAULT/30 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-gold-DEFAULT" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Créer un compte</h1>
          <p className="text-white/50 text-sm">Accédez au Pack Digital 360</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom / Prénom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-white/80 text-xs">Prénom</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register('firstName')}
                  placeholder="Olympe"
                  className="input pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-gold-DEFAULT/50 text-sm"
                />
              </div>
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label text-white/80 text-xs">Nom</label>
              <input
                {...register('lastName')}
                placeholder="GUIDO"
                className="input bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-gold-DEFAULT/50 text-sm"
              />
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="label text-white/80 text-xs">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                {...register('email')}
                type="email"
                placeholder="votre@email.com"
                className="input pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-gold-DEFAULT/50"
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Téléphone */}
          <div>
            <label className="label text-white/80 text-xs">Téléphone <span className="text-white/30">(optionnel)</span></label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                {...register('phone')}
                type="tel"
                placeholder="+229 XX XX XX XX"
                className="input pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-gold-DEFAULT/50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label text-white/80 text-xs">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                {...register('password')}
                type={show ? 'text' : 'password'}
                placeholder="Minimum 8 caractères"
                className="input pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-gold-DEFAULT/50"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm */}
          <div>
            <label className="label text-white/80 text-xs">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                {...register('confirm')}
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
                className="input pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-gold-DEFAULT/50"
              />
            </div>
            {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-gold w-full py-3.5 text-base mt-2">
            {isSubmitting ? <><div className="spinner" /> Création...</> : <><UserPlus className="w-5 h-5" /> Créer mon compte</>}
          </button>
        </form>

        <div className="divider my-5">
          <span className="text-white/30 text-xs px-2">ou</span>
        </div>

        <p className="text-center text-white/50 text-sm">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-gold-DEFAULT hover:text-gold-DEFAULT/80 font-semibold">
            Se connecter
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
