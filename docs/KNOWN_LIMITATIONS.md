# Limitaciones conocidas

- No hay credenciales Firebase ni App Check configurados en este repositorio.
- IA, chat en tiempo real, detalle de cita, carga de avatar, asignación de reviewer y pagos necesitan backend/configuración externa.
- La única prueba Android con payload es restringida y no se incluye en el bundle; el fixture web de estrés es informativo.
- Las traducciones de seis idiomas usan fallback español hasta completar la extracción/revisión humana de strings Android.
- Faltan suites Vitest, Emulator y Playwright; la base de compilación, reglas y modelo está preparada para incorporarlas cuando el entorno Firebase esté disponible.
