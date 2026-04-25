"use client";

import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart as RBarChart,
  Bar,
} from "recharts";
import { fmtNum } from "@/lib/constants";

const tooltipFormatter = (value: number | string, name: string): [string, string] => {
  const num = typeof value === "number" ? value : Number(value);
  return [Number.isFinite(num) ? fmtNum(num) : String(value), name];
};

interface SeriesPoint {
  x: number | string;
  [key: string]: number | string;
}

interface LineChartProps {
  data: SeriesPoint[];
  xKey: string;
  series: { key: string; label: string; color: string }[];
  height?: number;
  yLabel?: string;
}

export function LineChart({
  data,
  xKey,
  series,
  height = 280,
  yLabel,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 10, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="#243056" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} stroke="#9aa6c7" fontSize={11} />
        <YAxis
          stroke="#9aa6c7"
          fontSize={11}
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: "insideLeft", fill: "#9aa6c7", fontSize: 11 }
              : undefined
          }
        />
        <Tooltip
          contentStyle={{
            background: "#121a2c",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "#e6ecff",
            fontSize: 12,
          }}
          formatter={tooltipFormatter}
        />
        {series.length > 1 && (
          <Legend wrapperStyle={{ color: "#9aa6c7", fontSize: 11 }} />
        )}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  );
}

interface BarChartProps {
  data: SeriesPoint[];
  xKey: string;
  series: { key: string; label: string; color: string }[];
  height?: number;
  yLabel?: string;
}

export function BarChart({ data, xKey, series, height = 280, yLabel }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart data={data} margin={{ top: 10, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="#243056" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} stroke="#9aa6c7" fontSize={11} />
        <YAxis
          stroke="#9aa6c7"
          fontSize={11}
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: "insideLeft", fill: "#9aa6c7", fontSize: 11 }
              : undefined
          }
        />
        <Tooltip
          cursor={false}
          contentStyle={{
            background: "#121a2c",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "#e6ecff",
            fontSize: 12,
          }}
          formatter={tooltipFormatter}
        />
        {series.length > 1 && (
          <Legend wrapperStyle={{ color: "#9aa6c7", fontSize: 11 }} />
        )}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}
