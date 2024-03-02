import { Util } from '@/lib/keychain';

export async function getContainerKeyFromChallenge(hash, password, api, keychain) {
  // call api at /api/ephemeral/:hash
  const resp = await api.callApi(`sharing/${hash}/challenge`);

  if (!resp) {
    console.log('uh oh');
    return;
  }

  // Step 1: receive the challenge
  // Renaming so it's clear that we're working with strings
  const { challengeKey: challengeKeyStr, challengeSalt: challengeSaltStr, challengeCiphertext } = resp;

  // Step 2: convert to array buffers, as necessary.
  // Only the salt needs to be converted to an array buffer.
  // This is handled automatically by keychain.password.unwrapContentKey
  let challengeSalt;
  try {
    challengeSalt = Util.base64ToArrayBuffer(challengeSaltStr);
  } catch (e) {
    console.log(`Invalid link`);
    return;
  }

  try {
    // Step 3: unwrap the challenge key using the password
    let unwrappedChallengeKey = await keychain.password.unwrapContentKey(challengeKeyStr, password, challengeSalt);

    // Step 4: decrypt the challenge ciphertext and send it back
    let challengePlaintext = await keychain.challenge.decryptChallenge(
      challengeCiphertext,
      unwrappedChallengeKey,
      challengeSalt
    );

    // Step 5: post the challenge text to receive:
    // - containerId
    // - wrapped container key
    // - salt (for unwrapping container key)
    const challengeResp = await api.callApi(
      `sharing/${hash}/challenge`,
      {
        challengePlaintext,
      },
      'POST'
    );

    if (!challengeResp.containerId) {
      throw Error('Challenge unsuccessful');
    }
    const { containerId, wrappedKey: wrappedKeyStr, salt: saltStr } = challengeResp;

    // Step 6: unwrap the container key using the password
    const unwrappedKey = await keychain.password.unwrapContainerKey(
      wrappedKeyStr,
      password,
      Util.base64ToArrayBuffer(saltStr)
    );
    console.log(unwrappedKey);

    return { unwrappedKey, containerId };
  } catch (e) {
    console.log(e);
    return;
  }
}
