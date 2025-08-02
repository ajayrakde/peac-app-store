import { env } from '../config/env.js';
import { SupabaseStorageProvider } from './SupabaseStorageProvider.js';
import { FirebaseStorageProvider } from './FirebaseStorageProvider.js';
import type { StorageProvider } from './StorageProvider.js';

export function createStorageProvider(): StorageProvider {
  if (env.STORAGE_PROVIDER === 'firebase') {
    return new FirebaseStorageProvider();
  }
  return new SupabaseStorageProvider();
}

export const storageProvider = createStorageProvider();
export * from './StorageProvider.js';
