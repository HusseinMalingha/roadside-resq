
variable "project_id" {
  description = "The ID of the Google Cloud project where Firebase will be managed."
  type        = string
  // Example value (from your build logs): "roadside-rescue-oa6bm"
  // This should be set in a terraform.tfvars file or as an environment variable.
}

variable "region" {
  description = "The default region for Google Cloud resources."
  type        = string
  default     = "us-central1"
}

variable "firebase_project_display_name" {
  description = "The display name for the Firebase project."
  type        = string
  default     = "ResQ Firebase Project"
}
