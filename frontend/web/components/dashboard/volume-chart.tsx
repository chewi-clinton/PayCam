"use client";

import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/format";

export function VolumeChart({ data }: { data: { date: string; volume: string }[] }) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    volume: Number(d.volume),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Gross volume — last 7 days
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No successful transactions yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => formatAmount(String(value ?? 0), "XAF")}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#volumeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
