# LokalTalent

LokalTalent is a full stack job marketplace with a Vite-based React client and Express API. Docker images built from the included Dockerfile can be deployed to Azure.

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd lokaltalent
   ```

2. **Environment Configuration**
   ```bash
   # Copy the environment template
   cp .env.example .env
   
   # Edit with your settings
   nano .env

   # Do NOT commit this file. `.env` is gitignored for security.
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## Environment Configuration

The application uses a `.env` file for configuration. A template file `.env.example` is provided as a reference:

**Important:** Keep your `.env` private and out of version control.

### Required Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/lokaltalent"

# Authentication
VITE_FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email"
# Use either plain text with escaped newlines
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
# Or provide the key as base64
# FIREBASE_PRIVATE_KEY_B64="base64-encoded-key"
```

When storing `FIREBASE_PRIVATE_KEY` as a secret, replace newline characters with
`\n`. Alternatively, store the key in `FIREBASE_PRIVATE_KEY_B64` and decode it at
runtime to avoid parsing errors in GitHub Actions and Azure Key Vault.

The workflow `.github/workflows/az-container-deploy.yml` forwards this secret
directly to Azure Key Vault, so ensure it is already formatted with `\n` escapes
or base64-encoded before committing it to GitHub secrets.

### Optional Features

#### Caching (Optional)
```env
# Master switch for caching
CACHE_ENABLED=false

# Individual feature toggles
CACHE_CANDIDATES_ENABLED=false
CACHE_EMPLOYERS_ENABLED=false
CACHE_JOBS_ENABLED=false

# Performance thresholds
CACHE_MIN_RECORDS=1000  # Start caching when records exceed this number
```

#### Redis (Required if caching is enabled)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

### Why .env.example?

We maintain an `.env.example` file for several reasons:
1. **Security**: Real credentials in `.env` should never be committed to git
2. **Documentation**: Shows what environment variables are needed
3. **Onboarding**: New developers can quickly set up their environment
4. **Version Control**: Track required configuration changes

Always update `.env.example` when adding new environment variables!

## Azure Resources

The app runs best on **Azure Container Apps** or **Azure Web App for Containers**. The required resources are:

- Resource group
- Azure Container Registry (ACR) to store the Docker image
- Log Analytics workspace and Container Apps environment
- Container App (or App Service) that runs the image
- Optional custom domain and SSL certificate

A Terraform configuration is provided under `deploy/terraform` to provision these resources.

## Deploying with Terraform

1. Install Terraform and the Azure CLI.
2. Configure credentials (for example, a service connection in Azure DevOps or the `AZURE_CREDENTIALS` secret in GitHub Actions).
3. Run `terraform init` and `terraform apply` inside the `deploy/terraform` directory.
4. Build and push your image using the pipelines under `deploy/azure-app` or `deploy/github-app`.

To configure a custom domain, set `custom_domain_name` and certificate variables in `terraform.tfvars` before applying.

## Build

```bash
npm run build
```


The command bundles the server and produces `dist/index.js` which can be deployed.

## Storage Provider

File uploads use a pluggable storage layer. Set `STORAGE_PROVIDER` in `.env` to `supabase` (default) or `firebase`.
Supabase credentials require `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
The migration script `server/utils/migrateStorage.ts` copies all files from Supabase to Firebase.
Run it with `ts-node` when switching providers.


## Schema Workflow

The canonical database schema lives in `shared/schema.ts`. `drizzle-kit` reads
from this file when generating migrations. Any changes to the database should be
made here.

1. Update `shared/schema.ts` with your table or column changes.
2. Run `npx drizzle-kit generate` to create a new migration under `migrations/`.
3. Apply the migration to your database.
4. Commit the updated migration along with the schema file.

The TypeScript files inside `drizzle/schema/` are kept only for reference and are
not used by the migration tooling.

## Error Handling

Express route handlers in this project use an `asyncHandler` helper to catch
errors from asynchronous code. Wrapping each route with this helper forwards any
exceptions to the global `errorHandler` middleware.

```typescript
// server/routes/users.ts
import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await storage.getUserById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
}));

export default router;
```

At the application level, the `errorHandler` middleware centralizes error
responses and logging:

```typescript
// server/index.ts
import { errorHandler } from './middleware/errorHandler';

// ... register routes
app.use(errorHandler);
```

## Deploying to Azure Functions

1. Install the Azure Functions Core Tools.
2. After building, create a function that uses the `azure-function-express` adapter:

```javascript
// api/index.js
const { createHandler } = require('azure-function-express');
const app = require('../dist/index.js');

module.exports = createHandler(app);
```

3. Publish the function:

```bash
func azure functionapp publish <YOUR_APP_NAME>
```

This uploads the compiled Express app and exposes its routes via Azure Functions.

## Production Environment Variables

Configure these variables in the Function App settings (or `local.settings.json` when running locally):

- `DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY` or `FIREBASE_PRIVATE_KEY_B64`
- `FIREBASE_CLIENT_EMAIL`

### Key Vault Configuration

To load secrets from Azure Key Vault in production, also set:

- `KEY_VAULT_NAME` – the name of your vault (without the `.vault.azure.net` suffix)
- `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` – credentials for a service principal with access to the vault
- Or, instead of `AZURE_CLIENT_SECRET`, provide `AZURE_CLIENT_CERTIFICATE_PATH` for certificate-based auth

When these variables are present, `server/config/env.ts` uses `DefaultAzureCredential` to authenticate and resolves configuration values from Key Vault before falling back to environment variables.

They are required for the server to start correctly.

## Secure Deployment Workflow

The GitHub Actions file `.github/workflows/az-container-deploy.yml` demonstrates a full pipeline that stores secrets in Key Vault and injects them into an Azure Container App. Key steps include:

1. **Login to Azure** using `azure/login` with a service principal stored in `AZURE_CREDENTIALS`.
2. **Upload repository secrets** to Key Vault:
   ```yaml
   - name: Push all secrets to Azure Key Vault (in-memory)
     env:
       ALL_SECRETS: ${{ toJson(secrets) }}
       KEY_VAULT: ${{ env.KEY_VAULT }}
     run: |
       for key in $(echo $ALL_SECRETS | jq -r 'to_entries[] | select(.key != "AZURE_CREDENTIALS" and .key != "ACR_USERNAME" and .key != "ACR_PASSWORD" and .key != "FIREBASE_PRIVATE_KEY_B64") | .key'); do
         kv_key=$(echo "$key" | tr '[:upper:]' '[:lower:]' | tr '_' '-')
         val=$(echo $ALL_SECRETS | jq -r --arg k "$key" '.[$k]')
        az keyvault secret set --vault-name $KEY_VAULT --name $kv_key --value "$val"
      done
   ```
3. **Reference those secrets** in the container app and map them to environment variables.
   The workflow also sets `KEY_VAULT_NAME` so the app knows which vault to use:
   ```yaml
   - name: Add Key Vault secret references to Container App (one by one)
     # ...
   - name: Map all secret refs to env vars in Container App (in-memory)
     # env_args="$env_args KEY_VAULT_NAME=$KEY_VAULT"
     # ...
   ```

The server applies the same transformation when retrieving secrets, converting
environment variable names like `DATABASE_URL` to `database-url` before calling
Key Vault.

With this workflow, the container runs with env vars like `AZURE_TENANT_ID` and `DATABASE_URL` sourced directly from Key Vault.
