type SafetyAlert = { code: string; message: string };

export function SafetyNotice({ alerts }: { alerts: SafetyAlert[] }) {
  if (!alerts.some((alert) => alert.code === 'self_harm_follow_up')) return null;

  return <aside className="error stack" role="alert" aria-live="assertive">
    <strong>Tu seguridad es lo primero.</strong>
    <p>Si podrías hacerte daño o estás en peligro inmediato, llama al 911 ahora mismo (en México) o al número local de emergencias de tu país.</p>
    <p>En México, la <a href="https://www.gob.mx/conasama/articulos/linea-de-la-vida-800-911-2000?idiom=es" target="_blank" rel="noreferrer">Línea de la Vida (800 911 2000)</a> ofrece apoyo confidencial, gratuito y disponible 24/7.</p>
    <p>Esta aplicación no puede contactar servicios de emergencia ni sustituye atención profesional.</p>
  </aside>;
}
