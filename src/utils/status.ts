import type { StatusInfo } from '../types';

const MAP: Record<string, StatusInfo> = {
  Active:  { pt: 'ativo',    dot: '#34d399', fg: '#0f9d6e', bg: '#e3f6ee', br: '#bfe9d6' },
  Paused:  { pt: 'pausado',  dot: '#fbbf24', fg: '#b07d10', bg: '#fbf1d8', br: '#eed9a6' },
  Error:   { pt: 'com erro', dot: '#f87171', fg: '#d23f3f', bg: '#fbe7e7', br: '#f2c5c5' },
};

export function statusInfo(status?: string): StatusInfo {
  return MAP[status ?? 'Active'] ?? MAP['Active'];
}
