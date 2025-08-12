export interface ChartData {
  labels: string[];
  values: number[];
  startTime: string;
  endTime: string;
  freq: number; // saniye cinsinden
  server: string;
  sampleType: string;
}

const defaultLabels = ['10:00', '10:05', '10:10', '10:15', '10:20'];

const startISO = '2025-08-08T10:00:00Z';
const endISO = '2025-08-08T10:20:00Z';

// Geçersiz sayıları 0 ile değiştirecek fonksiyon
const sanitizeData = (data: number[]): number[] => {
  return data.map((value) => (isFinite(value) ? value : 0)); // Geçersiz sayıları 0 ile değiştir
};

export const mockChartData: Record<string, ChartData> = {
  CA_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData([30, 32, 31, 33, 34]), // Geçersiz veri kontrolü
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server A',
    sampleType: 'AVG',
  },
  VCM_TEMP: {
    labels: defaultLabels,
    values: sanitizeData([120, 122, 121, 123, 124]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server B',
    sampleType: 'RAW',
  },
  EOEG_FLOW: {
    labels: defaultLabels,
    values: sanitizeData([15, 16, 15.5, 16.2, 16.8]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server C',
    sampleType: 'AVG',
  },
  PTA_LEVEL: {
    labels: defaultLabels,
    values: sanitizeData([45, 47, 46.5, 48, 49]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server D',
    sampleType: 'RAW',
  },
  AYPE_T_TEMP: {
    labels: defaultLabels,
    values: sanitizeData([110, 111, 112, 113, 114]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server A',
    sampleType: 'AVG',
  },
  PA_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData([60, 61, 62, 63, 64]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server B',
    sampleType: 'RAW',
  },
  PP_TEMP: {
    labels: defaultLabels,
    values: sanitizeData([100, 101, 100.5, 101.2, 102]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server C',
    sampleType: 'AVG',
  },
  YYPE_FLOW: {
    labels: defaultLabels,
    values: sanitizeData([18, 18.2, 18.1, 18.5, 18.8]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server D',
    sampleType: 'RAW',
  },
  BU_EU_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData([55, 56, 55.5, 56.2, 57]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server A',
    sampleType: 'AVG',
  },
  AGU_TEMP: {
    labels: defaultLabels,
    values: sanitizeData([90, 91, 90.5, 92, 93]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server B',
    sampleType: 'RAW',
  },
  ACN_LEVEL: {
    labels: defaultLabels,
    values: sanitizeData([70, 72, 71.5, 73, 74]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server C',
    sampleType: 'AVG',
  },
  AYPE_TEMP: {
    labels: defaultLabels,
    values: sanitizeData([130, 131, 130.5, 132, 133]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server D',
    sampleType: 'RAW',
  },
  ETILEN_FLOW: {
    labels: defaultLabels,
    values: sanitizeData([20, 20.5, 20.2, 21, 21.5]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server A',
    sampleType: 'AVG',
  },
  AROM_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData([40, 41, 40.5, 42, 43]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server B',
    sampleType: 'RAW',
  },
  PVC_TEMP: {
    labels: defaultLabels,
    values: sanitizeData([85, 86, 85.5, 87, 88]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server C',
    sampleType: 'AVG',
  },
  YN_SU_ART_FLOW: {
    labels: defaultLabels,
    values: sanitizeData([22, 22.5, 22.2, 23, 23.5]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server D',
    sampleType: 'RAW',
  },
  E_SU_ART_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData([35, 36, 35.5, 36.2, 37]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server A',
    sampleType: 'AVG',
  },
  UNIT100_PRESSURE: {
    labels: defaultLabels,
    values: sanitizeData([65, 66, 65.5, 67, 68]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server B',
    sampleType: 'RAW',
  },
  UNIT110_TEMP: {
    labels: defaultLabels,
    values: sanitizeData([95, 96, 95.5, 97, 98]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server C',
    sampleType: 'AVG',
  },
  UNIT150_LEVEL: {
    labels: defaultLabels,
    values: sanitizeData([78, 79, 78.5, 80, 81]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server D',
    sampleType: 'RAW',
  },
  UNIT190_FLOW: {
    labels: defaultLabels,
    values: sanitizeData([12, 12.2, 12.1, 12.5, 12.8]),
    startTime: startISO,
    endTime: endISO,
    freq: 300,
    server: 'Server A',
    sampleType: 'AVG',
  },
};
