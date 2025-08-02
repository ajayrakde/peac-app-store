export interface ConfigProvider {
  get(key: string): Promise<string | undefined> | string | undefined;
}

export class EnvConfigProvider implements ConfigProvider {
  get(key: string): string | undefined {
    return process.env[key];
  }
}

export class CompositeConfigProvider implements ConfigProvider {
  constructor(private providers: ConfigProvider[]) {}
  async get(key: string): Promise<string | undefined> {
    for (const p of this.providers) {
      const value = await p.get(key);
      if (value !== undefined) {
        return value;
      }
    }
    return undefined;
  }
}

import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

export class KeyVaultConfigProvider implements ConfigProvider {
  private client?: SecretClient;

  constructor(vaultName: string) {
    if (vaultName) {
      const url = `https://${vaultName}.vault.azure.net`;
      try {
        this.client = new SecretClient(url, new DefaultAzureCredential());
      } catch (err) {
        console.warn('Failed to initialize Key Vault client', err);
      }
    }
  }

  async get(key: string): Promise<string | undefined> {
    if (!this.client) return undefined;
    const vaultKey = key.toLowerCase().replace(/_/g, '-');
    try {
      const result = await this.client.getSecret(vaultKey);
      return result.value;
    } catch (err) {
      console.warn(`Failed to retrieve secret ${vaultKey} from Key Vault`, err);
      return undefined;
    }
  }
}
