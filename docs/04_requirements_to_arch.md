# Todogy — From Requirement to Architecture

> **Assigning responsibilities: who carries each guarantee?**

---

## 1. The Thread: Requirement → Guarantee → Responsibility → Component

```mermaid
graph LR
    REQ["R: Guest can write todos"] -->|Implies| GUAR["G: localStorage persistence"]
    GUAR -->|Assigned to| RESP["R: Frontend Storage"]
    RESP -->|Implemented by| COMP["Pinia Todos Store"]

    REQ2["R: Auth with JWT"] -->|Implies| GUAR2["G: Token verification on each request"]
    GUAR2 -->|Assigned to| RESP2["R: Auth Middleware"]
    RESP2 -->|Implemented by| COMP2["Hono JWT Middleware"]
```

---

## 2. Responsibility Map

| Requirement | Guarantee | Responsibility | Component | Module |
|---|---|---|---|---|
| Guest creates todo | Task captured in localStorage | Manage local CRUD + persistence | `useTodosStore` (`localStorage`) | Frontend Store |
| Guest marks done | Task toggled in localStorage | Update local state + save | `useTodosStore` | Frontend Store |
| User registers | Account created, tokens issued | Validate input, hash password, store user | `auth.service.ts` | `modules/auth` |
| User logs in | Credentials verified | Compare bcrypt hash, generate JWTs | `auth.service.ts` | `modules/auth` |
| User logs in via Google | OAuth handshake + profile creation | Validate OAuth code, create/find user | `auth.service.ts` (googleLogin) | `modules/auth` |
| User logs in via GitHub | OAuth handshake + profile creation | Validate OAuth code, fetch GitHub profile | `auth.service.ts` (githubLogin) | `modules/auth` |
| AccessToken expires | Silent refresh via cookie | Intercept 401, call `/auth/refresh`, retry queue | Axios interceptor | Frontend API |
| RefreshToken rotates | Old token invalidated | Issue new pair, update DB | `auth.service.ts` (refreshAccessToken) | `modules/auth` |
| User lists todos | Return only owned tasks | Query `Todo.find({ userId })` | `todos.service.ts` | `modules/todos` |
| User creates todo | Task linked to userId | Create doc with `{ title, userId }` | `todos.service.ts` | `modules/todos` |
| User deletes todo | Only owner can delete | `findOneAndDelete({ _id, userId })` | `todos.service.ts` | `modules/todos` |
| Guest tasks merge on login | Local tasks pushed to backend | Read localStorage, POST each, then fetch | `useTodosStore` | Frontend Store |

---

## 3. Component Dependency Graph

```mermaid
graph TD
    subgraph Frontend [Vue 3 App]
        Router[Vue Router]
        AuthStore[Auth Store]
        TodosStore[Todos Store]
        AxiosAPI[Axios API Layer]
        Views[Views: TodosView, SignInView, SignUpView]
        NavBar[NavBar Component]
    end

    subgraph Backend [Hono Server]
        AuthRoutes["/auth/*"]
        TodosRoutes["/todos/*"]
        AuthMiddleware[JWT Middleware]
        AuthService[auth.service.ts]
        TodosService[todos.service.ts]
        UserModel[(User Model)]
        TodoModel[(Todo Model)]
    end

    subgraph External
        MongoDB[(MongoDB Atlas)]
        GoogleOAuth[Google OAuth]
        GitHubOAuth[GitHub OAuth]
    end

    Views --> AuthStore
    Views --> TodosStore
    AuthStore --> AxiosAPI
    TodosStore --> AxiosAPI
    AxiosAPI -->|HTTP| AuthRoutes
    AxiosAPI -->|HTTP| TodosRoutes
    AuthRoutes --> AuthService
    AuthRoutes --> AuthMiddleware
    TodosRoutes --> AuthMiddleware
    TodosRoutes --> TodosService
    AuthService --> UserModel
    TodosService --> TodoModel
    AuthService --> GoogleOAuth
    AuthService --> GitHubOAuth
    UserModel --> MongoDB
    TodoModel --> MongoDB
```

---

## 4. Cohesion Analysis

| Module | Responsibilities | Cohesion |
|---|---|---|
| `modules/auth` | Register, login, OAuth, refresh, logout, JWT middleware | High — all token lifecycle |
| `modules/todos` | CRUD, ownership filtering | High — all task operations |
| `modules/users` | User schema, DB model | High — single concern |
| `shared/database` | MongoDB connection | High — single concern |
| Frontend Store | State + localStorage persistence | Medium — state + persistence mixed |
| Frontend API | HTTP layer + interceptor | High — all external communication |
