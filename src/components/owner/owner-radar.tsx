"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export type OwnerRadarProps = {
  stok: number;
  pesanan: number;
  rating: number;
};

const defaultAxes: OwnerRadarProps = {
  stok: 72,
  pesanan: 58,
  rating: 88,
};

export function OwnerRadar({
  stok = defaultAxes.stok,
  pesanan = defaultAxes.pesanan,
  rating = defaultAxes.rating,
}: Partial<OwnerRadarProps>) {
  const data = [
    { metric: "Stok", value: stok },
    { metric: "Total Pesanan", value: pesanan },
    { metric: "Rating", value: rating },
  ];

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="rgba(212,175,55,0.25)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Performa"
            dataKey="value"
            stroke="#d4af37"
            fill="#d4af37"
            fillOpacity={0.28}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
