import { ProgressTracker } from '@/apps/send/stores/status-store';
import { vi } from 'vitest';

const progressTracker = vi.fn();
export const mockProgressTracker = {
  total: 0,
  progressed: 0,
  percentage: 0,
  error: '',
  text: '',
  initialize: progressTracker,
  setProgress: progressTracker,
  setUploadSize: progressTracker,
  setText: progressTracker,
} as ProgressTracker;
