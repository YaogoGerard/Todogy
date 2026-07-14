

// models pour l'inscription avec email + password
export interface RegisterInput{
  name: string
  email: string
  password:string
}

//models pour la connexion avec email + password
export interface LoginInput{
  email: string
  password:string
}

// le profile que nous retourne Oauth google et github
export interface OAuthProfile{
  provider: 'google' | 'github'
  providerID: string
  email: string
  name: string
  avatar: string
}
export interface GoogleClaims {
  sub: string
  email: string
  name: string
  picture: string
}
export interface GitHubProfile {
  id: number
  email: string
  name: string
  login: string
  avatar_url: string
}


// le token du Json web token
export interface TokenPayload{
  userId: string
  email: string
}

// le token envoyer au front après la connexion
export interface AuthResponse{
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    avatar?:string
  }
}

