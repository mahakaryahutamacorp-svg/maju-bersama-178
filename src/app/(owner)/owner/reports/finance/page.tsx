"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useOwnerStoreScope } from "@/components/owner/owner-store-scope";
import { formatRp } from "@/lib/mb178/format";
import { WalletIcon, ShoppingBagIcon, TrendingUpIcon } from "@heroicons/react/24/outline";

interface FinanceData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    periodDays: number;
  };
  daily: { date: string; revenue: number; orders: number }[];
  byPayment: Record<string, number>;
}

export default function FinanceReportPage() {
  const { appendApiUrl, ready } = useOwnerStoreScope();
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch(appendApiUrl(`/api/owner/reports/finance?days=${days}`));
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, [ready, appendApiUrl, days]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.daily.map((d) => ({
      ...d,
      shortDate: d.date.split("-").slice(1).join("/"),
    }));
  }, [data]);

  if (!ready || loading) {
    return (
      <div className="px-4 py-8 space-y-6 md:mx-auto md:max-w-2xl">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="px-4 pb-20 pt-8 md:mx-auto md:max-w-2xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
            Laporan Keuangan
          </h1>
          <p className="mt-1 text-xs text-zinc-500">Analisis pendapatan toko Anda</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-amber-500/40"
        >
          <option value={7}>7 Hari Terakhir</option>
          <option value={30}>30 Hari Terakhir</option>
          <option value={90}>90 Hari Terakhir</option>
        </select>
      </header>

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-500">
              <WalletIcon className="h-5 w-5" />
            </div>
            <p className="text-xs text-zinc-500">Total Omzet</p>
          </div>
          <p className="mt-3 text-lg font-bold text-zinc-100">{formatRp(s?.totalRevenue ?? 0)}</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
              <ShoppingBagIcon className="h-5 w-5" />
            </div>
            <p className="text-xs text-zinc-500">Total Pesanan</p>
          </div>
          <p className="mt-3 text-lg font-bold text-zinc-100">{s?.totalOrders ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-500">
              <TrendingUpIcon className="h-5 w-5" />
            </div>
            <p className="text-xs text-zinc-500">Rata-rata / Order</p>
          </div>
          <p className="mt-3 text-lg font-bold text-zinc-100">{formatRp(s?.avgOrderValue ?? 0)}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h2 className="mb-6 text-sm font-semibold text-zinc-400">Tren Pendapatan Harian</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis 
                dataKey="shortDate" 
                fontSize={10} 
                tick={{ fill: "#71717a" }} 
                axisLine={false}
                tickLine={false}
                minTickGap={20}
              />
              <YAxis 
                fontSize={10} 
                tick={{ fill: "#71717a" }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `Rp${val / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#18181b", 
                  border: "1px solid #3f3f46", 
                  borderRadius: "12px",
                  fontSize: "12px"
                }}
                itemStyle={{ color: "#fbbf24" }}
                formatter={(val: number) => [formatRp(val), "Revenue"]}
                labelStyle={{ color: "#71717a", marginBottom: "4px" }}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.revenue > 0 ? "#fbbf24" : "#27272a"} 
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold text-zinc-400">Metode Pembayaran</h2>
        <div className="space-y-2">
          {Object.entries(data?.byPayment ?? {}).length === 0 ? (
            <p className="text-xs text-zinc-600 italic">Belum ada data transaksi.</p>
          ) : (
            Object.entries(data?.byPayment ?? {}).map(([method, amount]) => (
              <div 
                key={method} 
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3"
              >
                <p className="text-sm font-medium text-zinc-300 uppercase">{method}</p>
                <p className="text-sm font-semibold text-zinc-100">{formatRp(amount)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
