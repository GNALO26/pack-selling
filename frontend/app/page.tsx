'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle, Star, ArrowRight, Shield, BarChart3,
  Mail, Zap, BookOpen, FileText, ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const PACK_PRICE = 25000;
const PACK_ID    = process.env.NEXT_PUBLIC_PACK_ID || '';

const features = [
  { icon: '🗺️', title: 'Google Business Profile', desc: 'Fiche optimisée, catalogue produits, Q&R, posts hebdomadaires' },
  { icon: '🔍', title: 'Search Console', desc: 'Indexation, Sitemap, surveillance erreurs, analyse requêtes' },
  { icon: '📊', title: 'Analytics 4 + Tag Manager', desc: 'Conversions WhatsApp, téléphone, formulaires — tout tracké' },
  { icon: '⚡', title: 'PageSpeed & Core Web Vitals', desc: 'Score vert garanti — votre site en 1-2 secondes' },
  { icon: '📈', title: 'Looker Studio', desc: 'Rapport mensuel automatique envoyé par email le 1er du mois' },
  { icon: '✉️', title: 'Google Workspace', desc: 'Email pro, DNS, SPF, DKIM, DMARC — délivrabilité garantie' },
  { icon: '🤖', title: "L'IA comme service Premium", desc: 'Chatbot IA, contenu SEO, WhatsApp Business automatisé' },
  { icon: '🎬', title: 'Script Marketing 3 versions', desc: '30s, 60s, 2min — voix off + visuels + indications régie' },
];

const stats = [
  { value: '55+', label: 'Pages de contenu' },
  { value: '8', label: 'Outils Google couverts' },
  { value: '3', label: 'Scripts marketing' },
  { value: '100%', label: 'Configuration détaillée' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-body">

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-DEFAULT/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gold-DEFAULT font-display font-bold text-xl">Pack</span>
            <span className="text-white font-display font-bold text-xl">Digital 360</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="btn-gold text-sm px-4 py-2">
              Acheter — {formatCurrency(PACK_PRICE)}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-navy-DEFAULT min-h-screen flex items-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-hero-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-DEFAULT via-navy-DEFAULT to-brand-blue/30" />

        {/* Animated orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gold-DEFAULT/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gold-DEFAULT/15 border border-gold-DEFAULT/30 rounded-full px-4 py-2 mb-6">
                <Star className="w-4 h-4 text-gold-DEFAULT fill-gold-DEFAULT" />
                <span className="text-gold-DEFAULT text-sm font-semibold">Guide Premium · Marché Béninois</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
                Maîtrisez{' '}
                <span className="text-gold-DEFAULT">l&apos;écosystème</span>{' '}
                Google de A à Z
              </h1>

              <p className="text-white/70 text-lg leading-relaxed mb-8">
                De développeur web à <strong className="text-white">consultant digital indispensable</strong>.
                Le guide complet pour configurer, vendre et facturer tous les outils Google —
                avec les tarifs adaptés au marché béninois en <strong className="text-gold-DEFAULT">FCFA</strong>.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="btn-gold text-base px-8 py-4 animate-pulse-gold">
                  Obtenir le Pack — {formatCurrency(PACK_PRICE)}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#contenu" className="btn-outline border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-base px-8 py-4">
                  Voir le contenu
                </a>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-white/10">
                <div className="flex -space-x-2">
                  {['🧑‍💼','👩‍💻','🧑‍🏫','👨‍🔧'].map((em, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-brand-blue border-2 border-navy-DEFAULT flex items-center justify-center text-sm">
                      {em}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-gold-DEFAULT fill-gold-DEFAULT" />
                    ))}
                  </div>
                  <p className="text-white/60 text-sm">Conçu pour le marché béninois</p>
                </div>
              </div>
            </motion.div>

            {/* Product mockup */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-gold-DEFAULT font-display font-bold text-2xl">Pack Digital 360</div>
                      <div className="text-white/60 text-sm mt-1">Guide + Script Marketing</div>
                    </div>
                    <div className="bg-gold-DEFAULT/20 border border-gold-DEFAULT/30 rounded-xl p-3">
                      <BookOpen className="w-8 h-8 text-gold-DEFAULT" />
                    </div>
                  </div>

                  {/* Documents list */}
                  {[
                    { icon: '📗', title: 'Guide Pack Digital 360', pages: '55 pages', size: '268 Ko' },
                    { icon: '🎬', title: 'Script Marketing Voix Off', pages: '18 pages', size: '141 Ko' },
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 mb-3">
                      <span className="text-2xl">{doc.icon}</span>
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{doc.title}</div>
                        <div className="text-white/40 text-xs">{doc.pages} · {doc.size}</div>
                      </div>
                      <Shield className="w-4 h-4 text-green-400" />
                    </div>
                  ))}

                  {/* Price */}
                  <div className="mt-6 p-4 rounded-xl bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 text-center">
                    <div className="text-white/60 text-sm line-through mb-1">Valeur réelle : +100 000 FCFA</div>
                    <div className="text-gold-DEFAULT font-display font-bold text-3xl">{formatCurrency(PACK_PRICE)}</div>
                    <div className="text-white/50 text-sm mt-1">Accès permanent · Paiement sécurisé</div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  ✓ PDF Sécurisé
                </div>
                <div className="absolute -bottom-4 -left-4 bg-brand-blue text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  🔒 Accès protégé
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="bg-brand-blue py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-white font-display font-bold text-4xl">{stat.value}</div>
                <div className="text-white/70 text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="contenu" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-DEFAULT mb-4">
              Ce que contient le Pack Digital 360
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Deux documents premium. Chaque outil Google couvert en détail.
              Configuration, tarification, exercices pratiques.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card-hover p-6 group cursor-default"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-navy-DEFAULT mb-2 font-body text-sm">
                  {f.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY SECTION ──────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Accès sécurisé', desc: 'Vos documents sont protégés par authentification. Impossible d\'y accéder sans compte actif.' },
              { icon: Zap, title: 'Viewer intégré', desc: 'Les PDF s\'affichent directement dans votre navigateur. Aucune option de téléchargement.' },
              { icon: BarChart3, title: 'Token temporaire', desc: 'Chaque session d\'accès génère un token unique qui expire en 30 minutes.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-DEFAULT mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-navy-DEFAULT relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Prêt à devenir un consultant{' '}
              <span className="text-gold-DEFAULT">Digital 360</span> ?
            </h2>
            <p className="text-white/70 text-lg mb-8">
              Accès immédiat après paiement. Paiement sécurisé via FedaPay
              (Mobile Money, carte bancaire).
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-gold text-lg px-10 py-4 animate-pulse-gold">
                Obtenir le Pack — {formatCurrency(PACK_PRICE)}
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-10">
              {['✓ MTN Mobile Money', '✓ Moov Money', '✓ Carte bancaire', '✓ Accès immédiat'].map((item, i) => (
                <span key={i} className="text-white/60 text-sm">{item}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-navy-DEFAULT border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gold-DEFAULT font-display font-bold">Pack Digital 360</span>
            <span className="text-white/40 text-sm">· Cotonou, Bénin</span>
          </div>
          <div className="flex gap-6 text-white/50 text-sm">
            <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
            <a href="mailto:guidolokossouolympe@gmail.com" className="hover:text-white transition-colors flex items-center gap-1">
              <Mail className="w-3 h-3" /> Contact
            </a>
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
          </div>
          <div className="text-white/30 text-xs">
            © 2026 Olympe GUIDO-LOKOSSOU — Tous droits réservés
          </div>
        </div>
      </footer>
    </div>
  );
}
