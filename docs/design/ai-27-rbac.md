# UI Design & Implementation Specs — RBAC & API Integration (AI-27)

> **Ticket:** AI-27
> **Epic:** E2 - Authentication & Authorization
> **Status:** Planned

This document serves as the implementation plan for Role-Based Access Control (RBAC) and real API integration on the Frontend.

## 1. Overview
The Frontend currently uses a simulated `setTimeout` login. We will integrate it with the actual Backend API (`POST /auth/login`) which issues JWT tokens. Using these tokens, the Frontend will enforce route guarding to ensure users can only access pages assigned to their respective roles (Student, Admin, Trainer).

## 2. API Integration in `login-modal.tsx`
- **Replace Mock Logic:** Remove the `setTimeout` mock login logic.
- **API Call:** Implement an HTTP request using `fetch` or `axios` pointing to `POST http://localhost:8000/auth/login`.
- **Handle Response:**
  - On `200 OK`: 
    1. Extract the `token` and `role` from the response.
    2. Save the `token` securely (e.g., in `localStorage` or `cookies`).
    3. Update the global UI state/context with the user's `role`.
  - On `401 Unauthorized`: Display an error message ("Invalid email or password").

## 3. Route Guarding (Middleware / HOC)
- **Next.js Protection:** Ensure the Next.js App Router utilizes the saved role to restrict access to various portals.
- **Redirection Logic:** 
  - If an unauthenticated user tries to access any portal, redirect them to the home/login page.
  - If a user manually navigates to a route they don't have access to (e.g., a `student` trying to access `/admin`), redirect them to a generic `Not Authorized` page or bounce them back to their respective portal (`/student`).

## 4. Next Steps
1. Create a utility or API client folder in the FE to handle `fetch`/`axios` calls.
2. Update the `login-modal.tsx` component to execute the real API request.
3. Implement a Next.js Middleware or React Context to check the token and role upon navigation.
4. Test the full flow: Login -> Receive JWT -> Store JWT -> Access Protected Route.
