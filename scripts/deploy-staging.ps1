[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z0-9-]+$')]
  [string]$ProjectId,
  [switch]$Staging,
  [switch]$Confirm,
  [switch]$IncludeFunctionsAndStorage,
  [switch]$BillingApproved
)

$ErrorActionPreference = 'Stop'
$forbiddenProductionProjectIds = @('psytst-72f06')

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Command
  )

  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Name fallo con codigo de salida $LASTEXITCODE. El despliegue se detuvo antes de continuar."
  }
}

function Read-LocalEnvironment {
  param([Parameter(Mandatory = $true)][string]$Path)

  $values = @{}
  Get-Content -LiteralPath $Path | ForEach-Object {
    if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$') {
      $value = $Matches[2].Trim()
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      $values[$Matches[1]] = $value
    }
  }
  return $values
}

if (-not $Staging -or -not $Confirm) {
  throw 'No se desplego nada. Vuelve a ejecutar con -Staging -Confirm despues de verificar que ProjectId corresponde exclusivamente al proyecto Firebase de staging.'
}

if ($forbiddenProductionProjectIds -contains $ProjectId) {
  throw "El proyecto $ProjectId esta marcado como produccion y este script no puede desplegarlo."
}

if ($IncludeFunctionsAndStorage -and -not $BillingApproved) {
  throw 'Cloud Functions y Cloud Storage requieren el plan Blaze. No se desplego nada: se requiere -BillingApproved despues de una autorizacion expresa.'
}

if (-not (Test-Path '.env.staging.local')) {
  throw 'Falta .env.staging.local. Crea este archivo local no versionado con la configuracion web publica del proyecto Firebase de staging.'
}

$stagingEnvironment = Read-LocalEnvironment -Path '.env.staging.local'
$requiredVariables = @('VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID', 'VITE_FIREBASE_APPCHECK_SITE_KEY', 'VITE_APPCHECK_PROVIDER')
foreach ($variable in $requiredVariables) {
  if ([string]::IsNullOrWhiteSpace($stagingEnvironment[$variable])) {
    throw "Falta $variable en .env.staging.local. El despliegue de revision protegida no puede continuar."
  }
}

if ($stagingEnvironment['VITE_FIREBASE_PROJECT_ID'] -ne $ProjectId) {
  throw "VITE_FIREBASE_PROJECT_ID no coincide con ProjectId. Se esperaba $ProjectId y el despliegue se cancelo."
}

if ($stagingEnvironment['VITE_APPCHECK_PROVIDER'] -ne 'enterprise') {
  throw 'VITE_APPCHECK_PROVIDER debe ser exactamente enterprise en staging. No se desplego nada.'
}

if ($stagingEnvironment['VITE_USE_FIREBASE_EMULATORS'] -eq 'true') {
  throw 'VITE_USE_FIREBASE_EMULATORS=true no es valido para un despliegue de staging.'
}

$env:FIREBASE_PROJECT_ID = $ProjectId

Write-Host "Validando y desplegando exclusivamente al proyecto de staging: $ProjectId"
Invoke-Checked -Name 'Lint' -Command { npm run lint }
Invoke-Checked -Name 'Typecheck' -Command { npm run typecheck }
Invoke-Checked -Name 'Pruebas unitarias' -Command { npm run test -- --run }
Invoke-Checked -Name 'Validacion de instrumentos' -Command { npm run validate:instruments }
Invoke-Checked -Name 'Validacion de traducciones' -Command { npm run validate:translations }
Invoke-Checked -Name 'Pruebas de reglas' -Command { npm run test:rules }
Invoke-Checked -Name 'Build de Functions' -Command { npm --prefix functions run build }
Invoke-Checked -Name 'Pruebas E2E' -Command { npm run test:e2e }
Invoke-Checked -Name 'Build web de staging' -Command { npx vite build --mode staging }

$deployTargets = 'firestore:rules,firestore:indexes,hosting'
if ($IncludeFunctionsAndStorage) {
  $deployTargets = "$deployTargets,storage,functions"
}
Invoke-Checked -Name 'Despliegue Firebase de staging' -Command { npx firebase-tools deploy --project $ProjectId --only $deployTargets }

Write-Host "Revision protegida: https://$ProjectId.web.app/professional-review?instrument=gad-7&locale=es"
if (-not $IncludeFunctionsAndStorage) {
  Write-Host 'Functions y Storage no se desplegaron: la revision de GAD-7, PHQ-9 y RSES usa Firestore real; los flujos privados y administrativos siguen deshabilitados en Spark.'
}
