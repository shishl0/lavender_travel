#!/usr/bin/env bash
set -euo pipefail

# === Настройки ===
BASE="http://localhost:3000"                   # ← обязательно со схемой http://
SEED_FILE="./destinations-seed.json"           # ← твой json

# ← вставь СВОЙ токен и имя cookie (посмотри в DevTools → Application → Cookies)
COOKIE_NAME="next-auth.session-token"          # или "__Secure-next-auth.session-token" / "authjs.session-token"
COOKIE_VALUE="eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..YjAt3Vonx_qI3aA_.UKd6WrO5lV1U1z9UE3BHZFF2cqvgjtZxdg8xYsbbaJEs3TmIMoYBNuopqmSHY1VGlO-1_Do1wwN3ED3DqihS0L2Xtcr5yWyS1JxnuSBEI5lys5uB_WdgplUzCPHtpMr2m8d7lHwGPiWGo4gZB72I1Utz7lof-3CDlJJFA7V-CC64mI3PA2fBUvoCUiTAyZOuNtjsVXWVOy39VTj6QXf0VfAXPDnX5g3vlhdvaQ79zEYaBiniFghyyFcWrmfNOuOcBEDvL_K317MPmSj_SaKntLBsrIZRePJ18XTq1c9ltBW5ekaE9UJoOIi6xtJDyX7V9r4XnYU.Vm4kVjt0XyDFZDxCC1XeCQ"

# === Проверки ===
if ! command -v jq >/dev/null 2>&1; then
  echo "jq не найден. Установите: brew install jq (или apt-get install jq)" >&2
  exit 1
fi
[ -f "$SEED_FILE" ] || { echo "Файл не найден: $SEED_FILE" >&2; exit 1; }

COUNT=$(jq '.items | length' "$SEED_FILE")
echo "Найдено стран: $COUNT"
echo

# === Загрузка по одной стране ===
for i in $(seq 0 $((COUNT - 1))); do
  PAYLOAD=$(jq -c ".items[$i]" "$SEED_FILE")
  KEY=$(echo "$PAYLOAD" | jq -r '.key')

  echo "→ Пушим: $KEY"

  HTTP_CODE=$(curl -sS -w "%{http_code}" -o /tmp/resp.json \
    -X POST "$BASE/api/destinations/save" \
    -H "Content-Type: application/json" \
    -H "Cookie: ${COOKIE_NAME}=${COOKIE_VALUE}" \
    --data "$PAYLOAD")

  if [ "$HTTP_CODE" != "200" ]; then
    echo "  ✗ Ошибка ($HTTP_CODE): $(cat /tmp/resp.json)" >&2
    exit 1
  else
    echo "  ✓ OK: $(cat /tmp/resp.json)"
  fi
done

echo
echo "Готово."