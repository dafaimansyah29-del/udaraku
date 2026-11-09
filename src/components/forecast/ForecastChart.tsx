"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Standard } from "@/lib/air-types";
import { pm25Category, pm25Zones } from "@/lib/aqi";
import { dayLabel, dayName, formatHour, hourOf, niceCeil } from "@/lib/forecast";
import type { ForecastPoint } from "@/lib/forecast";
import { formatNumber } from "@/lib/format";

const INK = "#FFFFFF"; // sumbu dan garis bantu di latar gelap
const LINE = "#22D3EE";

type Props = {
  points: ForecastPoint[];
  standard: Standard;
};

/** Kartu info saat grafik disorot (mouse, sentuh, atau panah keyboard). */
function ChartTooltip({
  active,
  payload,
  standard,
  nowKey,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ForecastPoint }>;
  standard: Standard;
  nowKey: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const category = point.pm25 === null ? null : pm25Category(standard, point.pm25);
  return (
    <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-card-lg ring-1 ring-navy/10">
      <p className="font-semibold text-navy/70">
        {dayLabel(point.time, nowKey)}, {formatHour(point.time)}
      </p>
      {point.pm25 === null || category === null ? (
        <p className="mt-1 font-bold text-navy">Data tidak tersedia</p>
      ) : (
        <>
          <p className="mt-0.5 font-heading text-xl font-extrabold text-navy">
            {formatNumber(point.pm25, 1)} <span className="text-xs font-semibold text-navy/75">µg/m³</span>
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs font-bold text-navy">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
            {category.label}
          </p>
        </>
      )}
    </div>
  );
}

export default function ForecastChart({ points, standard }: Props) {
  // Layar sempit: label jam lebih jarang supaya tidak bertumpuk
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const nowKey = points[0]?.time ?? "";

  const { zones, yMax, ticks, midnights } = useMemo(() => {
    const allZones = pm25Zones(standard);
    const values = points.map((p) => p.pm25).filter((v): v is number => v !== null);
    const dataMax = values.length ? Math.max(...values) : 0;
    // Pastikan zona pertama terlihat jelas, dan puncak data tidak menempel di tepi
    const top = niceCeil(Math.max(dataMax * 1.15, allZones[0].to * 1.6));
    const step = narrow ? 12 : 6;
    return {
      zones: allZones.filter((z) => z.from < top),
      yMax: top,
      ticks: points.filter((p) => hourOf(p.time) % step === 0).map((p) => p.time),
      midnights: points.filter((p, i) => i > 0 && hourOf(p.time) === 0).map((p) => p.time),
    };
  }, [points, standard, narrow]);

  return (
    <div className="h-[300px] w-full sm:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 22, right: 14, bottom: 4, left: 0 }}>
          {zones.map((z) => (
            <ReferenceArea
              key={z.category.label}
              y1={z.from}
              y2={Math.min(z.to, yMax)}
              fill={z.category.color}
              fillOpacity={0.28}
              stroke="none"
            />
          ))}
          <CartesianGrid vertical={false} stroke={INK} strokeOpacity={0.14} strokeDasharray="3 4" />
          <XAxis
            dataKey="time"
            ticks={ticks}
            interval={0}
            tickFormatter={formatHour}
            tickLine={false}
            axisLine={{ stroke: INK, strokeOpacity: 0.3 }}
            tick={{ fill: INK, fillOpacity: 0.8, fontSize: 12 }}
          />
          <YAxis
            domain={[0, yMax]}
            allowDataOverflow
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: INK, fillOpacity: 0.8, fontSize: 12 }}
          />
          <ReferenceLine
            x={nowKey}
            stroke="#67E8F9"
            strokeWidth={2}
            label={{ value: "Sekarang", position: "insideTopLeft", fill: "#67E8F9", fontSize: 11, fontWeight: 700 }}
          />
          {midnights.map((t) => (
            <ReferenceLine
              key={t}
              x={t}
              stroke={INK}
              strokeOpacity={0.4}
              strokeDasharray="4 4"
              label={{ value: dayName(t), position: "insideTopLeft", fill: INK, fontSize: 11, fontWeight: 700 }}
            />
          ))}
          <Tooltip
            content={<ChartTooltip standard={standard} nowKey={nowKey} />}
            cursor={{ stroke: INK, strokeOpacity: 0.5, strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="pm25"
            stroke={LINE}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: LINE, stroke: "#fff", strokeWidth: 2 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}