
// Ensures Firebase services are active on the specified Google Cloud Project.
resource "google_firebase_project" "default" {
  project = var.project_id
  // provider = google-beta // Uncomment if specific beta features are needed
}

// Configures Firebase Authentication (Identity Platform) for the project.
resource "google_identity_platform_config" "default" {
  project = var.project_id
  // provider = google-beta // Some Identity Platform features might require beta

  autodelete_anonymous_users = true // Example: automatically delete anonymous users

  sign_in {
    allow_duplicate_emails = true // Set based on your requirements

    email {
      enabled          = true // For Google Sign-In and potentially email/password
      password_required = false // Assuming password not primary for Google Sign-In
    }

    phone_number {
      enabled = true // Phone number sign-in is used by the application
      // test_phone_numbers = { // For development/testing if needed, remove for production
      //   "+11234567890" = "123456" 
      // }
    }

    anonymous {
      enabled = false // Application does not seem to use anonymous sign-in
    }
  }

  // You can add more configurations like blocking functions, quotas, etc.
  // blocking_functions {
  //   triggers {
  //     event_type = "beforeCreate"
  //     function_uri = "https://example.com/beforeCreate" // Replace with actual function URI
  //   }
  // }

  depends_on = [
    google_firebase_project.default // Ensure Firebase project resource exists first
  ]
}

// If you use Firebase Hosting, you can define the site here.
// resource "google_firebase_hosting_site" "default" {
//   project = var.project_id
//   site_id = var.project_id // Often the site_id is the project_id or project_id-default
// }

// Example of enabling App Check for security (optional, but recommended)
// resource "google_firebase_app_check_service_config" "default" {
//   project          = var.project_id
//   service_id       = "firebaseappcheck.googleapis.com" // Default service ID for App Check
//   enforcement_mode = "UNENFORCED"                     // Start with UNENFORCED, then move to ENFORCED after testing
//   provider_config {
//     recaptcha_v3_config {
//       site_secret = "YOUR_RECAPTCHA_V3_SITE_SECRET" // Replace with your actual secret
//     }
//   }
//   depends_on = [google_firebase_project.default]
// }
