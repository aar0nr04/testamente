import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';

interface PublicPsychologist { id: string; name: string; headline?: string; specialties?: string[]; modalities?: string[]; city?: string; priceMXN?: number; photoUrl?: string; }

export function DirectoryPage() {
  const [items, setItems] = useState<PublicPsychologist[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    if (!db) { setLoading(false); return () => { active = false; }; }
    void getDocs(query(collection(db, 'publicPsychologistProfiles'), where('approvalStatus', '==', 'approved')))
      .then((snapshot) => { if (active) setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as PublicPsychologist))); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <section className="stack"><div className="page-heading"><div><span className="eyebrow">Directorio</span><h1>Profesionales aprobados</h1><p>Solo mostramos información pública del perfil profesional.</p></div></div>{loading ? <p className="status">Cargando directorio…</p> : items.length === 0 ? <div className="empty-state"><h2>Aún no hay perfiles publicados</h2><p>Los seeds de Android no se cargan automáticamente en producción.</p></div> : <div className="grid">{items.map((item) => <article className="card" key={item.id}>{item.photoUrl ? <img className="avatar" src={item.photoUrl} alt="" /> : <div className="avatar placeholder">{item.name.slice(0, 1)}</div>}<h2>{item.name}</h2><p>{item.headline}</p><small>{item.specialties?.join(' · ')}{item.city ? ` · ${item.city}` : ''}</small><Link className="button-link" to={`/psychologists/${item.id}`}>Ver perfil</Link></article>)}</div>}</section>;
}
