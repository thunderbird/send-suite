<!-- eslint-disable vue/no-use-v-if-with-v-for -->
<script setup lang="ts">
import { DayJsKey } from '@/types';
import { inject, onMounted, ref, watch } from 'vue';

import useFolderStore from '@/apps/lockbox/stores/folder-store';
import '@thunderbirdops/services-ui/style.css';

import BreadCrumb from '@/apps/lockbox/components/BreadCrumb.vue';
import Btn from '@/apps/lockbox/elements/BtnComponent.vue';
import FolderTableRowCell from '@/apps/lockbox/elements/FolderTableRowCell.vue';
import { IconDotsVertical, IconDownload, IconTrash } from '@tabler/icons-vue';
import { ExpiryUnitTypes, ExpiryBadge } from '@thunderbirdops/services-ui';
import { useDebounceFn } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import { ItemResponse } from '../stores/folder-store.types';
import { useModal, useModalSlot } from 'vue-final-modal';
import DownloadModal from '@/apps/common/modals/DownloadModal.vue';
import DownloadConfirmation from './DownloadConfirmation.vue';

const folderStore = useFolderStore();

const dayjs = inject(DayJsKey);

const route = useRoute();
const router = useRouter();
const itemRef = ref<ItemResponse>();

const onDownloadConfirm = () =>
  folderStore.downloadContent(
    itemRef.value.uploadId,
    itemRef.value.containerId,
    itemRef.value.wrappedKey,
    itemRef.value.name
  );

const { open, close: closefn } = useModal({
  component: DownloadModal,
  attrs: {
    title: 'Download File?',
  },
  slots: {
    default: useModalSlot({
      component: DownloadConfirmation,
      attrs: {
        closefn: () => closefn(),
        confirm: onDownloadConfirm,
      },
    }),
  },
});

const openModal = (item: ItemResponse) => {
  itemRef.value = item;
  open();
};

const gotoRoute = useDebounceFn(() => {
  const id = Number(route.params.id);
  if (!!id) {
    folderStore.goToRootFolder(id);
    return;
  }
  folderStore.goToRootFolder(null);
}, 1);

onMounted(() => {
  gotoRoute();
});

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      gotoRoute();
    }
  }
);
</script>
<script lang="ts">
export default { props: { id: { type: String, default: 'null' } } };
</script>
<template>
  <div class="w-full flex flex-col gap-3">
    <h2 class="font-bold">Your Files</h2>
    <BreadCrumb />
    <table class="w-full border-separate border-spacing-x-0 border-spacing-y-1">
      <thead>
        <tr>
          <th class="border-r border-b border-gray-300"></th>
          <th class="border-r border-b border-gray-300">Name</th>
          <th class="border-b border-gray-300"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="folder in folderStore.visibleFolders"
          :key="folder.id"
          class="group cursor-pointer"
          @click="folderStore.setSelectedFolder(folder.id)"
          @dblclick="router.push({ name: 'folder', params: { id: folder.id } })"
        >
          <FolderTableRowCell
            :selected="folder.id === folderStore.selectedFolder?.id"
          >
            <img src="@/apps/lockbox/assets/folder.svg" class="w-8 h-8" />
          </FolderTableRowCell>
          <FolderTableRowCell
            :selected="folder.id === folderStore.selectedFolder?.id"
          >
            <div>{{ folder.name }}</div>
            <div class="text-sm">
              Last modified {{ dayjs().to(dayjs(folder.updatedAt)) }}
            </div>
          </FolderTableRowCell>
          <FolderTableRowCell
            :selected="folder.id === folderStore.selectedFolder?.id"
          >
            <div class="flex justify-between">
              <div
                class="flex gap-2 opacity-0 group-hover:!opacity-100 transition-opacity"
                :class="{
                  '!opacity-100': folder.id === folderStore.selectedFolder?.id,
                }"
              >
                <Btn danger @click="folderStore.deleteFolder(folder.id)">
                  <IconTrash class="w-4 h-4" />
                </Btn>
              </div>
              <Btn class="ml-auto">
                <IconDotsVertical class="w-4 h-4" />
              </Btn>
            </div>
          </FolderTableRowCell>
        </tr>
        <tr
          v-for="item in folderStore.rootFolder.items"
          v-if="folderStore.rootFolder"
          :key="item.id"
          class="group cursor-pointer"
          @click="folderStore.setSelectedFile(item.id)"
        >
          <FolderTableRowCell>
            <div class="flex justify-end">
              <img src="@/apps/lockbox/assets/file.svg" class="w-8 h-8" />
            </div>
          </FolderTableRowCell>
          <FolderTableRowCell>
            <div>{{ item.name }}</div>
            <div class="text-sm">
              Last modified {{ dayjs().to(dayjs(item.updatedAt)) }}
            </div>
            <ExpiryBadge
              :time-remaining="item.upload.daysToExpiry"
              :warning-threshold="10"
              :time-unit="ExpiryUnitTypes.Days"
              class="my-2"
            />
          </FolderTableRowCell>
          <FolderTableRowCell>
            <div class="flex justify-between">
              <div
                class="flex gap-2 opacity-0 group-hover:!opacity-100 transition-opacity"
              >
                <Btn
                  v-if="!item.upload.expired"
                  secondary
                  @click="openModal(item)"
                >
                  <IconDownload class="w-4 h-4" />
                </Btn>
                <Btn
                  v-if="!item.upload.expired"
                  danger
                  @click="
                    folderStore.deleteItem(item.id, folderStore.rootFolder.id)
                  "
                >
                  <IconTrash class="w-4 h-4" />
                </Btn>
              </div>
              <Btn class="ml-auto">
                <IconDotsVertical class="w-4 h-4" />
              </Btn>
            </div>
          </FolderTableRowCell>
        </tr>
      </tbody>
    </table>
  </div>
</template>
