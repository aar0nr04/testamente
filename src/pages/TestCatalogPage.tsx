import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalogCategories, catalogStatusLabel, type CatalogCategoryId } from '../data/instruments/statusLabels';
import { getCatalogForLocale } from '../data/tests';
import { catalogSubcategories, emptyCatalogFilters, filterCatalog, filtersFromSearchParams, filtersToSearchParams, type CatalogFilters } from '../lib/catalogFilters';
import { useLocale } from '../hooks/useLocale';

export function TestCatalogPage() {
  const { locale } = useLocale();
  const [params, setParams] = useSearchParams();
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const filters = filtersFromSearchParams(params);
  const catalog = useMemo(() => getCatalogForLocale(locale), [locale]);
  const tests = useMemo(() => filterCatalog(catalog, filters), [catalog, filters]);
  const subcategories = useMemo(() => catalogSubcategories(catalog), [catalog]);

  function change<K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) {
    setParams(filtersToSearchParams({ ...filters, [key]: value }));
  }
  function chooseCategory(category: CatalogCategoryId | '') { change('category', category); setMobileCategoriesOpen(false); }
  function clear() { setParams(filtersToSearchParams(emptyCatalogFilters)); setMobileCategoriesOpen(false); }

  return <section className="catalog-page stack">
    <div className="page-heading"><div><span className="eyebrow">Explora</span><h1>Catálogo de tests</h1><p>Instrumentos disponibles para el idioma activo y la revisión profesional.</p></div><span className="counter" aria-live="polite">{tests.length} resultados</span></div>
    <div className="notice">Los tests son herramientas informativas o de cribado; no equivalen a un diagnóstico clínico.</div>
    <div className="catalog-layout">
      <aside className="category-sidebar" aria-label="Categorías del catálogo"><h2>Categorías</h2><CategoryButtons active={filters.category} onSelect={chooseCategory} /></aside>
      <div className="catalog-main stack">
        <div className="mobile-catalog-controls"><button className="secondary" aria-expanded={mobileCategoriesOpen} aria-controls="mobile-category-drawer" onClick={() => setMobileCategoriesOpen((current) => !current)}>Categorías</button><div className="category-chips" aria-label="Categorías rápidas">{catalogCategories.map((category) => <button className={filters.category === category.id ? 'active' : 'secondary'} key={category.id} onClick={() => chooseCategory(category.id)}>{category.label}</button>)}</div></div>
        {mobileCategoriesOpen ? <aside id="mobile-category-drawer" className="mobile-category-drawer" aria-label="Categorías"><div className="row-between"><h2>Categorías</h2><button className="link-button" onClick={() => setMobileCategoriesOpen(false)}>Cerrar</button></div><CategoryButtons active={filters.category} onSelect={chooseCategory} /></aside> : null}
        <CatalogFilterBar filters={filters} subcategories={subcategories} onChange={change} onClear={clear} />
        {tests.length ? <div className="grid catalog-grid">{tests.map((test) => <CatalogCard key={test.id} test={test} />)}</div> : <div className="empty-state panel"><h2>Sin instrumentos que coincidan</h2><p>Prueba a quitar un filtro o buscar otro término.</p><button className="secondary" onClick={clear}>Limpiar filtros</button></div>}
      </div>
    </div>
  </section>;
}

function CategoryButtons({ active, onSelect }: { active: CatalogCategoryId | ''; onSelect: (category: CatalogCategoryId | '') => void }) {
  return <div className="category-buttons"><button className={active === '' ? 'active' : 'secondary'} onClick={() => onSelect('')}>Todas</button>{catalogCategories.map((category) => <button className={active === category.id ? 'active' : 'secondary'} key={category.id} onClick={() => onSelect(category.id)}>{category.label}</button>)}</div>;
}

function CatalogFilterBar({ filters, subcategories, onChange, onClear }: { filters: CatalogFilters; subcategories: string[]; onChange: <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => void; onClear: () => void }) {
  return <form className="catalog-filters" onSubmit={(event) => event.preventDefault()} aria-label="Filtros del catálogo">
    <label className="filter-search">Buscar<input type="search" placeholder="Nombre, tema o etiqueta" value={filters.query} onChange={(event) => onChange('query', event.target.value)} /></label>
    <label>Categoría<select value={filters.category} onChange={(event) => onChange('category', event.target.value as CatalogFilters['category'])}><option value="">Todas</option>{catalogCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
    <label>Subcategoría<select value={filters.subcategory} onChange={(event) => onChange('subcategory', event.target.value)}><option value="">Todas</option>{subcategories.map((subcategory) => <option value={subcategory} key={subcategory}>{subcategory}</option>)}</select></label>
    <label>Licencia<select value={filters.license} onChange={(event) => onChange('license', event.target.value)}><option value="">Todas</option><option value="public_domain">Dominio público</option><option value="license_confirmed">Licencia confirmada</option><option value="license_pending">Licencia pendiente</option><option value="review_only">Solo revisión</option><option value="blocked">Bloqueado</option></select></label>
    <label>Acceso<select value={filters.access} onChange={(event) => onChange('access', event.target.value)}><option value="">Todos</option><option value="public">Público</option><option value="reviewer_allowlist">Solo revisión autorizada</option></select></label>
    <label>Estado técnico<select value={filters.technical} onChange={(event) => onChange('technical', event.target.value)}><option value="">Todos</option><option value="technical_validated">Validado técnicamente</option><option value="content_implemented">Contenido implementado</option><option value="cataloged">Catalogado</option><option value="blocked_license">Bloqueado por licencia</option><option value="blocked_reference_data">Bloqueado por datos de referencia</option></select></label>
    <label>Estado clínico<select value={filters.clinical} onChange={(event) => onChange('clinical', event.target.value)}><option value="">Todos</option><option value="clinical_validated">Validado clínicamente</option><option value="pending">Pendiente</option><option value="in_review">En revisión</option><option value="changes_requested">Correcciones solicitadas</option></select></label>
    <label>Idioma<select value={filters.language} onChange={(event) => onChange('language', event.target.value as CatalogFilters['language'])}><option value="">Todos</option>{['es', 'en', 'fr', 'pt', 'it', 'de', 'zh'].map((language) => <option value={language} key={language}>{language.toUpperCase()}</option>)}</select></label>
    <label>Payload<select value={filters.payload} onChange={(event) => onChange('payload', event.target.value as CatalogFilters['payload'])}><option value="">Todos</option><option value="available">Disponible</option><option value="unavailable">No disponible</option></select></label>
    <label>Duración<select value={filters.duration} onChange={(event) => onChange('duration', event.target.value as CatalogFilters['duration'])}><option value="">Todas</option><option value="short">Hasta 3 min</option><option value="medium">4–10 min</option><option value="long">Más de 10 min</option></select></label>
    <label>Preguntas<select value={filters.questions} onChange={(event) => onChange('questions', event.target.value as CatalogFilters['questions'])}><option value="">Todas</option><option value="brief">Hasta 10</option><option value="standard">11–30</option><option value="extended">Más de 30</option></select></label>
    <button type="button" className="secondary filter-clear" onClick={onClear}>Limpiar filtros</button>
  </form>;
}

function CatalogCard({ test }: { test: ReturnType<typeof getCatalogForLocale>[number] }) {
  return <article className={`card test-card ${test.payloadAvailable ? '' : 'locked-card'}`}>
    <div className="card-meta"><span>{test.estimatedMinutes} min</span><span>•</span><span>{test.questionCount ?? test.questions.length} preguntas</span></div>
    <h2>{test.title}</h2><p>{test.description}</p>
    <div className="tag-row"><span className="tag">{catalogStatusLabel(test.licenseStatus)}</span><span className="tag">{catalogStatusLabel(test.accessMode)}</span><span className="tag">{catalogStatusLabel(test.technicalStatus)}</span><span className="tag">{catalogStatusLabel(test.clinicalStatus)}</span></div>
    <div className="tag-row">{(test.tags ?? []).slice(0, 3).map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
    {test.payloadAvailable ? <Link to={`/tests/${test.id}`} className="button-link">Ver detalle</Link> : <p className="muted">Payload protegido. Requiere flujo de licencia y revisión autorizada.</p>}
  </article>;
}
