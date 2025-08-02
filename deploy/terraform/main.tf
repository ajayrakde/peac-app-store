terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "app" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.app.name
  location            = azurerm_resource_group.app.location
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_log_analytics_workspace" "log" {
  name                = "${var.name_prefix}-log"
  location            = azurerm_resource_group.app.location
  resource_group_name = azurerm_resource_group.app.name
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "env" {
  name                = "${var.name_prefix}-env"
  location            = azurerm_resource_group.app.location
  resource_group_name = azurerm_resource_group.app.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.log.id
}

# Optional certificate for custom domain
resource "azurerm_container_app_environment_certificate" "cert" {
  count                        = var.custom_domain_name != "" ? 1 : 0
  name                         = "${var.name_prefix}-cert"
  container_app_environment_id = azurerm_container_app_environment.env.id
  certificate_blob             = filebase64(var.certificate_pfx_path)
  certificate_password         = var.certificate_pfx_password
}

resource "azurerm_container_app" "app" {
  name                         = var.container_app_name
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.app.name

  revision_mode = "Single"

  template {
    container {
      name   = "${var.name_prefix}-server"
      image  = "${azurerm_container_registry.acr.login_server}/${var.image_name}:latest"
      cpu    = 0.5
      memory = "1Gi"
      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 5000
  }
}

# Bind a custom domain to the Container App if provided
resource "azurerm_container_app_custom_domain" "domain" {
  count            = var.custom_domain_name != "" ? 1 : 0
  name             = var.custom_domain_name
  container_app_id = azurerm_container_app.app.id
  certificate_id   = azurerm_container_app_environment_certificate.cert[0].id
}

output "container_app_url" {
  value = azurerm_container_app.app.latest_revision_fqdn
}

output "custom_domain" {
  value       = var.custom_domain_name != "" ? azurerm_container_app_custom_domain.domain[0].name : ""
  description = "The custom domain bound to the container app"
}
