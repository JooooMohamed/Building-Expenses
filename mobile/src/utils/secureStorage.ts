import * as Keychain from 'react-native-keychain';

const SERVICE_NAME = 'com.buildingexpenses.auth';

export async function setSecureItem(key: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(key, value, { service: `${SERVICE_NAME}.${key}` });
}

export async function getSecureItem(key: string): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service: `${SERVICE_NAME}.${key}` });
  if (result) return result.password;
  return null;
}

export async function deleteSecureItem(key: string): Promise<void> {
  await Keychain.resetGenericPassword({ service: `${SERVICE_NAME}.${key}` });
}
