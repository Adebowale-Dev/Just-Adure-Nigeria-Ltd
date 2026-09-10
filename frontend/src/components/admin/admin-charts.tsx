"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNaira } from "@/lib/utils.js";

type RevenuePoint = {
  date: string;
  revenueKobo?: number;
};

type StatusPoint = {
  label: string;
  value: number;
};

type TooltipPayload = {
  value?: number;
  payload?: Record<string, unknown>;
};

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-[1.4rem] border border-dashed border-black/10 bg-[#fbfaf6] text-center">
      <p className="max-w-xs text-sm font-bold leading-6 text-[var(--muted)]">{label}</p>
    </div>
  );
}

function EmptyStatusChart({ title }: { title: string }) {
  const rows = [
    { label: "Awaiting data", width: "34%" },
    { label: "No activity yet", width: "52%" },
    { label: "Ready to track", width: "72%" },
  ];

  return (
    <div className="mt-5 rounded-[1.35rem] border border-black/8 bg-[#fbfaf6] p-4">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3 text-xs font-black text-[var(--muted)]">
            <span>{row.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-[#efe6da]"><span className="block h-full rounded-full bg-[var(--accent)]/45" style={{ width: row.width }} /></span>
            <span className="text-right">0</span>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-[var(--muted)]">{title} will appear here once matching records are available.</p>
    </div>
  );
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-black/8 bg-white px-4 py-3 shadow-[0_18px_50px_rgba(28,34,31,.12)]">
      <p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--ink)]">{formatNaira(Number(payload[0]?.value ?? 0) * 100)}</p>
    </div>
  );
}

function CountTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-black/8 bg-white px-4 py-3 shadow-[0_18px_50px_rgba(28,34,31,.12)]">
      <p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--ink)]">{Number(payload[0]?.value ?? 0)} records</p>
    </div>
  );
}

export function AdminRevenueChart({ data }: { data: RevenuePoint[] }) {
  const chartData = data.map((item) => ({
    date: item.date,
    revenue: Math.round(Number(item.revenueKobo ?? 0) / 100),
  }));

  return (
    <article className="rounded-[1.8rem] border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.14em] text-[var(--accent-dark)]">Revenue trend</p>
          <h3 className="mt-1 text-2xl font-black tracking-[-.04em] text-[var(--ink)]">Daily sales movement</h3>
        </div>
        <p className="text-sm font-bold text-[var(--muted)]">Values shown in naira</p>
      </div>
      <div className="mt-6 h-72">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.48} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eee7dc" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#747b74", fontSize: 12, fontWeight: 700 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#747b74", fontSize: 12, fontWeight: 700 }} />
              <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "var(--accent-dark)", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="revenue" stroke="var(--accent-dark)" strokeWidth={3} fill="url(#adminRevenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyChart label="Revenue chart will appear once paid orders are available for this report range." />}
      </div>
    </article>
  );
}

export function AdminStatusBarChart({ title, eyebrow, data }: { title: string; eyebrow: string; data: StatusPoint[] }) {
  const chartData = data.filter((item) => Number(item.value) > 0);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="rounded-[1.8rem] border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.14em] text-[var(--accent-dark)]">{eyebrow}</p>
          <h3 className="mt-1 text-xl font-black tracking-[-.03em] text-[var(--ink)]">{title}</h3>
        </div>
        <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-black text-[var(--accent-dark)]">{total}</span>
      </div>
      {chartData.length ? (
        <div className="mt-5 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eee7dc" strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#747b74", fontSize: 12, fontWeight: 700 }} />
              <YAxis dataKey="label" type="category" width={98} tickLine={false} axisLine={false} tick={{ fill: "#17211c", fontSize: 12, fontWeight: 800 }} />
              <Tooltip content={<CountTooltip />} cursor={{ fill: "#fff3e8" }} />
              <Bar dataKey="value" radius={[0, 12, 12, 0]} fill="var(--accent)" barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : <EmptyStatusChart title={title} />}
    </article>
  );
}
