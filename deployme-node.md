# Deploying LokalTalent with Node

This guide covers running the project locally and deploying it to Azure. The instructions assume the repository has been cloned and dependencies installed.

## Local Development

1. Install dependencies
   ```bash
   npm install
   ```
2. Run database migrations
   ```bash
   npm run db:push
   ```
3. Start the development server
   ```bash
   npm run dev
   ```
   The server listens on port `5000` and Vite serves the React client with hot reloading.

## Production Build

Create a production bundle with:

```bash
npm run build
```

This command compiles the React client with Vite and bundles the server using esbuild. The output goes to the `dist` directory. You can then start the server locally with:

```bash
npm start
```

## Deploying to Azure App Service

1. Create an App Service using the Node.js runtime.
2. Build the project locally and upload the `dist` folder along with `package.json` and `package-lock.json`.
3. Set environment variables in the App Service configuration (for database credentials and Firebase keys).
4. Configure the start command to run `npm start`.
5. Deploy using ZIP deployment or Azure DevOps/GitHub Actions as described below.

### Azure Pipelines

Create a pipeline definition (`azure-pipelines.yml`) similar to:

```yaml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
- script: npm install
- script: npm run build
- task: ArchiveFiles@2
  inputs:
    rootFolderOrFile: 'dist'
    includeRootFolder: false
    archiveFile: '$(Build.ArtifactStagingDirectory)/app.zip'
    replaceExistingArchive: true
- upload: $(Build.ArtifactStagingDirectory)/app.zip
  artifact: drop
- task: AzureWebApp@1
  inputs:
    appType: 'webApp'
    appName: '<YOUR_APP_NAME>'
    package: '$(Build.ArtifactStagingDirectory)/app.zip'
```

This pipeline installs dependencies, builds the project, bundles the artifacts, and deploys them to Azure App Service.

### GitHub Actions

Add a workflow under `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: azure/webapps-deploy@v3
        with:
          app-name: '<YOUR_APP_NAME>'
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
          package: ./dist
```

Upload the publish profile from the Azure portal as a repository secret named `AZURE_PUBLISH_PROFILE`.

## Container Deployment

Alternatively, package the app as a Docker container and deploy it to Azure Container Apps or Azure Web App for Containers. The server listens on port `5000`, so expose that port in your Dockerfile.

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

Build and push the image, then create a container app pointing to the image.

## Environment Variables

Set environment variables such as database URLs and Firebase credentials in the hosting service. Locally you can provide them via `.env` files or your shell environment.


## Preferred Azure Deployment

Azure Container Apps or Azure Web App for Containers are the recommended hosting options. Both run the Docker image built from the project. Use the pipeline or GitHub Actions files inside the `deploy` folder to build, push, and deploy the container automatically.

## Custom Domain and SSL

After the app is running in Azure:

1. In the Azure portal open your Container App or Web App.
2. Navigate to **Custom domains** and add your domain name. Follow the validation steps (CNAME or TXT record).
3. Once the domain is verified, enable HTTPS by creating or importing an SSL certificate under **TLS/SSL settings**.
4. Bind the certificate to your custom hostname.

Azure automatically provisions free certificates for Container Apps if using Azure-managed domains. For other domains you can upload a certificate from your provider.

You can automate domain binding through Terraform by setting `custom_domain_name`, `certificate_pfx_path`, and `certificate_pfx_password` variables. The pipeline YAMLs include comments on how to run CLI commands if you prefer scripting the setup.


## Infrastructure with Terraform

A Terraform project in `deploy/terraform` can provision the Azure resources required for the app. Run `terraform init` followed by `terraform apply` to create a resource group, container registry, log analytics workspace, container apps environment and the container app itself. Configure the variables (`resource_group_name`, `acr_name`, and `container_app_name`) before applying.
