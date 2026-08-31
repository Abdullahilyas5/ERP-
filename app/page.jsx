
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: '▦',
    title: 'Product Management',
    description:
      'Manage your complete product catalog, pricing, categories and product information from one place.',
  },
  {
    icon: '◫',
    title: 'Smart Inventory',
    description:
      'Monitor stock levels, track movements and quickly identify products that need attention.',
  },
  {
    icon: '▣',
    title: 'Point of Sale',
    description:
      'Process sales quickly with a simple POS workflow designed for everyday supermarket operations.',
  },
  {
    icon: '◇',
    title: 'Finance & Expenses',
    description:
      'Keep track of payments, expenses and financial activity with organized records and reports.',
  },
  {
    icon: '◎',
    title: 'Customer Management',
    description:
      'Maintain customer records and understand your sales activity from a centralized dashboard.',
  },
  {
    icon: '↗',
    title: 'Reports & Insights',
    description:
      'Turn your operational data into useful insights so you can make better business decisions.',
  },
];

const workflow = [
  {
    number: '01',
    title: 'Set up your business',
    description:
      'Create your account and configure the basic information for your supermarket.',
  },
  {
    number: '02',
    title: 'Add your products',
    description:
      'Build your product catalog with prices, categories and available stock.',
  },
  {
    number: '03',
    title: 'Run your operations',
    description:
      'Manage inventory, process POS sales, track customers and record expenses.',
  },
  {
    number: '04',
    title: 'Understand your business',
    description:
      'Use reports and dashboards to monitor performance and make informed decisions.',
  },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if an authentication token exists
    const token = localStorage.getItem('token');

    if (token) {
      router.replace('/overview');
    }
  }, [router]);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white shadow-sm shadow-emerald-600/20">
              S
            </div>

            <span className="hidden text-sm font-bold tracking-tight text-slate-900 sm:block">
              Supermarket ERP
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              Features
            </Link>

            <Link
              href="#workflow"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              How it works
            </Link>

            <Link
              href="#about"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:block"
            >
              Sign in
            </Link>

            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                               */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Simple ERP for modern supermarkets
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Run your supermarket
              <span className="block text-emerald-600">
                from one place.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Manage products, inventory, sales, customers and finances
              through one simple ERP platform built for everyday
              supermarket operations.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Create your account
              </Link>

              <Link
                href="/login"
                className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Sign in to dashboard
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Fast setup · Simple workflows · Centralized operations
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute -inset-4 rounded-[2rem] bg-emerald-200/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">

              <div className="flex h-11 items-center gap-2 border-b border-slate-100 bg-slate-50 px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />

                <div className="mx-auto hidden h-6 w-64 rounded-md border border-slate-200 bg-white sm:block" />
              </div>

              <div className="grid min-h-[360px] grid-cols-[150px_1fr]">

                <div className="hidden border-r border-slate-100 bg-slate-50 p-4 sm:block">
                  <div className="mb-7 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-md bg-emerald-600" />
                    <div className="h-2.5 w-16 rounded bg-slate-300" />
                  </div>

                  <div className="space-y-2">
                    <PreviewNav active text="Dashboard" />
                    <PreviewNav text="Products" />
                    <PreviewNav text="Inventory" />
                    <PreviewNav text="POS" />
                    <PreviewNav text="Customers" />
                    <PreviewNav text="Finance" />
                  </div>
                </div>

                <div className="p-5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-3 w-24 rounded bg-slate-800" />
                      <div className="mt-2 h-2 w-36 rounded bg-slate-200" />
                    </div>

                    <div className="h-8 w-20 rounded-lg bg-emerald-600" />
                  </div>

                  <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <PreviewStat title="Sales" value="$24.8K" />
                    <PreviewStat title="Products" value="1,284" />
                    <PreviewStat title="Customers" value="842" />
                    <PreviewStat title="Orders" value="326" />
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-100 p-4">
                    <div className="h-2 w-28 rounded bg-slate-200" />

                    <div className="mt-5 flex h-28 items-end gap-2">
                      {[35, 55, 42, 70, 52, 78, 65, 90, 74, 96, 80, 100].map(
                        (height, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-t bg-emerald-200"
                            style={{ height: `${height}%` }}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Features                                                           */}
      {/* ------------------------------------------------------------------ */}

      <section id="features" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">

          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-emerald-600">
              EVERYTHING CONNECTED
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Everything your supermarket needs
            </h2>

            <p className="mt-4 text-slate-500">
              Keep your daily operations organized with modules designed
              to work together.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-7 transition hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-600">
                  {feature.icon}
                </div>

                <h3 className="mt-5 text-base font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Workflow                                                           */}
      {/* ------------------------------------------------------------------ */}

      <section id="workflow" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">

          <div className="text-center">
            <p className="text-sm font-semibold text-emerald-600">
              SIMPLE WORKFLOW
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              From setup to daily operations
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              Start quickly and keep your business operations organized
              as your supermarket grows.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-4">
            {workflow.map((item) => (
              <div key={item.number} className="relative">
                <span className="text-sm font-bold text-emerald-600">
                  {item.number}
                </span>

                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>

                {item.number !== '04' && (
                  <div className="absolute right-0 top-2 hidden text-slate-300 md:block">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* About                                                              */}
      {/* ------------------------------------------------------------------ */}

      <section id="about" className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">

          <div>
            <p className="text-sm font-semibold text-emerald-600">
              BUILT FOR OPERATIONS
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Less complexity.
              <br />
              More control.
            </h2>

            <p className="mt-5 leading-7 text-slate-500">
              Supermarket ERP brings your most important business
              operations together so your team can spend less time
              managing scattered information and more time running
              the business.
            </p>

            <div className="mt-7 space-y-4">
              <CheckItem text="Centralized business data" />
              <CheckItem text="Role-based system access" />
              <CheckItem text="Connected inventory and sales" />
              <CheckItem text="Clear operational reporting" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    TODAY'S OVERVIEW
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    Business performance
                  </p>
                </div>

                <div className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Live
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <OverviewRow
                  label="Today's sales"
                  value="$8,420"
                  positive
                />

                <OverviewRow
                  label="Orders completed"
                  value="184"
                />

                <OverviewRow
                  label="Low stock items"
                  value="12"
                  warning
                />

                <OverviewRow
                  label="Expenses"
                  value="$1,240"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                */}
      {/* ------------------------------------------------------------------ */}

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-emerald-600 px-6 py-14 text-center shadow-xl shadow-emerald-600/20 sm:px-10">

          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to organize your supermarket?
            </h2>

            <p className="mt-4 text-sm leading-6 text-emerald-50 sm:text-base">
              Create your account and start managing your products,
              inventory, sales and finances from one place.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Get started
              </Link>

              <Link
                href="/login"
                className="rounded-lg border border-emerald-400 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                             */}
      {/* ------------------------------------------------------------------ */}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">

          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">

            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                  S
                </div>

                <span className="font-bold tracking-tight text-slate-900">
                  Supermarket ERP
                </span>
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
                A simple ERP platform for managing supermarket operations,
                inventory, sales and finances from one place.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Product
              </h3>

              <div className="mt-4 space-y-3">
                <Link
                  href="#features"
                  className="block text-sm text-slate-500 hover:text-slate-900"
                >
                  Features
                </Link>

                <Link
                  href="#workflow"
                  className="block text-sm text-slate-500 hover:text-slate-900"
                >
                  How it works
                </Link>

                <Link
                  href="/signup"
                  className="block text-sm text-slate-500 hover:text-slate-900"
                >
                  Get started
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Account
              </h3>

              <div className="mt-4 space-y-3">
                <Link
                  href="/login"
                  className="block text-sm text-slate-500 hover:text-slate-900"
                >
                  Sign in
                </Link>

                <Link
                  href="/signup"
                  className="block text-sm text-slate-500 hover:text-slate-900"
                >
                  Create account
                </Link>

                <Link
                  href="#about"
                  className="block text-sm text-slate-500 hover:text-slate-900"
                >
                  About
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Supermarket ERP. All rights reserved.
            </p>

            <div className="flex gap-5">
              <span className="text-xs text-slate-400">
                Privacy
              </span>

              <span className="text-xs text-slate-400">
                Terms
              </span>

              <span className="text-xs text-slate-400">
                Support
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}


/* -------------------------------------------------------------------------- */
/* Small Components                                                           */
/* -------------------------------------------------------------------------- */

function PreviewNav({ text, active }) {
  return (
    <div
      className={`rounded-md px-2.5 py-2 text-[10px] font-medium ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-slate-400'
      }`}
    >
      {text}
    </div>
  );
}

function PreviewStat({ title, value }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <p className="text-[9px] font-medium text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function CheckItem({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600">
        ✓
      </div>

      <span className="text-sm text-slate-600">
        {text}
      </span>
    </div>
  );
}

function OverviewRow({ label, value, positive, warning }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-sm font-semibold ${
          positive
            ? 'text-emerald-600'
            : warning
              ? 'text-amber-600'
              : 'text-slate-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
