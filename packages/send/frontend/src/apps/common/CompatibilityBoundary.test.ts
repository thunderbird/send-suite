import { getByTestId } from '@/lib/testUtils';
import { useQuery } from '@tanstack/vue-query';
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConfigStore } from '../send/stores/config-store';
import CompatibilityBoundary from './CompatibilityBoundary.vue';

// Mock dependencies
vi.mock('@/lib/trpc', () => ({
  trpc: {
    settings: {
      query: vi.fn(),
    },
  },
}));
vi.mock('@tanstack/vue-query', () => {
  return {
    useQuery: vi.fn(),
  };
});
vi.mock('../send/stores/config-store', () => ({
  useConfigStore: vi.fn(),
}));

describe('CompatibilityBoundary', () => {
  let wrapper;
  const mockApiVersion = '1.2.3';
  const mockClientVersion = '1.0.0';
  let useQueryMock;
  let useConfigStoreMock;

  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock = vi.mocked(useQuery);
    useConfigStoreMock = vi.mocked(useConfigStore);
    useQueryMock.mockReturnValue({
      data: { value: null },
      isLoading: false,
      error: null,
    });
    useConfigStoreMock.mockReturnValue({
      isExtension: false,
    });
  });

  it('should show loading state when isLoading is true', async () => {
    useQueryMock.mockReturnValue({
      data: { value: null },
      isLoading: true,
      error: null,
    });
    wrapper = shallowMount(CompatibilityBoundary);
    expect(wrapper.findComponent({ name: 'LoadingComponent' }).exists()).toBe(
      true
    );
  });

  it('should show error when there is an error', async () => {
    useQueryMock.mockReturnValue({
      data: { value: null },
      isLoading: false,
      error: new Error('Test error'),
    });
    wrapper = shallowMount(CompatibilityBoundary);
    expect(wrapper.find(getByTestId('error')).exists()).toBe(true);
    expect(wrapper.find(getByTestId('error')).text()).toContain(
      'Error: Error: Test error'
    );
  });

  it('should render slot when compatibility is OK', async () => {
    useQueryMock.mockReturnValue({
      data: {
        value: {
          compatibility: { result: 'OK' },
          apiVersion: mockApiVersion,
          clientVersion: mockClientVersion,
        },
      },
      isLoading: false,
      error: null,
    });
    wrapper = shallowMount(CompatibilityBoundary, {
      slots: {
        default: '<div class="test-slot">Slot content</div>',
      },
    });
    expect(wrapper.find('.test-slot').exists()).toBe(true);
    expect(wrapper.find('.test-slot').text()).toBe('Slot content');
  });

  describe('FORCE_UPDATE state', () => {
    beforeEach(() => {
      useQueryMock.mockReturnValue({
        data: {
          value: {
            compatibility: { result: 'FORCE_UPDATE' },
            apiVersion: mockApiVersion,
            clientVersion: mockClientVersion,
          },
        },
        isLoading: false,
        error: null,
      });
    });

    it('should show compatibility failed message and refresh button', async () => {
      wrapper = shallowMount(CompatibilityBoundary);
      expect(wrapper.find(getByTestId('force-update-banner')).exists()).toBe(
        true
      );
      expect(wrapper.find(getByTestId('force-update-banner')).text()).toContain(
        'You are using an outdated version of Thunderbird Send.'
      );
      expect(wrapper.find(getByTestId('refresh-button')).exists()).toBe(true);
      expect(wrapper.find(getByTestId('refresh-button')).text()).toBe(
        'Click here to refresh'
      );
    });

    it('should show non-extension message when isExtension is false', async () => {
      useConfigStoreMock.mockReturnValue({
        isExtension: false,
      });
      wrapper = shallowMount(CompatibilityBoundary);
      expect(wrapper.find(getByTestId('force-update-banner')).text()).toContain(
        'If you tried refreshing and the problem persists, please try clearing your cache.'
      );
      expect(
        wrapper.find(getByTestId('force-update-banner')).text()
      ).not.toContain(`You are using version ${mockClientVersion}`);
    });

    it('should show extension message when isExtension is true', async () => {
      useConfigStoreMock.mockReturnValue({
        isExtension: true,
      });
      wrapper = shallowMount(CompatibilityBoundary);
      expect(
        wrapper.find(getByTestId('force-update-banner')).text()
      ).not.toContain(
        'If you tried refreshing and the problem persists, please try clearing your cache.'
      );
      expect(wrapper.find(getByTestId('force-update-banner')).text()).toContain(
        `You are using version ${mockClientVersion}`
      );
      expect(wrapper.find(getByTestId('force-update-banner')).text()).toContain(
        `Please update to version ${mockApiVersion} or higher`
      );
      expect(wrapper.find(getByTestId('force-update-banner')).text()).toContain(
        'If you have automatic updates enabled, we suggest you restart Thunderbird'
      );
    });

    it('should show feedback box', async () => {
      wrapper = shallowMount(CompatibilityBoundary);
      expect(wrapper.findComponent({ name: 'FeedbackBox' }).exists()).toBe(
        true
      );
    });
  });
});
