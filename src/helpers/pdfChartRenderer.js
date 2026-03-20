/**
 * pdfChartRenderer.js
 *
 * Native jsPDF drawing utilities for line charts.
 * No html2canvas — all output is real PDF vector primitives.
 *
 * Layout design
 * ─────────────
 * The caller passes (x, y, w, h) as the CHART BOX (the bordered card area).
 * Y-axis labels are drawn OUTSIDE the box, to its left, so the card has no
 * dead-space left gutter.  The caller must reserve enough space to the left
 * of x for those labels (see LABEL_AREA export).
 *
 * Public API:
 *   LABEL_AREA  – mm to reserve to the left of the chart box for y-axis labels
 *   drawLineChart(pdf, x, y, w, h, { labels, datasets })
 *
 * Dataset shape:
 *   { label: string, data: number[], color: string (hex/rgb/rgba), dashed?: boolean }
 */

/** Width (mm) the caller must leave to the left of the chart box for y labels. */
export const LABEL_AREA = 18;

// Fixed vertical layout constants (mm)
const PLOT_H = 45;    // height of the data plot area
const X_LABEL_H = 9; // space below plot for x-axis tick labels
const LEGEND_GAP = 2; // gap between x-axis labels and legend
const BOTTOM_PAD = 4; // space below last legend row to card bottom

/**
 * Returns the exact chart box height needed for a given number of datasets.
 * Use this in the caller instead of a hardcoded constant.
 */
export const chartBoxHeight = (numDatasets) => {
  const legendRows = Math.ceil(numDatasets / 3);
  return PAD.top + PLOT_H + X_LABEL_H + LEGEND_GAP + legendRows * LEGEND_ROW_H + BOTTOM_PAD;
};

/** Parse a CSS color string → { r, g, b }. Falls back to mid-grey. */
const parseColor = (color) => {
  if (!color || typeof color !== "string") return { r: 80, g: 80, b: 80 };

  const hex6 = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (hex6)
    return {
      r: parseInt(hex6[1], 16),
      g: parseInt(hex6[2], 16),
      b: parseInt(hex6[3], 16),
    };

  const hex3 = /^#([a-f\d])([a-f\d])([a-f\d])$/i.exec(color);
  if (hex3)
    return {
      r: parseInt(hex3[1] + hex3[1], 16),
      g: parseInt(hex3[2] + hex3[2], 16),
      b: parseInt(hex3[3] + hex3[3], 16),
    };

  const rgba = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(color);
  if (rgba) return { r: +rgba[1], g: +rgba[2], b: +rgba[3] };

  return { r: 80, g: 80, b: 80 };
};

/** "Nice" step size for axis ticks (e.g. 250 000 → 100 000). */
const niceStep = (raw) => {
  if (raw <= 0) return 1;
  const exp = Math.floor(Math.log10(raw));
  const base = 10 ** exp;
  const f = raw / base;
  if (f <= 1) return base;
  if (f <= 2) return 2 * base;
  if (f <= 5) return 5 * base;
  return 10 * base;
};

/** Compact axis label: 1 500 000 → "1.5M", 30 000 → "30K", 450 → "450". */
const axisLabel = (v) => {
  const abs = Math.abs(v);
  if (abs === 0) return "0";
  if (abs >= 1_000_000) {
    const n = v / 1_000_000;
    return `${Number.isInteger(n) ? n : n.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const n = v / 1_000;
    return `${Number.isInteger(n) ? n : n.toFixed(0)}K`;
  }
  return String(Math.round(v));
};

/** Truncate a string to maxLen chars, appending "…" if needed. */
const truncate = (str, maxLen = 28) =>
  str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;

// Internal padding INSIDE the chart box (mm).
// Left is kept tiny — labels live outside the box.
const PAD = { top: 5, right: 6, left: 4 };
const LEGEND_ROW_H = 7;

/**
 * Draw a line chart onto a jsPDF page.
 *
 * @param {object}   pdf         jsPDF instance
 * @param {number}   x           chart box top-left x (mm)  — labels go LEFT of this
 * @param {number}   y           chart box top-left y (mm)
 * @param {number}   w           chart box total width  (mm)
 * @param {number}   h           chart box total height (mm)
 * @param {object}   opts
 * @param {string[]} opts.labels   x-axis bucket labels
 * @param {Array}    opts.datasets [{label, data, color, dashed}]
 */
export const drawLineChart = (pdf, x, y, w, h, { labels, datasets }) => {
  if (!labels?.length || !datasets?.length) return;

  const legendRows = Math.ceil(datasets.length / 3);

  // Plot area — fixed height, not derived from card h
  const aX = x + PAD.left;
  const aY = y + PAD.top;
  const aW = w - PAD.left - PAD.right;
  const aH = PLOT_H;

  if (aW <= 0 || aH <= 0) return;

  // --- Y range ---
  const vals = datasets.flatMap((ds) =>
    ds.data.filter((v) => v != null && !isNaN(v))
  );
  if (!vals.length) return;

  let yMin = Math.min(0, ...vals);
  let yMax = Math.max(0, ...vals);
  const rawRange = yMax - yMin || 1;
  const step = niceStep(rawRange / 5);
  yMin = Math.floor(yMin / step) * step;
  yMax = Math.ceil(yMax / step) * step;
  if (yMin === yMax) yMax += step;

  const sx = (i) =>
    labels.length > 1 ? aX + (i / (labels.length - 1)) * aW : aX + aW / 2;
  const sy = (v) => aY + aH - ((v - yMin) / (yMax - yMin)) * aH;

  // --- Card border (no left gutter — labels live outside) ---
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, w, h, "F");
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(x, y, w, h, 2, 2, "S");

  // --- Horizontal grid lines ---
  const NUM_TICKS = 5;
  for (let i = 0; i <= NUM_TICKS; i++) {
    const val = yMin + (i / NUM_TICKS) * (yMax - yMin);
    const gy = sy(val);

    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.2);
    pdf.line(aX, gy, aX + aW, gy);

    // Y-axis labels drawn OUTSIDE the box (to the left of x)
    pdf.setFontSize(6);
    pdf.setTextColor(130, 130, 130);
    pdf.text(axisLabel(val), x - 3, gy + 1.5, { align: "right" });
  }

  // Zero line emphasis
  if (yMin < 0 && yMax > 0) {
    pdf.setDrawColor(160, 160, 160);
    pdf.setLineWidth(0.35);
    pdf.line(aX, sy(0), aX + aW, sy(0));
  }

  // Axis spines
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.4);
  pdf.line(aX, aY, aX, aY + aH);
  pdf.line(aX, aY + aH, aX + aW, aY + aH);

  // --- X-axis tick labels ---
  // First label left-aligned at the axis, last right-aligned at the right edge,
  // middle labels centered — prevents overflow on either side.
  const maxLabels = Math.min(labels.length, 10);
  const stepX = Math.max(1, Math.ceil(labels.length / maxLabels));
  labels.forEach((lbl, i) => {
    if (i % stepX !== 0 && i !== labels.length - 1) return;
    const isFirst = i === 0;
    const isLast = i === labels.length - 1;
    const align = isFirst ? "left" : isLast ? "right" : "center";
    pdf.setFontSize(6);
    pdf.setTextColor(140, 140, 140);
    pdf.text(String(lbl), sx(i), aY + aH + 5.5, { align });
  });

  // --- Datasets ---
  datasets.forEach((ds) => {
    if (!ds.data.length) return;
    const { r, g, b } = parseColor(ds.color || "#3b82f6");
    const points = ds.data.map((v, i) => [sx(i), sy(v ?? 0)]);

    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(ds.dashed ? 0.5 : 0.9);
    if (ds.dashed) pdf.setLineDashPattern([2, 1.5], 0);
    else pdf.setLineDashPattern([], 0);

    for (let i = 0; i < points.length - 1; i++) {
      pdf.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }
    pdf.setLineDashPattern([], 0);

    pdf.setFillColor(r, g, b);
    points.forEach(([px, py]) => pdf.circle(px, py, 0.75, "F"));
  });

  // --- Legend --- positioned exactly after x-axis labels
  const legendY = aY + aH + X_LABEL_H + LEGEND_GAP;
  const colW = aW / Math.min(datasets.length, 3);

  datasets.forEach((ds, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const lx = aX + col * colW;
    const ly = legendY + row * LEGEND_ROW_H;
    const { r, g, b } = parseColor(ds.color || "#3b82f6");

    if (ds.dashed) {
      pdf.setDrawColor(r, g, b);
      pdf.setLineWidth(0.8);
      pdf.setLineDashPattern([2, 1.5], 0);
      pdf.line(lx, ly - 1.2, lx + 4, ly - 1.2);
      pdf.setLineDashPattern([], 0);
    } else {
      pdf.setFillColor(r, g, b);
      pdf.rect(lx, ly - 2.5, 4, 2.5, "F");
    }

    pdf.setFontSize(6);
    pdf.setTextColor(60, 60, 60);
    pdf.text(truncate(String(ds.label)), lx + 5.5, ly - 0.3);
  });

  // --- Reset ---
  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.4);
  pdf.setLineDashPattern([], 0);
};
