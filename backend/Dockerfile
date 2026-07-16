# --- Étape 1 : Build & Installation globale ---
FROM node:22-alpine AS builder
WORKDIR /app

# Copie des fichiers de configuration des dépendances
COPY package*.json ./

# Utilisation du cache de BuildKit pour accélérer les installations successives
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copie du reste du code source et compilation
COPY . .
RUN npm run build

# Nettoyage des devDependencies pour ne garder que la production en mémoire
RUN npm prune --production

# --- Étape 2 : Runtime de Production Sécurisé ---
FROM node:22-alpine AS production
WORKDIR /app

# Variable pour s'assurer que Node s'exécute en mode production optimisé
ENV NODE_ENV=production

# Copie uniquement des fichiers nécessaires, en attribuant la propriété à l'utilisateur non-root
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

# Bascule sur l'utilisateur sécurisé non-root fourni par l'image de base
USER node

EXPOSE 3000

# Utilisation de la forme "Exec" recommandée pour intercepter correctement les signaux d'arrêt (SIGTERM)
CMD ["node", "dist/index.js"]
