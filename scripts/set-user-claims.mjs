#!/usr/bin/env node
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const roles = new Set(['owner', 'admin', 'professional_reviewer']);
const [command, uid, role, ...flags] = process.argv.slice(2);
const confirm = flags.includes('--confirm');

function usage() {
  console.log(`Uso:
  node scripts/set-user-claims.mjs query <uid>
  node scripts/set-user-claims.mjs grant <uid> <owner|admin|professional_reviewer> --confirm
  node scripts/set-user-claims.mjs remove <uid> <owner|admin|professional_reviewer> --confirm

Requiere GOOGLE_APPLICATION_CREDENTIALS apuntando a una cuenta de servicio local o Application Default Credentials. No se guardan credenciales en este repositorio.`);
}

if (!command || !uid || (command !== 'query' && !role) || !['query', 'grant', 'remove'].includes(command)) { usage(); process.exitCode = 1; }
else if (command !== 'query' && (!roles.has(role) || !confirm)) {
  console.error('Para modificar claims usa un permiso válido y el flag --confirm.'); usage(); process.exitCode = 1;
} else {
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
  const auth = getAuth();
  const user = await auth.getUser(uid);
  const current = user.customClaims ?? {};
  if (command === 'query') {
    console.log(JSON.stringify({ uid: user.uid, email: user.email ?? null, emailVerified: user.emailVerified, customClaims: current }, null, 2));
  } else {
    const next = { ...current };
    if (command === 'grant') next[role] = true;
    else delete next[role];
    const readline = createInterface({ input, output });
    const answer = await readline.question(`Escribe el UID ${uid} para confirmar ${command} ${role}: `);
    readline.close();
    if (answer !== uid) { console.error('Confirmación cancelada: el UID no coincide.'); process.exitCode = 1; }
    else {
      // Merge with the existing map; unrelated custom claims are deliberately preserved.
      await auth.setCustomUserClaims(uid, next);
      console.log(`Claims actualizados para ${uid}. El usuario debe renovar su token o volver a iniciar sesión.`);
    }
  }
}
