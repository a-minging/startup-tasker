$env:CI = 'true'
$env:NEXT_TELEMETRY_DISABLED = '1'
Set-Location 'd:\proj\bpgenius'
& npm run dev 2>&1
