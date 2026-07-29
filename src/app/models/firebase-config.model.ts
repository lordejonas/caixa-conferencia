export type PerfilUsuario = 'membro' | 'tesoureiro';

export interface FirebaseUserConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  perfil: PerfilUsuario; // <-- 'membro' ou 'tesoureiro'
}
