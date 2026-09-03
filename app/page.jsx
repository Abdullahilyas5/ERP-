'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Lenis from 'lenis';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  ChevronRight,
  Clock3,
  Leaf,
  Package,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react';
import { apiFetch } from './lib/api.client';

const departments = [
  { name: 'Fresh produce', detail: 'Picked for the week', image: '/images/fresh_produce.jpg', tone: 'from-emerald-950/80' },
  { name: 'Pantry essentials', detail: 'Everyday favorites', image: '/images/supermarket_hero.jpg', tone: 'from-slate-950/80' },
  { name: 'Checkout & payments', detail: 'Fast, simple service', image: '/images/pos_checkout.jpg', tone: 'from-teal-950/80' },
];

const benefits = [
  { icon: Leaf, title: 'Fresh by design', text: 'Keep every department stocked, organized, and ready for customers.' },
  { icon: Truck, title: 'Smooth replenishment', text: 'Connect suppliers, warehouses, and purchase activity in one flow.' },
  { icon: BarChart3, title: 'Decisions with clarity', text: 'Turn daily sales and inventory activity into useful store insight.' },
];

export default function LandingPage() {
  const router = useRouter();
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('erp-token');
    if (token) router.replace('/overview');
  }, [router]);

  useEffect(() => {
    apiFetch('/public/posts?limit=3')
      .then((response) => setArticles(Array.isArray(response) ? response : (response?.posts || [])))
      .catch((error) => console.error('Failed to load published articles:', error));
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false });
    let frameId;
    const frame = (time) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfcf8] text-slate-900">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/20">
              <Store className="h-5 w-5" />
            </span>
            <span className="text-sm font-black tracking-tight sm:text-base">GreenCart Market</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-white/75 md:flex">
            <Link href="#departments" className="transition hover:text-white">Departments</Link>
            <Link href="#why-us" className="transition hover:text-white">Why GreenCart</Link>
            <Link href="#news" className="transition hover:text-white">News</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white sm:block">Sign in</Link>
            <Link href="/signup" className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50">Open your store</Link>
          </div>
        </div>
      </header>

      <section className="relative isolate min-h-[680px] overflow-hidden bg-slate-950">
        <img src="/images/supermarket_hero.jpg" alt="Bright, modern supermarket aisle" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20" />
        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-end px-5 pb-20 pt-32 sm:px-8 lg:pb-28">
          <div className="max-w-3xl text-white">
            <div className="reveal-up inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" /> The smarter supermarket
            </div>
            <h1 className="reveal-up animation-delay-100 mt-6 text-5xl font-black leading-[0.98] tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              Fresh thinking for
              <span className="block text-emerald-300">better shopping.</span>
            </h1>
            <p className="reveal-up animation-delay-200 mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
              A modern supermarket experience powered by calm, connected operations behind the scenes. Better availability for your team, better service for every customer.
            </p>
            <div className="reveal-up animation-delay-300 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:-translate-y-1 hover:bg-emerald-300">
                Build your market <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#departments" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20">
                Explore the store <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-white/65">
              <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-300" /> Open every day</span>
              <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-300" /> Trusted operations</span>
              <span className="flex items-center gap-2"><ShoppingBasket className="h-4 w-4 text-emerald-300" /> Everything in one place</span>
            </div>
          </div>
        </div>
      </section>

      <section id="departments" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Inside GreenCart</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">A better store starts with better flow.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-500">From the first shelf to the final receipt, every detail is designed to feel simple, fresh, and dependable.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {departments.map((department) => (
            <div key={department.name} className="group relative min-h-[360px] overflow-hidden rounded-[2rem] bg-slate-900 shadow-lg">
              <img src={department.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className={`absolute inset-0 bg-gradient-to-t ${department.tone} via-slate-950/20 to-transparent`} />
              <div className="relative flex h-full min-h-[360px] flex-col justify-end p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">{department.detail}</p>
                <h3 className="mt-2 text-2xl font-black">{department.name}</h3>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white/80">Discover more <ArrowRight className="h-4 w-4" /></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="why-us" className="bg-emerald-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:py-28">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">The GreenCart standard</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">The store customers remember.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-emerald-100/70">A beautiful storefront needs an equally thoughtful operation. GreenCart ERP gives your team the confidence to keep the experience moving.</p>
            <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50">Power your store <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 transition hover:-translate-y-1 hover:bg-white/[0.12]">
                <Icon className="h-6 w-6 text-emerald-300" />
                <h3 className="mt-8 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-100/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {articles.length > 0 && (
        <section id="news" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">From our store</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Good things, freshly shared.</h2></div>
            <Link href="/cms" className="hidden items-center gap-1 text-sm font-bold text-emerald-700 sm:flex">All updates <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {articles.map((article) => (
              <article key={article._id || article.id || article.slug} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                {article.coverImage ? <img src={article.coverImage} alt="" className="h-44 w-full object-cover" /> : <div className="flex h-44 items-center justify-center bg-emerald-50"><Package className="h-10 w-10 text-emerald-300" /></div>}
                <div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{article.category || 'Store news'}</p><h3 className="mt-2 text-lg font-bold text-slate-950">{article.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{article.excerpt || article.content}</p></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 overflow-hidden rounded-[2rem] bg-emerald-400 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:py-14">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-950/60">Ready for a better store?</p><h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">Make every aisle count.</h2></div>
          <Link href="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-950 px-6 py-3.5 text-sm font-black text-white transition hover:bg-slate-900">Start with GreenCart <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link href="/" className="font-black text-slate-900">GreenCart Market</Link>
          <div className="flex items-center gap-5"><Link href="/login" className="hover:text-slate-900">Sign in</Link><Link href="/signup" className="hover:text-slate-900">Create account</Link><span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Secure workspace</span></div>
        </div>
      </footer>
    </main>
  );
}
