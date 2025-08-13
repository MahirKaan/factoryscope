// mock/mockChartData.ts

export interface ChartData {
  labels: string[];
  values: number[];
  startTime: string;
  endTime: string;
  freq: number;       // saniye
  server: string;
  sampleType: string; // AVG | RAW | MIN | MAX ...
}

/* ---------------- Helpers ---------------- */

const generateTimeLabels = (startISO: string, endISO: string, freqSec: number): string[] => {
  const out: string[] = [];
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  if (!isFinite(s) || !isFinite(e) || freqSec <= 0 || s > e) return out;
  for (let t = s; t <= e; t += freqSec * 1000) {
    out.push(new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
  }
  return out;
};

// Geçersiz sayıları 0 yap
const sanitizeData = (arr: number[]): number[] => arr.map(v => (Number.isFinite(v) ? v : 0));

// Daha şovlu/kıvrımlı seri üretici (deterministik)
const makeCurvySeries = (
  n: number,
  base = 50,          // etrafında dalgalanacağı değer
  amp = 20,           // genlik
  freq = 1.4,         // kaç kıvrım
  phase = 0           // faz kaydırma (serileri farklılaştırır)
): number[] => {
  const a2 = amp * 0.45;
  const f2 = freq * 0.65;
  return Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(1, n - 1); // 0..1
    const v =
      base +
      amp * Math.sin(2 * Math.PI * (freq * t) + phase) +
      a2 * Math.sin(2 * Math.PI * (f2 * t) + phase * 0.7);
    return Number(v.toFixed(1));
  });
};

/* ---------------- Defaults ---------------- */

const startISO = '2025-08-08T10:00:00Z';
const endISO   = '2025-08-08T11:00:00Z'; // 1 saat → daha fazla örnek nokta
const FREQ = 300; // 5 dk
const defaultLabels = generateTimeLabels(startISO, endISO, FREQ);
const N = defaultLabels.length;

/* ---------------- Data ---------------- */

export const mockChartData: Record<string, ChartData> = {
  CA_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 32, 4.5, 1.6, 0.2)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server A', sampleType: 'AVG',
  },
  VCM_TEMP: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 121, 7.5, 1.9, 0.9)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server B', sampleType: 'RAW',
  },
  EOEG_FLOW: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 16, 2.8, 1.5, 0.4)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server C', sampleType: 'AVG',
  },
  PTA_LEVEL: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 47, 4.2, 1.4, 1.3)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server D', sampleType: 'RAW',
  },
  AYPE_T_TEMP: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 112, 6.0, 1.7, 0.7)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server A', sampleType: 'AVG',
  },
  PA_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 62, 5.2, 1.5, 0.35)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server B', sampleType: 'RAW',
  },
  PP_TEMP: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 101, 4.0, 1.65, 1.1)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server C', sampleType: 'AVG',
  },
  YYPE_FLOW: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 18.3, 1.9, 1.45, 0.25)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server D', sampleType: 'RAW',
  },
  BU_EU_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 56, 3.6, 1.55, 0.85)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server A', sampleType: 'AVG',
  },
  AGU_TEMP: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 91.5, 6.8, 2.1, 0.5)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server B', sampleType: 'RAW',
  },
  ACN_LEVEL: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 72, 4.4, 1.35, 0.6)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server C', sampleType: 'AVG',
  },
  AYPE_TEMP: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 131.5, 7.2, 1.85, 1.0)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server D', sampleType: 'RAW',
  },
  ETILEN_FLOW: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 20.8, 2.3, 1.6, 0.15)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server A', sampleType: 'AVG',
  },
  AROM_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 41.5, 4.8, 1.7, 0.95)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server B', sampleType: 'RAW',
  },
  PVC_TEMP: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 86.2, 5.4, 1.9, 0.45)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server C', sampleType: 'AVG',
  },
  YN_SU_ART_FLOW: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 22.6, 2.0, 1.55, 0.75)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server D', sampleType: 'RAW',
  },
  E_SU_ART_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 36.1, 3.1, 1.45, 0.2)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server A', sampleType: 'AVG',
  },
  UNIT100_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 66.2, 5.0, 1.6, 1.2)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server B', sampleType: 'RAW',
  },
  UNIT110_TEMP: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 96.4, 5.6, 1.75, 0.3)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server C', sampleType: 'AVG',
  },
  UNIT150_LEVEL: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 79.2, 4.8, 1.5, 0.55)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server D', sampleType: 'RAW',
  },
  UNIT190_FLOW: {
    labels: defaultLabels,
    values: sanitizeData(makeCurvySeries(N, 12.6, 1.6, 1.35, 0.4)),
    startTime: startISO, endTime: endISO, freq: FREQ, server: 'Server A', sampleType: 'AVG',
  },
};
