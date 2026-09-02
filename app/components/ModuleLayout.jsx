import { SidebarNav } from './SidebarNav';
import { ToastProvider } from './ToastProvider';

import { ProtectedRoute } from './ProtectedRoute';

export function ModuleLayout({ title, subtitle, headerActions, children, allowedRoles = [], requiredPermission }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-800 md:px-8">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 lg:flex-row">
          <SidebarNav />

          <ProtectedRoute allowedRoles={allowedRoles} requiredPermission={requiredPermission}>
            <main className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-600">Supermarket ERP</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">{title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                </div>
                {headerActions}
              </header>

              {children}
            </main>
          </ProtectedRoute>
        </div>
      </div>
    </ToastProvider>
  );
}
