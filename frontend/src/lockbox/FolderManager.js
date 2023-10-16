// will want to import a shim-able FileIO lib
// by "shim-able", I mean ones that will select the backing storage
// based on what environment we're running in.
import Uploader from '@/common/upload';

export class FolderManager {
  constructor(user, keychain, api) {
    // TODO: remove this when we switch to server-side sessions
    this.user = user.value ?? user;
    this.keychain = keychain.value ?? keychain;
    this.api = api;

    this.folders = []; // or is this a tree?
    this.currentFolder = null;
    this.currentFile = null;
    this.itemId = 0;
    this.uploader = new Uploader(user, keychain, api);
  }

  // Using arrow function syntax to preserve `this`
  setCurrentFile = async (obj) => {
    console.log(`you called folderManager.setCurrentFile with:`);
    console.log(obj);
    if (!obj) {
      // reset
      this.currentFile = null;
      return;
    }
    const { size, type } = await this.api.getUploadMetadata(obj.uploadId);
    this.itemId = obj.itemId;
    this.currentFile = {
      ...obj,
      upload: {
        size,
        type,
      },
    };
  };

  // TODO: actually limit this to a specific folder
  async getFolders(root) {
    if (!this.user.id) {
      console.log(`no valid user id`);
      return;
    }
    if (!root) {
      this.folders = await this.api.getAllFolders(this.user.id);
      console.log(`loaded ${this.folders.length} folders`);
    } else {
      console.log(`TBD: what to do if we specify a root folder`);
    }
  }

  // Can I watch these?
  get sharedWithMe() {
    // Folders I can access, but do not own
    // This is basically a filtering function.
  }

  // Can I watch these?
  get sharedWithOthers() {
    // Folders I own, share with others
    // This is basically a filtering function.
  }

  async search(searchString, maybeModifiedDate, maybeCreatedDate) {
    // Can only search titles, not contents
    // The date stuff could just be booleans for sorting
  }

  async createDefaultFolder() {}

  async setDefaultFolder() {
    // should we be able to set a different default?
  }

  async createFolder(parentFolderId = 0) {}

  async upload(folderId) {}

  async deleteFolder() {
    // remove self from group?
    // or burn the folder?
  }

  async copy(itemIds, destinationFolderId) {}
  async delete(itemIds) {}
  async move(itemIds, destinationFolderId) {
    // this.copy();
    // this.delete();
  }
}
