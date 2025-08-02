# Deploying JobConnect on Azure Functions

This guide covers building the project, deploying the compiled server with `azure-function-express`, and configuring a custom domain with free SSL.

## 1. Build the project

Install dependencies and compile both the client and server:

```bash
npm install
npm run build
```

Running `npm run build` creates `dist/index.js` and a `dist/public` folder containing the bundled client.

## 2. Prepare an Azure Function

Create a JavaScript file that exposes the Express app via `azure-function-express`:

```javascript
// api/index.js
const { createHandler } = require('azure-function-express');
const app = require('../dist/index.js');

module.exports = createHandler(app);
```

Place this inside your Function App project (for example in an `api` folder).

## 3. Deploy using Azure Functions Core Tools

Install the tools locally if needed:

```bash
npm install -g azure-functions-core-tools@4
```

Publish the function:

```bash
func azure functionapp publish <YOUR_APP_NAME>
```

This uploads `dist/index.js` and serves the bundled client with the Express routes.

## 4. Configure production environment variables

Set these variables in the Function App **Configuration** settings (or `local.settings.json` for local testing):

- `DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY` (escape newlines with `\\n`) or `FIREBASE_PRIVATE_KEY_B64`
- `FIREBASE_CLIENT_EMAIL`

## 5. Map a custom domain and enable free SSL

1. In the Azure portal, open your Function App and go to **Custom domains**.
2. Follow the validation steps and update your GoDaddy DNS (TXT or CNAME record) to prove ownership of `LokalTalent.in`.
3. After validation, point the domain to the Function App using an `A` record or CNAME.
4. Navigate to **TLS/SSL settings** → **Private Key Certificates (.pfx)** and create an **App Service Managed Certificate** for your custom domain.
5. Bind the certificate under **TLS/SSL bindings** to enable HTTPS. Azure will renew this certificate automatically.

After DNS propagation completes, your application will be accessible over HTTPS at your custom domain.
