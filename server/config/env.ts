import { config } from 'dotenv';
import { z } from 'zod';
import {
  ConfigProvider,
  EnvConfigProvider,
  KeyVaultConfigProvider,
  CompositeConfigProvider,
} from './providers/ConfigProvider';

// Load .env into process.env for local development
config();

const envSchema = z.object({
  CACHE_ENABLED: z.string().optional(),
  CACHE_TTL: z.string().optional(),
  CACHE_MIN_RECORDS: z.string().optional(),
  CACHE_CANDIDATES_ENABLED: z.string().optional(),
  CACHE_CANDIDATES_TTL: z.string().optional(),
  CACHE_CANDIDATES_MIN_RECORDS: z.string().optional(),
  CACHE_EMPLOYERS_ENABLED: z.string().optional(),
  CACHE_EMPLOYERS_TTL: z.string().optional(),
  CACHE_EMPLOYERS_MIN_RECORDS: z.string().optional(),
  CACHE_JOBS_ENABLED: z.string().optional(),
  CACHE_JOBS_TTL: z.string().optional(),
  CACHE_JOBS_MIN_RECORDS: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  PGDATABASE: z.string().optional(),
  PGHOST: z.string().optional(),
  PGPORT: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_PRIVATE_KEY_B64: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['supabase', 'firebase']).optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  MAX_FILE_SIZE_MB: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

async function loadEnv(): Promise<Record<string, string | undefined>> {
  const providers: ConfigProvider[] = [new EnvConfigProvider()];

  // If KEY_VAULT_NAME is provided, load secrets from Azure Key Vault
  const vaultName = process.env.KEY_VAULT_NAME;
  if (vaultName) {
    providers.unshift(new KeyVaultConfigProvider(vaultName));
  }

  const composite = new CompositeConfigProvider(providers);
  const keys = Object.keys(envSchema.shape);
  const result: Record<string, string | undefined> = {};
  for (const key of keys) {
    result[key] = await composite.get(key);
  }
  return result;
}

export const env = await loadEnv().then((values) => envSchema.parse(values));
