export interface Bot {
  name: string;
  description?: string;
  status?: 'Active' | 'Paused' | 'Error';
  language?: string;
  schedule?: string;
  version?: string;
}

export interface BotParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required?: boolean;
  default?: string | number | boolean;
  placeholder?: string;
  options?: string[];
}

export interface BotMeta extends Bot {
  lastRun?: string;
  run?: string;
  params?: BotParam[];
}

export interface RunResult {
  exitCode?: number;
  ms: number;
  stdout?: string;
  stderr?: string;
  error?: string;
  sandbox?: boolean;
  shown?: number;
  total?: number;
  items?: unknown[];
  payload?: unknown;
}

export interface WsMessage {
  type: 'change' | 'add' | 'unlink' | 'addDir' | 'unlinkDir';
  rel: string;
}

export interface StatusInfo {
  pt: string;
  dot: string;
  fg: string;
  bg: string;
  br: string;
}

export interface SectionData {
  id: string;
  title: string;
  dot: string;
  subItems: { id: string; label: string }[];
}

export interface ConfigInfo {
  botsDir: string;
}
