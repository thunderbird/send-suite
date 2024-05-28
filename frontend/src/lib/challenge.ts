import { Util, Keychain } from '@/lib/keychain';
import { ApiConnection } from '@/lib/api';

export async function getContainerKeyFromChallenge(
  hash: string,
  password: string,
  api: ApiConnection,
  keychain: Keychain
): Promise<{
  unwrappedKey: CryptoKey;
  containerId: number;
} | null> {
  const resp = await api.call<{
    challengeKey: string;
    challengeSalt: string;
    challengeCiphertext: string;
  }>(`sharing/${hash}/challenge`);

  if (!resp) {
    return null;
  }

  // Step 1: receive the challenge info,
  // renaming each property so it's clear that we're working with strings.
  const {
    challengeKey: challengeKeyStr,
    challengeSalt: challengeSaltStr,
    challengeCiphertext,
  } = resp;

  // Step 2: convert to array buffers, as necessary.
  // Only the salt needs to be converted to an array buffer.
  // This is handled automatically by keychain.password.unwrapContentKey
  let challengeSalt: ArrayBufferLike;
  try {
    challengeSalt = Util.base64ToArrayBuffer(challengeSaltStr);
  } catch (e) {
    return null;
  }

  try {
    // Step 3: unwrap the challenge key using the password
    let unwrappedChallengeKey: CryptoKey =
      await keychain.password.unwrapContentKey(
        challengeKeyStr,
        password,
        challengeSalt
      );

    // Step 4: decrypt the challenge ciphertext and send it back
    let challengePlaintext: string = await keychain.challenge.decryptChallenge(
      challengeCiphertext,
      unwrappedChallengeKey,
      challengeSalt
    );

    // Step 5: post the challenge text to receive:
    // - containerId
    // - wrapped container key
    // - salt (for unwrapping container key)
    const challengeResp = await api.call<{
      status: string;
      containerId: number;
      wrappedKey: string;
      salt: string;
    }>(
      `sharing/${hash}/challenge`,
      {
        challengePlaintext,
      },
      'POST'
    );

    if (!challengeResp.containerId) {
      throw Error('Challenge unsuccessful');
    }
    const {
      containerId,
      wrappedKey: wrappedKeyStr,
      salt: saltStr,
    } = challengeResp;

    // Step 6: unwrap the container key using the password
    const unwrappedKey: CryptoKey = await keychain.password.unwrapContainerKey(
      wrappedKeyStr,
      password,
      Util.base64ToArrayBuffer(saltStr)
    );

    return { unwrappedKey, containerId };
  } catch (e) {
    console.log(e);
    return null;
  }
}
