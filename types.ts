
export interface WordDetails {
  word: string;
  ipa_us: string;
  ipa_uk: string;
  definition: string;
  example: string;
  partsOfSpeech: string[];
}

export interface HistoryItem extends WordDetails {
  id: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}
