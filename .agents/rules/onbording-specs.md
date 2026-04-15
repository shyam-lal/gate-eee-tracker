---
trigger: always_on
---

You are building a production-grade backend-first system.

Rules:
- All user progress, onboarding state, and plans MUST be stored and controlled by backend.
- Client should be stateless where possible.
- APIs must be idempotent.
- Use clean architecture (controllers → services → repositories).
- Use PostgreSQL with proper schema design.
- No business logic in frontend.
- All planning logic must be server-side.