# UI Design & Implementation Specs — Login Page (AI-25)

> **Ticket:** AI-25
> **Epic:** E2 - Authentication & Authorization
> **Status:** Implemented (DB-backed login via `POST /api/auth/login`)

This document serves as the Design Specs and a hand-over reference detailing the architecture and components built for the Login Page. The purpose is to provide context and guidance for future tasks (especially backend API integration).

## 1. UI Overview

The login page UI is implemented as a pop-up modal component integrated into the landing page, allowing users to authenticate based on predefined roles.
- It overlays the landing page with a semi-transparent dark background.
- The form utilizes enhanced typography & spacing, using a modern background gradient (Coursera-inspired design).
- It contains a noticeable text prompt stating "Account creation is restricted to administrators only."

## 2. Component Architecture

The main UI components are located in the `features/login/` directory.

### 2.1. `login-modal.tsx` (Modal Component)
- **Props Management:** Strongly typed with `LoginModalProps` (`isLoginModalOpen`, `closeLoginModal`).
- **Form Fields:** 
  - **Username/Email**: Required text input field.
  - **Password**: Required input field with a toggle (`Eye`/`EyeOff` icon from `lucide-react`) to show/hide password text.
- **User Feedback & Status Banners:** 
  - **Loading State**: Displays a `Loader2` spinning icon and disables the submit button state while processing login.
  - **Error Banner**: Shows invalid credentials or missing input messages with an `AlertCircle` icon in a styled red banner.
  - **Success Banner**: Displays a redirecting notice with a loading spinner in a styled blue banner upon successful login.

## 3. Data & Authentication Flow

The login modal authenticates against the backend only — the client-side mock logic
(`NEXT_PUBLIC_USE_MOCK_LOGIN`, hardcoded demo passwords, `demo-token`) was removed in
`hotfix/Bug_MockLoginFallback` (AI-25). A failed login now surfaces "Invalid email or
password." instead of silently falling through to a fake session that later bounces to
`/login` on the first authenticated API call.

### Mechanism:
1. **Trigger:** User fills in the form and clicks "Login" -> Triggers `handleLoginSubmit()`.
2. **Validation:** Checks if identifier and password are not empty.
3. **API Call:** `POST /api/auth/login` with `{ email, password }` while `isLoading` is true.
4. **Success:** Stores the backend `access_token` + `role` in `localStorage` (`AUTH_TOKEN_KEY` /
   `AUTH_ROLE_KEY`), mirrors them into cookies for the middleware, then redirects via
   `homeRouteFor` from `components/ui/nav-config.ts`.
5. **Failure:** Non-200 or network error shows the Error Banner; no session is written.

## 4. API Design Contract (Backend Handoff)

To align with the backend development phase, below is the expected API contract that the Frontend should be configured to consume once the mock logic is replaced.

### 4.1. Login Authentication
- **Endpoint:** `POST /api/auth/login` (Tentative)
- **Headers:** 
  - `Content-Type: application/json`
- **Request Body (JSON):**
  ```json
  {
    "identifier": "student@academic.edu.vn",
    "password": "Student@123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "role": "student"
  }
  ```
- **Error Response (401 Unauthorized):**
  ```json
  {
    "message": "Invalid email or password."
  }
  ```
