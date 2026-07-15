# Todogy — PRD (Product Requirements Document)

> **Why must this system exist?**

---

## 1. Problem

A person has fleeting task ideas throughout the day (reminders, errands, quick notes). Without a frictionless capture tool, these tasks are forgotten within minutes.

**Observable dysfunction**: Users rely on mental memory, sticky notes, or generic note apps that lack task-specific affordances (completion tracking, filtering, progress visibility).

**Key insight**: The barrier to capture must be **zero** — no login required to write a task, only to persist across devices.

---

## 2. Target Users

| Actor | Description |
|---|---|
| **Guest** | Any person who wants to write tasks immediately without creating an account |
| **Registered User** | A person who wants their tasks persisted on the backend and accessible from any device |

---

## 3. Main Use Cases

- Capture a task in under 3 seconds
- Mark a task as done
- Remove a task
- Filter tasks by status (all / active / done)
- See completion progress at a glance
- Create an account (email/password)
- Log in via email/password or OAuth (Google, GitHub)
- Retrieve tasks from a previous session after login

---

## 4. Out of Scope

- Task sharing or collaboration
- Due dates, reminders, or notifications
- Task categories, tags, or priority levels
- Team workspaces or multi-user projects
- Mobile native apps (PWA scope only)

---

## 5. Success Criteria

- A guest can write, complete, and delete tasks with zero friction
- A user can log in and see their tasks persisted across sessions
- The progress bar gives immediate visual feedback
- OAuth login completes in under 5 seconds
- The app works on mobile and desktop without visual breakage
