'use client';

import { useEffect, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function InventoryPage() {
  const [alerts, setAlerts] = useState([]);
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load(){ setLoading(true); try{ const res = await apiFetch('/inventory'); setAlerts(res.alerts || []); setMoves(res.transfers || []); }catch(err){ console.error(err); } finally{ setLoading(false); } }

  useEffect(()=>{ load(); },[]);

  return (
    <ModuleLayout title="Inventory" subtitle="Monitor distribution, stock adjustments, and replenishment actions." allowedRoles={['owner', 'admin', 'manager', 'warehouse_staff']}>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Stock health" value="—" change="—" accent="emerald" />
        <SummaryCard label="Critical items" value={alerts.length} change="Review soon" accent="amber" />
        <SummaryCard label="Pending transfers" value={moves.length} change="—" accent="sky" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Reorder alerts</h3>
            <span className="text-sm text-slate-500">Last update</span>
          </div>

          {loading ? <div className="p-6">Loading...</div> : alerts.map((alert) => (
            <div key={alert._id} className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 p-4 last:mb-0">
              <div>
                <p className="font-semibold text-slate-900">{alert.name || alert.item}</p>
                <p className="text-sm text-slate-500">{alert.location || ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{alert.stock || alert.current} units</p>
                <p className="text-xs text-amber-600">Reorder at {alert.reorderLevel || alert.reorder}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Recent movements</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Today</span>
          </div>

          <div className="space-y-4">{loading ? <div className="p-6">Loading...</div> : moves.map((move) => (
              <div key={`${move._id}`} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800">{move.item}</span>
                  <span className="font-medium text-slate-600">{move.qty}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{move.from || ''}</span>
                  <span>{new Date(move.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-3">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">{move.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ModuleLayout>
  );
}

function SummaryCard({ label, value, change, accent }) {
  const colors = { emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', sky: 'bg-sky-50 text-sky-700' };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[accent]}`}>{change}</span>
      </div>
    </div>
  );
}
