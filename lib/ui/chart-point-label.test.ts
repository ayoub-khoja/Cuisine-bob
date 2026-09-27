import { describe, expect, it } from "vitest";
import {
  CHART_LABEL_RIGHT_MARGIN,
  CHART_LABEL_TOP_MARGIN,
  DEFAULT_CHART_DOT_LAST_ONLY,
  formatChartCountLabel,
  formatChartCurrencyLabel,
  formatChartPointLabel,
} from "./chart-point-label";

describe("chart-point-label", () => {
  it("formatChartCurrencyLabel formats small and large values", () => {
    expect(formatChartCurrencyLabel(49)).toBe("$49");
    expect(formatChartCurrencyLabel(52.52)).toBe("$52.52");
    expect(formatChartCurrencyLabel(1500)).toBe("$1.5k");
  });

  it("formatChartCountLabel rounds to integer string", () => {
    expect(formatChartCountLabel(3.7)).toBe("4");
  });

  it("formatChartPointLabel delegates to formatter", () => {
    expect(formatChartPointLabel(10, formatChartCountLabel)).toBe("10");
    expect(formatChartPointLabel(NaN)).toBe("");
  });

  it("exports CHART_LABEL_TOP_MARGIN for chart margin sync (REQ-0077)", () => {
    expect(CHART_LABEL_TOP_MARGIN).toBe(28);
  });

  it("defaults lastOnly off and exports right margin for horizontal bars", () => {
    expect(DEFAULT_CHART_DOT_LAST_ONLY).toBe(false);
    expect(CHART_LABEL_RIGHT_MARGIN).toBe(28);
  });
});
