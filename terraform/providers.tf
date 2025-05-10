
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  // Credentials can be provided via environment variable GOOGLE_APPLICATION_CREDENTIALS,
  // or by other means (e.g., gcloud auth application-default login).
  // The project and region can often be inferred from the credentials or environment.
  // project = var.project_id
  // region  = var.region
}

provider "google-beta" {
  // Credentials can be provided via environment variable GOOGLE_APPLICATION_CREDENTIALS,
  // or by other means (e.g., gcloud auth application-default login).
  // The project and region can often be inferred from the credentials or environment.
  // project = var.project_id
  // region  = var.region
}
