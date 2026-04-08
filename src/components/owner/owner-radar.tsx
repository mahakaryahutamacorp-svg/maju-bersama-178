"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const data = [
  { metric: "Stok Ready", value: 88 },
  { metric: "Pesanan Baru", value: 72 },
  { metric: "Rating", value: 91 },
  { metric: "Chat Respon", value: 85 },
  { metric: "Total Klik", value: 67 },
];

export function OwnerRadar() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(212,175,55,0.25)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Performa"
            dataKey="value"
            stroke="#d4af37"
            fill="#d4af37"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
