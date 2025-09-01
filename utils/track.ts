import { events } from '@/utils/events';

export type TrackProps = Record<string, any>;

export function track(event: string, props?: TrackProps) {
  try {
    events.emit('analytics:track', { event, props });
  } catch {}
  // Basic console logging to assist during development and tests
  // Avoid breaking in environments without console
  try {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props ?? {});
  } catch {}
}
