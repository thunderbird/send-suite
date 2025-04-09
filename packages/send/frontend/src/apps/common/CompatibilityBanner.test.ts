import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CompatibilityBanner from './CompatibilityBanner.vue';

const { queryResults, isProd, isLoading } = vi.hoisted(() => {
  return { queryResults: vi.fn(), isProd: vi.fn(), isLoading: vi.fn() };
});

vi.mock('../send/stores/config-store', () => ({
  useConfigStore: () => ({
    isProd: isProd(),
  }),
}));

function getByTestId(id) {
  return `[data-testid="${id}"]`;
}

// Mock trpc
vi.mock('@/lib/trpc', () => ({
  trpc: {
    settings: {
      query: queryResults(),
    },
  },
}));

// Mock vue-query
vi.mock('@tanstack/vue-query', () => ({
  useQuery: () => {
    return {
      data: { value: queryResults() },
      isLoading: isLoading(),
    };
  },
}));

describe('CompatibilityBanner.vue', () => {
  beforeEach(() => {
    queryResults.mockReturnValue({ compatibility: { result: 'COMPATIBLE' } });
    isProd.mockReturnValue(true);
    isLoading.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not show banner when isClosedByUser is true', async () => {
    isProd.mockReturnValue(false);
    const wrapper = mount(CompatibilityBanner);

    const closeButton = wrapper.find(getByTestId('close-button'));

    await closeButton.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('header').exists()).toBe(false);
  });

  it('should show testing banner when not in production', async () => {
    isProd.mockReturnValue(false);
    const wrapper = mount(CompatibilityBanner, {});
    const testingBanner = wrapper.find(getByTestId('testing-banner'));

    expect(testingBanner.exists()).toBe(true);
  });

  it('should show loading state when isLoading is true', async () => {
    queryResults.mockReturnValue({
      data: { value: null },
    });
    isLoading.mockReturnValue(true);

    const wrapper = mount(CompatibilityBanner);
    const loadingBanner = wrapper.find(
      getByTestId('loading-compatibility-banner')
    );

    expect(loadingBanner.exists()).toBe(true);
  });

  it('should show force update banner when compatibility is FORCE_UPDATE', async () => {
    isProd.mockReturnValue(true);
    queryResults.mockReturnValue({
      compatibility: { result: 'FORCE_UPDATE' },
    });

    const wrapper = mount(CompatibilityBanner);
    const forceUpdateBanner = wrapper.find(getByTestId('force-update-banner'));

    expect(forceUpdateBanner.exists()).toBe(true);
  });

  it('should show prompt update banner when compatibility is PROMPT_UPDATE', async () => {
    queryResults.mockReturnValue({
      compatibility: { result: 'PROMPT_UPDATE' },
    });

    const wrapper = mount(CompatibilityBanner);
    const forceUpdateBanner = wrapper.find(getByTestId('prompt-update-banner'));

    expect(forceUpdateBanner.exists()).toBe(true);
  });
});
