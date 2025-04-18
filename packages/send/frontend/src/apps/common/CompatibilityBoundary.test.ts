/* eslint-disable @typescript-eslint/no-explicit-any */
import { getByTestId } from '@/lib/testUtils';
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CompatibilityBoundary from './CompatibilityBoundary.vue';

// Mock the trpc module
vi.mock('@/lib/trpc', () => ({
  trpc: {
    settings: {
      query: vi.fn(),
    },
  },
}));

// Mock the useQuery hook
vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn(() => ({
    data: { value: null },
    isLoading: false,
    error: null,
  })),
}));

describe('CompatibilityBoundary', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state when isLoading is true', async () => {
    const { useQuery } = await import('@tanstack/vue-query');
    vi.mocked(useQuery).mockReturnValue({
      data: { value: null },
      isLoading: true,
      error: null,
    } as any);

    wrapper = shallowMount(CompatibilityBoundary);

    expect(wrapper.find(getByTestId('loading')));
  });

  it('should show error when there is an error', async () => {
    const { useQuery } = await import('@tanstack/vue-query');
    vi.mocked(useQuery).mockReturnValue({
      data: { value: null },
      isLoading: false,
      error: new Error('Test error'),
    } as any);

    wrapper = shallowMount(CompatibilityBoundary);
    expect(wrapper.find(getByTestId('error')));
  });

  it('should render slot when compatibility is null', async () => {
    const { useQuery } = await import('@tanstack/vue-query');
    vi.mocked(useQuery).mockReturnValue({
      data: { value: { compatibility: { result: 'OK' } } },
      isLoading: false,
      error: null,
    } as any);

    wrapper = shallowMount(CompatibilityBoundary, {
      slots: {
        default: '<div class="test-slot">Slot content</div>',
      },
    });

    expect(wrapper.find('.test-slot').exists()).toBe(true);
    expect(wrapper.find('.test-slot').text()).toBe('Slot content');
  });

  it('should show compatibility failed message when FORCE_UPDATE', async () => {
    const { useQuery } = await import('@tanstack/vue-query');
    vi.mocked(useQuery).mockReturnValue({
      data: { value: { compatibility: { result: 'FORCE_UPDATE' } } },
      isLoading: false,
      error: null,
    } as any);

    wrapper = shallowMount(CompatibilityBoundary);
    expect(wrapper.find(getByTestId('force-update-banner')));
  });
});
