// src/app/models/user.model.ts
export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  nomComplet: string;
  role: 'U1' | 'V1' | 'V2' | 'T1' | 'ADMIN';
  actif: boolean;
  nbFacturesCreees: number;
  nbFacturesValideesN1: number;
  nbFacturesValideesN2: number;
  nbFacturesTraitees: number;
}
