/**
 * REQ-0074/0077 — Recharts point value labels (currency, count, compact).
 * Chart-label polish: every non-zero point gets text-xs (lastOnly default false).
 */

import type { ReactElement } from "react";

/** Top margin for charts using point labels — keep in sync with label Y offset. */
export const CHART_LABEL_TOP_MARGIN = 28;

/** Right margin for horizontal (layout=vertical) bar tip labels. */
export const CHART_LABEL_RIGHT_MARGIN = 28;

/** Default for createChartDotLabelRenderer — label every non-zero point. */
export const DEFAULT_CHART_DOT_LAST_ONLY = false;

const CHART_LABEL_CLASS =
  "fill-gray-700 dark:fill-white text-xs font-normal pointer-events-none";

export type ChartPointLabelFormatter = (value: number) => string;

/** Default currency label for revenue/spending charts */
export function formatChartCurrencyLabel(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

/** Integer count label for order/status charts */
export function formatChartCountLabel(value: number): string {
  return String(Math.round(value));
}

export function formatChartPointLabel(
  value: number,
  formatter: ChartPointLabelFormatter = formatChartCurrencyLabel,
): string {
  if (!Number.isFinite(value)) return "";
  return formatter(value);
}

type RechartsLabelProps = {
  x?: number | string;
  y?: number | string;
  value?: number | string;
  index?: number;
  stroke?: string;
  fill?: string;
  formatter?: ChartPointLabelFormatter;
  lastOnly?: boolean;
  dataLength?: number;
  width?: number | string;
  height?: number | string;
};

function toNum(v: number | string | undefined, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Area/Line dot label — value above point */
export function ChartDotLabel({
  x = 0,
  y = 0,
  value,
  index = 0,
  formatter = formatChartCurrencyLabel,
  lastOnly = false,
  dataLength = 0,
}: RechartsLabelProps): ReactElement | null {
  if (value == null || value === "") return null;
  if (lastOnly && dataLength > 0 && index !== dataLength - 1) return null;

  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num === 0) return null;

  const text = formatChartPointLabel(num, formatter);
  const cx = toNum(x);
  const cy = toNum(y);

  return (
    <text
      x={cx}
      y={cy - 12}
      textAnchor="middle"
      dominantBaseline="auto"
      className={CHART_LABEL_CLASS}
    >
      {text}
    </text>
  );
}

/** Vertical bar chart top label (bars grow upward) */
export function ChartBarLabel({
  x = 0,
  y = 0,
  width = 0,
  value,
  formatter = formatChartCurrencyLabel,
}: RechartsLabelProps): ReactElement | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num === 0) return null;

  const text = formatChartPointLabel(num, formatter);
  const cx = toNum(x) + toNum(width) / 2;
  const cy = toNum(y);

  return (
    <text
      x={cx}
      y={cy - 8}
      textAnchor="middle"
      dominantBaseline="auto"
      className={CHART_LABEL_CLASS}
    >
      {text}
    </text>
  );
}

/**
 * Horizontal bar tip label (BarChart layout="vertical" — bars grow right).
 * Recharts still passes x/y/width/height of the bar rect.
 */
export function ChartHorizontalBarLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value,
  formatter = formatChartCurrencyLabel,
}: RechartsLabelProps): ReactElement | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num === 0) return null;

  const text = formatChartPointLabel(num, formatter);
  const tipX = toNum(x) + toNum(width) + 6;
  const midY = toNum(y) + toNum(height) / 2;

  return (
    <text
      x={tipX}
      y={midY}
      textAnchor="start"
      dominantBaseline="central"
      className={CHART_LABEL_CLASS}
    >
      {text}
    </text>
  );
}

export type ChartPieLabelProps = {
  name?: string;
  percent?: number;
  value?: number;
  x?: number;
  y?: number;
  textAnchor?: string;
};

export type ChartPieLabelMode = "percent" | "count";

/**
 * Shared pie outside label — text-xs; call with labelLine={false}.
 * percent mode: "Name 42%"; count mode: "Name 12" (stock pies).
 * Skips zero / empty slices.
 */
export function renderChartPieOutsideLabel(
  props: ChartPieLabelProps,
  mode: ChartPieLabelMode = "percent",
): ReactElement | null {
  const { name, percent, value, x = 0, y = 0, textAnchor = "middle" } = props;
  if (!name) return null;

  let text: string;
  if (mode === "percent") {
    const pct = Math.round((percent || 0) * 100);
    if (pct === 0 && (value == null || value === 0)) return null;
    text = `${name} ${pct}%`;
  } else {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n === 0) return null;
    text = `${name} ${formatChartCountLabel(n)}`;
  }

  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor as "start" | "middle" | "end"}
      dominantBaseline="central"
      className={CHART_LABEL_CLASS}
    >
      {text}
    </text>
  );
}

/** Factory for Area/Line label prop bound to data length + formatter */
export function createChartDotLabelRenderer(
  dataLength: number,
  formatter?: ChartPointLabelFormatter,
  lastOnly: boolean = DEFAULT_CHART_DOT_LAST_ONLY,
): (props: unknown) => ReactElement | null {
  function ChartDotLabelRenderer(props: unknown) {
    const labelProps = props as RechartsLabelProps;
    return (
      <ChartDotLabel
        {...labelProps}
        formatter={formatter}
        lastOnly={lastOnly}
        dataLength={dataLength}
      />
    );
  }
  ChartDotLabelRenderer.displayName = "ChartDotLabelRenderer";
  return ChartDotLabelRenderer;
}

/** Factory for vertical Bar label prop */
export function createChartBarLabelRenderer(
  formatter?: ChartPointLabelFormatter,
): (props: unknown) => ReactElement | null {
  function ChartBarLabelRenderer(props: unknown) {
    const labelProps = props as RechartsLabelProps;
    return <ChartBarLabel {...labelProps} formatter={formatter} />;
  }
  ChartBarLabelRenderer.displayName = "ChartBarLabelRenderer";
  return ChartBarLabelRenderer;
}

/** Factory for horizontal Bar (layout="vertical") tip labels */
export function createChartHorizontalBarLabelRenderer(
  formatter?: ChartPointLabelFormatter,
): (props: unknown) => ReactElement | null {
  function ChartHorizontalBarLabelRenderer(props: unknown) {
    const labelProps = props as RechartsLabelProps;
    return <ChartHorizontalBarLabel {...labelProps} formatter={formatter} />;
  }
  ChartHorizontalBarLabelRenderer.displayName =
    "ChartHorizontalBarLabelRenderer";
  return ChartHorizontalBarLabelRenderer;
}

/** Recharts Pie `label` callback — percent mode */
export function createChartPiePercentLabel(): (
  props: ChartPieLabelProps,
) => ReactElement | null {
  return (props) => renderChartPieOutsideLabel(props, "percent");
}

/** Recharts Pie `label` callback — count mode (stock pies) */
export function createChartPieCountLabel(): (
  props: ChartPieLabelProps,
) => ReactElement | null {
  return (props) => renderChartPieOutsideLabel(props, "count");
}
