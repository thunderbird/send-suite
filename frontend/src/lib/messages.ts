/* 
This file contains all the messages that are displayed to the user. 
Whenever we switch to something like i18n, this file will be the one to change.
*/

import { MAX_FILE_SIZE_HUMAN_READABLE } from './const';

export const CLIENT_MESSAGES = {
  SHOULD_LOG_IN: `You need to log into your mozilla account. Make sure you're in the allow list for alpha access.`,
  FILE_TOO_BIG: `Your file size is not supported, please try with files smaller than ${MAX_FILE_SIZE_HUMAN_READABLE}`,
  UPLOAD_FAILED: `Upload failed. Please try again.`,
};
