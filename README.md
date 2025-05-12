# Roadside Rescue - ResQ

Roadside Rescue (ResQ) is a Next.js application designed to connect users experiencing vehicle trouble with nearby service providers quickly and efficiently. It features real-time location tracking, service request management, and AI-powered issue suggestions.

## Core Features

*   **User Authentication:** Secure sign-up and login using Google or Phone Number (Firebase Authentication).
*   **Location Detection:** Uses geolocation to pinpoint the user's current location.
*   **Service Request:** Users can submit requests for roadside assistance, detailing their issue and vehicle information.
*   **AI-Powered Issue Summary:** Suggests common issue summaries based on user's description.
*   **Provider Matching:** Displays available service providers (garages) based on location and service type.
*   **Real-time Tracking:** Users can track the assigned provider's approach on a map.
*   **Request Management (User):**
    *   View active request status.
    *   Request cancellation with a reason.
    *   View history of completed and cancelled requests.
*   **Garage Admin Portal:**
    *   View and manage all incoming service requests.
    *   Filter requests by garage branch or status.
    *   Assign mechanics to requests.
    *   Manage staff members (add, edit, remove mechanics and customer relations personnel).
    *   Manage garage branches (add, edit, remove).
    *   Respond to user cancellation requests.
*   **Mechanic Role:**
    *   View assigned service requests.
    *   Update request status (In Progress, Completed, Cancelled).
    *   Log mechanic notes and resources used for a request.
    *   Navigate to user's location using Google Maps.
*   **Customer Relations Role:**
    *   View service requests.
    *   Update request status (limited scope).
*   **User Profiles:** Users can manage their personal details, default vehicle information, and contact phone number.

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, ShadCN UI
*   **Backend & Database:** Firebase (Authentication, Firestore)
*   **AI:** Google Generative AI (via Genkit) for issue summary suggestions.
*   **Mapping:** Placeholder images (real map integration like Google Maps API would be a next step).

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   A Firebase project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/HusseinMalingha/roadside-resq.git
    cd roadside-resq
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    *   Create a `.env` file in the root of your project by copying `.env.example` (if it exists) or creating a new one.
    *   Add your Firebase project configuration details to the `.env` file. These typically look like:
        ```env
        NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
        NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

        # For Genkit (Google AI)
        GOOGLE_API_KEY=your_google_ai_api_key
        ```
    *   You can find these Firebase credentials in your Firebase project settings.
    *   The `GOOGLE_API_KEY` is for Google Generative AI services used by Genkit.

4.  **Firebase Setup:**
    *   Ensure you have a Firebase project created.
    *   Enable **Firebase Authentication** and configure the **Google** and **Phone Number** sign-in methods. For Phone Number sign-in, you'll need to enable the **Identity Platform API** and set up reCAPTCHA.
    *   Enable **Firestore** as your database.
    *   **Firestore Indexes:** The application requires specific composite indexes for querying service requests. Errors in the browser console will often provide a direct link to create missing indexes in your Firebase console. Refer to `firebase_console_instructions.txt` for details on common indexes needed.

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application should now be running on `http://localhost:9002` (or the port specified in your `package.json`).

6.  **Run Genkit (for AI features):**
    In a separate terminal, run the Genkit development server:
    ```bash
    npm run genkit:dev
    # or
    npm run genkit:watch
    ```

## Available Scripts

*   `npm run dev`: Starts the Next.js development server with Turbopack.
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts the production server.
*   `npm run lint`: Lints the codebase using Next.js's built-in ESLint configuration.
*   `npm run typecheck`: Runs TypeScript type checking.
*   `npm run genkit:dev`: Starts the Genkit development server.
*   `npm run genkit:watch`: Starts the Genkit development server with watch mode.

## Project Structure Overview

*   `src/app/`: Contains the pages and layouts for the Next.js App Router.
*   `src/components/`: Reusable React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/auth/`: Authentication related components.
    *   `src/components/garage/`: Components specific to the Garage Admin portal.
    *   `src/components/profile/`: Components for the user profile page.
    *   `src/components/request-history/`: Components for displaying request history.
*   `src/contexts/`: React Context providers (e.g., `AuthContext`).
*   `src/hooks/`: Custom React hooks.
*   `src/lib/`: Utility functions, Firebase initialization (`firebase.ts`), and server actions (`actions.ts`).
*   `src/services/`: Modules for interacting with Firebase services (Firestore collections).
*   `src/ai/`: Genkit related code.
    *   `src/ai/flows/`: Genkit flows for AI functionalities.
*   `src/types/`: TypeScript type definitions.
*   `public/`: Static assets.

## Admin Credentials

The Garage Admin role is assigned if the logged-in user's email matches `husseinmalingha@gmail.com`. Other staff roles (Mechanic, Customer Relations) are managed via the `staffMembers` collection in Firestore and assigned by an Admin.

---

This README provides a good starting point for anyone looking to work with or understand the Roadside Rescue application.
