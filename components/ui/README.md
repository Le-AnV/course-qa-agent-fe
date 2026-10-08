# components/ui — shared UI primitives

Not tied to any Epic. Small reusable building blocks only (button, dialog, input, badge, spinner...).

**Rules**
- Keep it minimal — don't build a full design system; Tailwind is the styling layer.
- Feature-specific components stay in `frontend/features/<module>/`.
- Changes here affect everyone → call out in MR description.
