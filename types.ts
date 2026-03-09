
export type AppView = 'home' | 'login' | 'signup' | 'dashboard' | 'scanner' | 'result' | 'evaluation';

export interface Metrics {
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  totalScans: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface User {
  fullName: string;
  email: string;
}

export enum DetectionStatus {
  SAFE = 'SAFE',
  PHISHING = 'PHISHING',
  SUSPICIOUS = 'SUSPICIOUS'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ScanResult {
  url: string;
  status: DetectionStatus;
  explanation: string;
  siteName?: string;
  sources?: GroundingSource[];
  analysisTime?: number;
}
