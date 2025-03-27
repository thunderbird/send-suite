import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export const generatePassphrase = (phraseSize: number): string[] => {
  // Generate a mnemonic phrase with 128 bits of entropy (12 words)
  const mnemonicPhrase = bip39.generateMnemonic(wordlist, 128);
  const words = mnemonicPhrase.split(' ');

  // Return n words determined by the phraseSize parameter
  return words.slice(0, phraseSize);
};
