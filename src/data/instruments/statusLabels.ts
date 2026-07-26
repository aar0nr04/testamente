export type CatalogCategoryId = 'wellbeing' | 'anxiety_stress' | 'depression' | 'personality' | 'cognition_attention' | 'resilience_coping' | 'mental_health_general';

export const catalogCategories: Array<{ id: CatalogCategoryId; label: string }> = [
  { id: 'wellbeing', label: 'Autoestima y bienestar' },
  { id: 'anxiety_stress', label: 'Ansiedad y estrés' },
  { id: 'depression', label: 'Depresión' },
  { id: 'personality', label: 'Personalidad' },
  { id: 'cognition_attention', label: 'Cognición y atención' },
  { id: 'resilience_coping', label: 'Resiliencia y afrontamiento' },
  { id: 'mental_health_general', label: 'Salud mental general' },
];

export function catalogCategoryFromSubcategory(value: string | undefined): CatalogCategoryId {
  const normalized = (value ?? '').toLocaleLowerCase('es');
  if (normalized.includes('autoestima') || normalized.includes('bienestar')) return 'wellbeing';
  if (normalized.includes('ansiedad') || normalized.includes('estrés') || normalized.includes('estres')) return 'anxiety_stress';
  if (normalized.includes('depresión') || normalized.includes('depresion')) return 'depression';
  if (normalized.includes('personalidad')) return 'personality';
  if (normalized.includes('cognición') || normalized.includes('cognicion') || normalized.includes('atención') || normalized.includes('atencion')) return 'cognition_attention';
  if (normalized.includes('resiliencia') || normalized.includes('afrontamiento')) return 'resilience_coping';
  return 'mental_health_general';
}

const labels: Record<string, string> = {
  license_pending: 'Licencia pendiente',
  license_confirmed: 'Licencia confirmada',
  public_domain: 'Dominio público',
  blocked: 'Bloqueado',
  reviewer_allowlist: 'Solo revisión autorizada',
  technical_validated: 'Validado técnicamente',
  clinical_validated: 'Validado clínicamente',
  content_implemented: 'Contenido implementado',
  permission_not_required: 'Permiso no requerido',
  restricted: 'Restringido',
  review_only: 'Solo revisión',
  public: 'Público',
  review_private: 'Revisión privada',
  licensed_production: 'Producción con licencia',
  entitlement_required: 'Requiere entitlement',
  authenticated: 'Requiere autenticación',
  cataloged: 'Catalogado',
  algorithm_implemented: 'Algoritmo implementado',
  blocked_license: 'Bloqueado por licencia',
  blocked_reference_data: 'Bloqueado por datos de referencia',
  not_started: 'Sin iniciar',
  implemented: 'Implementado',
  pending_reference_data: 'Pendiente de datos de referencia',
  not_requested: 'No solicitado',
  pending: 'Pendiente',
  in_review: 'En revisión',
  changes_requested: 'Correcciones solicitadas',
  technically_approved: 'Aprobado técnicamente',
  clinically_approved: 'Aprobado clínicamente',
  rejected: 'Rechazado',
  expired: 'Vencido',
  internal_wellbeing_check: 'Chequeo interno de bienestar',
};

export function catalogStatusLabel(status: string | undefined): string {
  return labels[status ?? ''] ?? status?.split('_').join(' ') ?? '—';
}
