import FolderView from '@/apps/send/components/FolderView.vue';
import { routes } from '@/apps/send/router';
import { DayJsKey } from '@/types';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';

let router;
let wrapper;

const { goToRootFolderSpy } = vi.hoisted(() => {
  return { goToRootFolderSpy: vi.fn() };
});

// Setup testing environment
vi.mock('@/apps/send/stores/folder-store', () => {
  return {
    esmodule: true,
    default: vi.fn(() => ({
      goToRootFolder: goToRootFolderSpy,
    })),
  };
});
vi.useFakeTimers();

describe('FolderView', () => {
  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes,
    });

    wrapper = mount(FolderView, {
      global: {
        plugins: [router],
        provide: {
          //@ts-ignore
          [DayJsKey]: () => ({ to: () => 'a while ago' }),
        },
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders correctly and reacts to route changes', async () => {
    expect(wrapper.text()).toContain('Your Files');

    // Trigger route change
    await router.push({ name: 'folder', params: { id: '0' } });
    await wrapper.vm.$nextTick();

    // Advance timers for debounced functions
    // This is VERY IMPORTANT to make sure the debounced function is called
    vi.runAllTimers();

    // Check if goToRootFolder was called with new id
    expect(goToRootFolderSpy).toBeCalledWith(null);

    await router.push({ name: 'folder', params: { id: '123' } });
    await wrapper.vm.$nextTick();
    vi.runAllTimers();

    expect(goToRootFolderSpy).toBeCalledWith(123);
  });
});
