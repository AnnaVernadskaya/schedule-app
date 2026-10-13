export const GROUP = 'МИСТ-25-3-1';

export type Lesson = {
  id: string;
  group_id: string;
  subject: string;
  teacher: string;
  topic: string;
  kind: string;
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  recording_url: string | null;
  color: string;
};

export const subjectColors: Record<string, { background: string; accent: string }> = {
  pink: { background: '#fbe8ee', accent: '#dd5c82' },
  blue: { background: '#e8f0ff', accent: '#568be5' },
  violet: { background: '#efeafd', accent: '#a38ae8' },
  green: { background: '#edf5e8', accent: '#89b65b' },
  peach: { background: '#fff0e4', accent: '#e89853' },
};

export function safeUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}
