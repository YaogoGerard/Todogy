# Todogy — System Modeling (UML & C4)

> **Structure and behavior of the system.**

---

## 1. C4 — Context Diagram

```mermaid
graph TD
    User((User Browser)) -->|HTTP| Todogy[ Todogy System ]
    Todogy -->|Mongoose| MongoDB[( MongoDB Atlas )]
    Todogy -->|OAuth2| Google(( Google OAuth ))
    Todogy -->|OAuth2| GitHub(( GitHub OAuth ))
```

| Element | Description |
|---|---|
| **User Browser** | Vue 3 SPA served via Vite dev server or static hosting |
| **Todogy System** | Hono API server + frontend (the system under design) |
| **MongoDB Atlas** | Cloud-hosted MongoDB, stores users and todos |
| **Google / GitHub OAuth** | External identity providers |

---

## 2. C4 — Container Diagram

```mermaid
graph TD
    subgraph "Browser"
        SPA[Vue 3 SPA<br/>Vite + Pinia + Vue Router]
    end

    subgraph "Node.js Server"
        API[Hono API<br/>@hono/node-server]
    end

    subgraph "Cloud"
        DB[(MongoDB Atlas)]
    end

    SPA -->|HTTP JSON| API
    API -->|Mongoose| DB
    API -->|OAuth2| Google
    API -->|OAuth2| GitHub
```

| Container | Technology | Responsibility |
|---|---|---|
| **Vue 3 SPA** | Vue 3, TypeScript, Pinia, Vue Router, Tailwind CSS v4 | UI rendering, client state, localStorage persistence, Axios HTTP |
| **Hono API** | Hono, TypeScript, Mongoose, Arctic | Auth (JWT + OAuth), todos CRUD, request validation |
| **MongoDB Atlas** | MongoDB 7+ | Persistent storage for users and todos |

---

## 3. C4 — Component Diagram (Backend)

```mermaid
graph TD
    subgraph "Hono API"
        AuthRoutes["auth.routes.ts<br/>/auth/*"]
        TodosRoutes["todos.routes.ts<br/>/todos/*"]
        AuthMiddleware["auth.middleware.ts<br/>JWT verification"]
        AuthService["auth.service.ts<br/>register, login, OAuth, refresh, logout"]
        TodosService["todos.service.ts<br/>CRUD + ownership filter"]
    end

    subgraph "Data Models"
        UserModel["User Model<br/>Mongoose Schema"]
        TodoModel["Todo Model<br/>Mongoose Schema"]
    end

    AuthRoutes --> AuthService
    AuthRoutes --> AuthMiddleware
    TodosRoutes --> AuthMiddleware
    TodosRoutes --> TodosService
    AuthService --> UserModel
    TodosService --> TodoModel
```

---

## 4. C4 — Component Diagram (Frontend)

```mermaid
graph TD
    subgraph "Vue 3 SPA"
        Router["Vue Router<br/>/ , /signin , /signup"]
        AuthStore["Auth Store<br/>Pinia"]
        TodosStore["Todos Store<br/>Pinia"]
        AxiosAPI["Axios Instance<br/>401 interceptor"]
        TodosView["TodosView.vue"]
        SignInView["SignInView.vue"]
        SignUpView["SignUpView.vue"]
        NavBar["NavBar.vue"]
    end

    Router --> TodosView
    Router --> SignInView
    Router --> SignUpView
    TodosView --> TodosStore
    TodosView --> NavBar
    SignInView --> AuthStore
    SignUpView --> AuthStore
    AuthStore --> AxiosAPI
    TodosStore --> AxiosAPI
```

---

## 5. UML — Sequence Diagram: Login Flow

```mermaid
sequenceDiagram
    actor User
    participant SignInView
    participant AuthStore
    participant Axios
    participant API
    participant DB

    User->>SignInView: Submit email + password
    SignInView->>AuthStore: login(email, password)
    AuthStore->>Axios: POST /auth/login
    Axios->>API: POST /auth/login
    API->>DB: Find user by email
    DB-->>API: User doc
    API->>API: bcrypt.compare(password, hash)
    API->>API: sign(accessToken, 15min)
    API->>API: sign(refreshToken, 7d)
    API->>DB: Store refreshToken
    API-->>Axios: 200 { accessToken, user } + Set-Cookie: refreshToken
    Axios-->>AuthStore: response
    AuthStore->>AuthStore: setAuth(data) → localStorage.setItem('accessToken')
    AuthStore->>TodosStore: syncLocalToBackend()
    TodosStore->>Axios: POST /todos (for each local task)
    TodosStore->>Axios: GET /todos
    Axios-->>TodosStore: merged todos list
    AuthStore-->>SignInView: resolved
    SignInView->>Router: push('/')
```

---

## 6. UML — Sequence Diagram: AccessToken Refresh

```mermaid
sequenceDiagram
    actor User
    participant TodosView
    participant TodosStore
    participant Axios
    participant API
    participant DB

    User->>TodosView: Page loads
    TodosView->>TodosStore: fetchTodos()
    TodosStore->>Axios: GET /todos (Authorization: Bearer expiredToken)
    Axios->>API: GET /todos
    API-->>Axios: 401 Unauthorized
    Axios->>Axios: Interceptor catches 401
    Axios->>API: POST /auth/refresh (with httpOnly cookie)
    API->>DB: Find user by refreshToken
    DB-->>API: User doc
    API->>API: sign(newAccessToken, 15min)
    API->>API: sign(newRefreshToken, 7d)
    API->>DB: Update refreshToken (rotation)
    API-->>Axios: 200 { accessToken } + Set-Cookie: newRefreshToken
    Axios->>Axios: localStorage.setItem('accessToken', newToken)
    Axios->>API: RETRY GET /todos (Authorization: Bearer newToken)
    API-->>Axios: 200 [todos]
    Axios-->>TodosStore: data
    TodosStore->>TodosView: render todos
```

---

## 7. UML — Sequence Diagram: OAuth Google Flow

```mermaid
sequenceDiagram
    actor User
    participant SignInView
    participant Browser
    participant Google
    participant API
    participant DB

    User->>SignInView: Click "Continuer avec Google"
    SignInView->>Browser: window.location = /auth/google
    Browser->>API: GET /auth/google
    API->>API: generateState(), generateCodeVerifier()
    API-->>Browser: 302 Redirect + Set-Cookie: oauth_state, code_verifier
    Browser->>Google: Redirect to Google OAuth consent
    User->>Google: Approve
    Google-->>Browser: 302 Redirect /auth/google/callback?code=xxx
    Browser->>API: GET /auth/google/callback?code=xxx
    API->>API: Read code_verifier cookie
    API->>Google: validateAuthorizationCode(code, codeVerifier)
    Google-->>API: Tokens + idToken
    API->>API: decodeIdToken → { email, name, picture, sub }
    API->>DB: findOrCreate user
    DB-->>API: User doc
    API->>API: sign(accessToken), sign(refreshToken)
    API->>DB: Store refreshToken
    API-->>Browser: 302 Redirect + Set-Cookie: refreshToken
    Browser->>Browser: Redirect to FRONTEND_URL?oauth=success
    Browser->>App: App mounts, authStore.init()
    App->>API: POST /auth/refresh (with cookie)
    API-->>App: 200 { accessToken, user }
    App->>App: localStorage.setItem('accessToken')
```
