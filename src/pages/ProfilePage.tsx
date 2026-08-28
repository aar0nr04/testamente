import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState, type ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { requireStorage } from '../lib/firebase';
import { editableProfessional, updateProfile } from '../repositories/profileRepository';
import { submitProfessionalProfile } from '../lib/admin';
import type { LocaleCode, ProfessionalProfile } from '../types/domain';

const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
const languageOptions: LocaleCode[] = ['es', 'en', 'fr', 'pt', 'it', 'de', 'zh'];
const modalityOptions = ['online', 'presencial', 'híbrida'];
const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const joinList = (value: string[] | undefined) => (value ?? []).join(', ');

export function ProfilePage() {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [professional, setProfessional] = useState<Partial<ProfessionalProfile>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? ''); setPhone(profile.phone ?? ''); setTimeZone(profile.timeZone ?? '');
    setCity(profile.city ?? ''); setState(profile.state ?? ''); setCountry(profile.country ?? ''); setPhotoUrl(profile.photoUrl ?? '');
    setProfessional(profile.professional ?? {});
  }, [profile]);

  if (!user || !profile) return <p>Cargando perfil…</p>;
  const uid = user.uid;
  const isPsychologist = profile.role === 'psychologist';
  const professionalStatus = profile.professional?.approvalStatus ?? 'pending';

  function setProfessionalField<K extends keyof ProfessionalProfile>(key: K, value: ProfessionalProfile[K]) {
    setProfessional((current) => ({ ...current, [key]: value }));
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { setMessage('Selecciona una imagen de hasta 5 MB.'); return; }
    setMessage('Subiendo foto…');
    try {
      const photoReference = ref(requireStorage(), `users/${uid}/profile.jpg`);
      await uploadBytes(photoReference, file, { contentType: file.type });
      setPhotoUrl(await getDownloadURL(photoReference));
      setMessage('Foto cargada. Guarda el perfil para confirmar.');
    } catch { setMessage('No se pudo subir la foto.'); }
  }

  async function save() {
    setSaving(true); setMessage('');
    try {
      await updateProfile(uid, {
        name, phone, timeZone, city, state, country, photoUrl,
        professional: isPsychologist ? editableProfessional(professional) : undefined,
      });
      setMessage('Perfil actualizado. Los datos de aprobación se revisan fuera de este formulario.');
    } catch { setMessage('No se pudo actualizar el perfil.'); }
    finally { setSaving(false); }
  }

  async function submitForReview() {
    setMessage('');
    try { await submitProfessionalProfile(); setMessage('Perfil enviado a revisión administrativa. Renueva la página para consultar el estado.'); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No se pudo enviar el perfil a revisión.'); }
  }

  return <section className="panel stack profile-page">
    <div><span className="eyebrow">Cuenta · {profile.role === 'psychologist' ? 'Psicólogo/a' : 'Paciente'}</span><h1>Mi perfil</h1></div>
    <div className="profile-photo-row">
      {photoUrl ? <img className="avatar" src={photoUrl} alt="Foto de perfil" /> : <div className="avatar placeholder" aria-hidden="true">{name.slice(0, 1).toUpperCase() || '?'}</div>}
      <label>Foto de perfil<input type="file" accept="image/*" onChange={(event) => void uploadPhoto(event)} /></label>
    </div>
    <div className="form-grid">
      <label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>
      <label>Correo<input value={user.email ?? ''} readOnly /></label>
      <label>Teléfono<input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" /></label>
      <label>Zona horaria<input placeholder="America/Mexico_City" value={timeZone} onChange={(event) => setTimeZone(event.target.value)} /></label>
      <label>Estado<input value={state} onChange={(event) => setState(event.target.value)} /></label>
      <label>Ciudad<input value={city} onChange={(event) => setCity(event.target.value)} /></label>
      <label>País<input value={country} onChange={(event) => setCountry(event.target.value)} /></label>
    </div>

    {isPsychologist ? <section className="professional-form stack" aria-labelledby="professional-profile-heading">
      <div><span className="eyebrow">Perfil profesional</span><h2 id="professional-profile-heading">Información para evaluación</h2><p className="muted">Los campos de aprobación son de solo lectura; no cambian tus permisos ni se pueden editar desde el navegador.</p></div>
      <div className="approval-status" aria-live="polite"><strong>Estado de aprobación:</strong> {professionalStatus}{profile.professional?.approvalNote ? ` · ${profile.professional.approvalNote}` : ''}</div>
      <div className="form-grid">
        <label>Cédula profesional<input value={professional.licenseNumber ?? ''} onChange={(event) => setProfessionalField('licenseNumber', event.target.value)} /></label>
        <label>Headline<input value={professional.headline ?? ''} onChange={(event) => setProfessionalField('headline', event.target.value)} placeholder="Ej. Terapia cognitivo-conductual" /></label>
        <label className="form-span">Descripción<textarea rows={4} value={professional.description ?? ''} onChange={(event) => setProfessionalField('description', event.target.value)} /></label>
        <label>Especialidades (separadas por coma)<input value={joinList(professional.specialties)} onChange={(event) => setProfessionalField('specialties', splitList(event.target.value))} /></label>
        <label>Idiomas<select multiple value={professional.languages ?? ['es']} onChange={(event) => setProfessionalField('languages', Array.from(event.target.selectedOptions, (option) => option.value as LocaleCode))}>{languageOptions.map((language) => <option value={language} key={language}>{language.toUpperCase()}</option>)}</select></label>
        <label>Modalidades<select multiple value={professional.modalities ?? []} onChange={(event) => setProfessionalField('modalities', Array.from(event.target.selectedOptions, (option) => option.value))}>{modalityOptions.map((modality) => <option value={modality} key={modality}>{modality}</option>)}</select></label>
        <label>Precio por sesión (MXN)<input type="number" min="0" value={professional.priceMXN ?? ''} onChange={(event) => setProfessionalField('priceMXN', event.target.value === '' ? undefined : Number(event.target.value))} /></label>
        <label>Duración (minutos)<input type="number" min="15" max="240" value={professional.sessionMinutes ?? ''} onChange={(event) => setProfessionalField('sessionMinutes', event.target.value === '' ? undefined : Number(event.target.value))} /></label>
      </div>
      <fieldset className="availability-grid"><legend>Disponibilidad semanal (horas separadas por coma)</legend>{days.map((day) => <label key={day}>{day}<input value={joinList(professional.availability?.[day])} placeholder="09:00, 16:00" onChange={(event) => setProfessionalField('availability', { ...(professional.availability ?? {}), [day]: splitList(event.target.value) })} /></label>)}</fieldset>
      <div className="check-grid">
        <label className="checkbox"><input type="checkbox" checked={professional.acceptingNewPatients === true} onChange={(event) => setProfessionalField('acceptingNewPatients', event.target.checked)} />Acepto nuevos pacientes</label>
        <label className="checkbox"><input type="checkbox" checked={professional.isPublicPhone === true} onChange={(event) => setProfessionalField('isPublicPhone', event.target.checked)} />Mostrar teléfono público tras aprobación</label>
        <label className="checkbox"><input type="checkbox" checked={professional.isPublicLocation === true} onChange={(event) => setProfessionalField('isPublicLocation', event.target.checked)} />Mostrar ciudad/estado tras aprobación</label>
      </div>
      <div className="form-grid">
        <label>Moneda<input maxLength={3} value={professional.currency ?? 'MXN'} onChange={(event) => setProfessionalField('currency', event.target.value.toUpperCase())} /></label>
        <label className="checkbox"><input type="checkbox" checked={professional.isPublicPrice === true} onChange={(event) => setProfessionalField('isPublicPrice', event.target.checked)} />Mostrar precio público tras aprobación</label>
        <label>Formación (una por línea)<textarea rows={3} value={(professional.education ?? []).join('\n')} onChange={(event) => setProfessionalField('education', event.target.value.split('\n').filter(Boolean))} /></label>
        <label>Experiencia (una por línea)<textarea rows={3} value={(professional.experience ?? []).join('\n')} onChange={(event) => setProfessionalField('experience', event.target.value.split('\n').filter(Boolean))} /></label>
        <label>Publicaciones (una por línea)<textarea rows={3} value={(professional.publications ?? []).join('\n')} onChange={(event) => setProfessionalField('publications', event.target.value.split('\n').filter(Boolean))} /></label>
        <label>Áreas de investigación (separadas por coma)<input value={joinList(professional.researchAreas)} onChange={(event) => setProfessionalField('researchAreas', splitList(event.target.value))} /></label>
        <label className="form-span">Enlaces profesionales (Etiqueta|https://…, uno por línea)<textarea rows={3} value={(professional.professionalLinks ?? []).map((link) => `${link.label}|${link.url}`).join('\n')} onChange={(event) => setProfessionalField('professionalLinks', event.target.value.split('\n').filter(Boolean).map((line) => { const [label, url] = line.split('|'); return { label: label ?? '', url: url ?? '' }; }))} /></label>
      </div>
    </section> : null}
    {isPsychologist && ['draft', 'changes_requested', 'rejected', 'pending'].includes(professionalStatus) ? <button className="secondary" onClick={() => void submitForReview()}>Enviar para revisión</button> : null}
    <div className="row-gap"><button disabled={saving} onClick={() => void save()}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>{message ? <p role="status">{message}</p> : null}</div>
  </section>;
}
