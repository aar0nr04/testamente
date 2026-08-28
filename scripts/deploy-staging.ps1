[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z0-9-]+$')]
  [string]$ProjectId,
  [switch]$Staging,
  [switch]$Confirm
)

$ErrorActionPreference = 'Stop'

if (-not $Staging -or -not $Confirm) {
  throw 'No se desplego nada. Vuelve a ejecutar con -Staging -Confirm despues de verificar que ProjectId corresponde exclusivamente al proyecto Firebase de staging.'
}

if (-not (Test-Path '.env.staging.local')) {
  throw 'Falta .env.staging.local. Crea este archivo local no versionado con la configuracion web publica del proyecto Firebase de staging.'
}

$env:FIREBASE_PROJECT_ID = $ProjectId

Write-Host "Validando y desplegando exclusivamente al proyecto de staging: $ProjectId"
npm run lint
npm run typecheck
npm run test -- --run
npx vite build --mode staging
npx firebase-tools deploy --project $ProjectId --only firestore:rules,firestore:indexes,storage,functions,hosting

Write-Host "Revision protegida: https://$ProjectId.web.app/professional-review?instrument=gad-7&locale=es"
