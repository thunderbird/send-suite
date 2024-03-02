/*
 * This file is provided by the addon-developer-support repository at
 * https://github.com/thundernest/addon-developer-support
 *
 * Version 1.2
 * - adjusted to properly work with TB115 and TB102
 *
 * Version 1.1
 * - adjusted to Thunderbird Supernova (Services is now in globalThis)
 *
 * Version 1.0
 * - initial release
 *
 * Author: John Bieling (john@thunderbird.net)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const dataDir = 'tb-lockbox';

// Import some things we need.
var { ExtensionCommon } = ChromeUtils.import(
  'resource://gre/modules/ExtensionCommon.jsm'
);
var { ExtensionUtils } = ChromeUtils.import(
  'resource://gre/modules/ExtensionUtils.jsm'
);
var { ExtensionError } = ExtensionUtils;

Cu.importGlobalProperties(['IOUtils', 'PathUtils']);

var FileSystem = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      FileSystem: {
        readFile(filename) {
          let filePath = PathUtils.join(
            PathUtils.profileDir,
            dataDir,
            context.extension.id,
            filename
          );
          if (IOUtils.exists(filePath)) {
            return IOUtils.readUTF8(filePath);
          }
          throw new ExtensionError(`File at "${filePath}" does not exist`);
        },

        writeFile(filename, data) {
          let filePath = PathUtils.join(
            PathUtils.profileDir,
            dataDir,
            context.extension.id,
            filename
          );
          return IOUtils.writeUTF8(filePath, data);
        },
        stat(filename) {
          let filePath = PathUtils.join(
            PathUtils.profileDir,
            dataDir,
            context.extension.id,
            filename
          );
          return IOUtils.stat(filePath);
        },
        listContents(dirpath = '/') {
          let path = dirpath;
          if (path === '/') {
            path = '';
          }
          let filePath = PathUtils.join(
            PathUtils.profileDir,
            dataDir,
            context.extension.id,
            path
          );
          return IOUtils.getChildren(filePath);
        },
        getDirectory(dirpath = '') {
          let path = dirpath;
          if (path === '/') {
            path = '';
          }
          let filePath = PathUtils.join(
            PathUtils.profileDir,
            dataDir,
            context.extension.id,
            path
          );
          return IOUtils.getDirectory(filePath);
        },
      },
    };
  }
};
