// Fichier: src/app/demo/factures/models/facture.model.ts

export enum FormeJuridiqueType {
  SARL = 'SARL',
  SAS = 'SAS',
  SA = 'SA',
  EURL = 'EURL',
  SNC = 'SNC',
  ENTREPRISE_INDIVIDUELLE = 'ENTREPRISE_INDIVIDUELLE',
  MICRO_ENTREPRISE = 'MICRO_ENTREPRISE',
  ASSOCIATION = 'ASSOCIATION',
  AUTRE = 'AUTRE'
}

export enum ModaliteType {
  DELAI_30 = 'DELAI_30',
  DELAI_60 = 'DELAI_60',
  DELAI_90 = 'DELAI_90',
  DELAI_120 = 'DELAI_120'
}

export enum StatutFacture {
  SAISIE = 'SAISIE',
  EN_VALIDATION_V1 = 'EN_VALIDATION_V1',
  EN_VALIDATION_V2 = 'EN_VALIDATION_V2',
  EN_TRESORERIE = 'EN_TRESORERIE',
  VALIDEE = 'VALIDEE',
  REJETEE = 'REJETEE',
  PAYEE = 'PAYEE'
}

// ✅ CORRIGÉ: Interface User mise à jour
export interface User {
  id: number;
  nom?: string;           // Optionnel car parfois on a directement nomComplet
  prenom?: string;        // Optionnel
  email: string;
  nomComplet: string;     // Obligatoire - c'est ce qu'on utilise dans les templates
  role?: string;          // Optionnel
  actif?: boolean;        // Optionnel
}

export interface FactureCreateDto {
  // Informations fournisseur
  nomFournisseur: string;
  formeJuridique?: FormeJuridiqueType;

  // Dates
  dateFacture: string; // Format ISO date
  dateReception?: string;
  dateLivraison?: string;
  etrangerLocal?: string;
  pieceJointe?: File;

  // Montants
  montantHT: number;
  tauxTVA?: number;
  rasTVA?: number;

  // Modalité et références
  modalite?: ModaliteType;
  refacturable: boolean;
  designation?: string;
  refCommande?: string;
  periode?: string;
  numero?: string;

  // Validateurs
  validateur1Id: number;
  validateur2Id: number;
  tresorierIdId?: number;

  // Commentaires
  commentaires?: string;
}

export interface Facture extends FactureCreateDto {
  id: number;
  statut: StatutFacture;
  dateCreation: string;
  dateModification?: string;
  montantTVA?: number;
  montantTTC?: number;
  dateEcheance?: string;

  // Relations
  createur?: User;
  validateur1?: User;
  validateur2?: User;
  tresorier?: User;
}

export interface FactureResponse {
  success: boolean;
  message: string;
  factureId?: number;
  numero?: string;
}
