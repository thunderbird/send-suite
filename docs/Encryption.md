The system uses end-to-end encryption, and the keys are never stored in cleartext on the server.

Every file is encrypted with a unique Content Encryption Key before it is uploaded.
Every folder has its own Key Encryption Key.
To represent the existence of an encrypted file in a folder, I create an `Item`, which has a field for the wrapped key (the Content Encryption Key).
