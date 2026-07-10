#!/usr/bin/env node
/* Run with Firebase Admin credentials. Dry-run is the default and no documents are deleted. */
const write = process.argv.includes('--write');
const confirm = process.argv.includes('--confirm-production-migration');
if (write && !confirm) { console.error('Refusing writes: pass --confirm-production-migration explicitly.'); process.exit(1); }
console.log(`Legacy migration mode: ${write ? 'WRITE' : 'DRY RUN'}`);
console.log('Planned adapters: users/{uid}/test_results → users/{uid}/testResults; appointment_requests and users/{uid}/appointments → appointments; psychologists → publicPsychologistProfiles.');
console.log('Configure Firebase Admin credentials and implement project-specific batched reads before using --write. No production operation was performed.');
