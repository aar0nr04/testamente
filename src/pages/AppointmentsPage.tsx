import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';

export function AppointmentsPage() {
  const { user } = useAuth();
  const [psychologistId, setPsychologistId] = useState(''); const [startTime, setStartTime] = useState(''); const [notes, setNotes] = useState(''); const [message, setMessage] = useState('');
  if (!user) return null;
  const uid = user.uid;
  async function request() { if (!psychologistId || !startTime) { setMessage('Completa profesional y fecha.'); return; } try { await addDoc(collection(db, 'appointments'), { patientId: uid, psychologistId, participantIds: [uid, psychologistId], status: 'pending', proposedStartTime: new Date(startTime), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, notes, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); setMessage('Solicitud enviada.'); } catch { setMessage('No se pudo crear la solicitud.'); } }
  return <section className="panel narrow stack"><span className="eyebrow">Citas</span><h1>Solicitar cita</h1><label>ID del profesional<input value={psychologistId} onChange={(event) => setPsychologistId(event.target.value)} /></label><label>Fecha y hora<input type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label><label>Notas<input value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} /></label><button onClick={() => void request()}>Enviar solicitud</button>{message ? <p role="status">{message}</p> : null}</section>;
}
