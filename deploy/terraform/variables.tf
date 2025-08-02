variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
}

variable "container_app_name" {
  description = "Name of the Container App"
  type        = string
}

variable "image_name" {
  description = "Container image name"
  type        = string
  default     = "lokaltalent"
}

variable "name_prefix" {
  description = "Prefix used for resource naming"
  type        = string
  default     = "lokaltalent"
}

variable "custom_domain_name" {
  description = "Optional custom domain for the Container App"
  type        = string
  default     = ""
}

variable "certificate_pfx_path" {
  description = "Path to a PFX certificate for the custom domain"
  type        = string
  default     = ""
}

variable "certificate_pfx_password" {
  description = "Password for the PFX certificate"
  type        = string
  default     = ""
  sensitive   = true
}
