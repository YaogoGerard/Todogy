/// <reference types="vite/client" />

declare const __BASE_URL__: string

interface ImportMetaEnv {
  readonly VITE_GITHUB_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}