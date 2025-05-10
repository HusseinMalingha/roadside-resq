
output "firebase_project_id" {
  description = "The ID of the Firebase project."
  value       = google_firebase_project.default.project
}

output "identity_platform_config_name" {
  description = "The resource name of the Identity Platform configuration."
  value       = google_identity_platform_config.default.name
}

// output "firebase_hosting_site_name" {
//   description = "The name of the Firebase Hosting site, if created."
//   value       = google_firebase_hosting_site.default.name
//   // Add a condition if the hosting site resource is optional
//   // sensitive   = false 
// }
