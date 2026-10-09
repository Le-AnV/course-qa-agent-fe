# UI Design & Implementation Specs — Login Page (AI-25)

> **Ticket:** AI-25
> **Epic:** E2 - Authentication & Authorization
> **Status:** Implemented (UI & Client Mock Logic)

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

Currently, the authentication logic is mock-implemented directly on the client-side for demonstration and UI testing purposes.

### Mechanism:
1. **Trigger:** User fills in the form and clicks "Login" -> Triggers `handleLoginSubmit()`.
2. **Validation:** Checks if identifier and password are not empty.
3. **API Simulation:** The system sets `isLoading` to true and pauses for 1 second (`setTimeout`) to simulate a network request.
4. **Role Mapping (Mock Logic):**
   - **Student Role**: Username `student@academic.edu.vn` (or `student`) and Password `Student@123`.
   - **Admin Role**: Username `admin@academic.edu.vn` (or `admin`) and Password `Admin@123`.
   - **Trainer Role**: Username `teacher` and Password `Admin@123`.
5. **State Storage & Redirection:**
   - **Success**: The system saves a mock `demo-token` to `localStorage` under `AUTH_TOKEN_KEY` and the user's role under `AUTH_ROLE_KEY`. It then utilizes `homeRouteFor` from `components/ui/nav-config.ts` to redirect the user to their role-specific dashboard.
   - **Failure**: Sets an error message which triggers the Error Banner.

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
