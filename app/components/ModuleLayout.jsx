import { SidebarNav } from './SidebarNav';
import { Store } from 'lucide-react';

import { ProtectedRoute } from './ProtectedRoute';
import { useState } from 'react';

export function ModuleLayout({ title, subtitle, headerActions, children, allowedRoles = [], requiredPermission }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 lg:h-screen lg:overflow-hidden lg:px-3 lg:py-3">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] min-w-0 flex-col gap-0 lg:h-full lg:flex-row lg:gap-3">
        <SidebarNav collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((current) => !current)} />

        <ProtectedRoute allowedRoles={allowedRoles} requiredPermission={requiredPermission}>
          <main className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 md:p-5 lg:h-full lg:overflow-hidden">
            <header className="mb-4 flex min-w-0 flex-col gap-3 border-b border-slate-200 pb-4 sm:mb-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Store className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                  <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] sm:text-xs sm:tracking-[0.26em]">GreenCart ERP</p>
                </div>
                <h2 className="mt-2 break-words text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
              </div>
              {headerActions}
            </header>

            <div className="min-h-0 flex-1 overscroll-contain pr-1 lg:overflow-y-auto">
              {children}
            </div>
          </main>
        </ProtectedRoute>
      </div>
    </div>
  );
}
