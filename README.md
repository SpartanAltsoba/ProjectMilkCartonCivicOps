# Secure Modular Intelligence Web App for Anti-Fosterware Operations

Welcome to the Secure Modular Intelligence Web App, a robust and production-ready platform designed to orchestrate multiple AI agents for anti-Fosterware operations using a cloud-based architecture. This document provides an overview of the application, its features, structure, and installation instructions.

## Overview

This application is a secure, modular intelligence web application built with the following technologies:

- **TypeScript**
- **Next.js**
- **Firebase (Auth, Firestore, Storage)**
- **MongoDB for data persistence**
- **CSS for styling**

## Features

- Modular agent orchestration via Firebase Cloud Functions
- Secure user authentication using Firebase Auth
- Real-time job status updates with Firestore
- Secure file uploads and storage using Firebase Storage
- Dynamic agent output visualization with tactical overlays
- Access control via Firestore and Storage rules
- Responsive and accessible UI with a sleek glass morphism design
- Automatic deployment process using GitHub Actions

## Project Structure

The project is meticulously organized to ensure maintainability and scalability:

```
.
├── README.md
├── .gitignore
├── package.json
├── next.config.js
├── tsconfig.json
├── public
├── pages
│   ├── index.tsx
│   ├── dashboard.tsx
│   ├── login.tsx
│   ├── case
│   │   └── [caseId].tsx
│   └── settings.tsx
├── components
│   ├── DashboardComponent.tsx
│   ├── AuthFormComponent.tsx
│   ├── JobStatusComponent.tsx
│   ├── FileUploadComponent.tsx
│   ├── AgentOutputCardComponent.tsx
│   ├── OverlayMapComponent.tsx
│   ├── UserSettingsComponent.tsx
│   └── RedirectComponent.tsx
├── styles
│   └── globals.css
├── lib
│   ├── firebase.ts
│   ├── auth.ts
│   ├── db.ts
│   └── storage.ts
├── hooks
│   ├── useAuth.ts
│   ├── useFirestore.ts
│   └── useStorage.ts
├── api
│   └── auth
│       └── index.ts
└── .github
    └── workflows
        └── deploy.yml
```

## Pages

The application includes several essential pages:

- **Main Entry (`/`)**: Redirects users to the dashboard or login page based on authentication status.
- **Dashboard (`/dashboard`)**: Displays user jobs, allows creation of new cases/jobs, and views recent activities.
- **Login (`/login`)**: Manages the process of user authentication and registration.
- **Case Details (`/case/[caseId]`)**: Shows real-time updates for specific cases/jobs.
- **User Settings (`/settings`)**: Manages user profiles and privacy settings.

## Components

Reusable components provide modularity and clean architecture:

- **DashboardComponent**: Layout for displaying user jobs and cases.
- **AuthFormComponent**: Form for handling login and registration with Firebase Auth.
- **JobStatusComponent**: Displays real-time updates on job progress using Firestore.
- **FileUploadComponent**: Secures file uploads to Firebase Storage, with metadata saved to Firestore.
- **AgentOutputCardComponent**: Displays results from AI agents.
- **OverlayMapComponent**: Visualizes tactical situations using overlays.
- **UserSettingsComponent**: Manage user profile and privacy settings.
- **RedirectComponent**: Handles user redirection based on authentication.

## Installation and Setup

Follow these steps to set up the project locally:

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up Firebase**:

   - Create a Firebase project.
   - Enable Firebase Auth, Firestore, and Storage.
   - Configure your `.env.local` file with Firebase keys.

4. **Run the development server**:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

## Deployment

Deployment is handled through GitHub Actions. Simply push to the main branch, and the CI/CD pipeline will automatically deploy the latest changes.

## Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements

- Thanks to Firebase for providing reliable cloud services.
- Gratitude to the open-source community for tools and libraries that make development seamless.

---

We hope you find this application invaluable for your operations. Feel free to reach out with feedback, questions, or to report issues. Happy building!