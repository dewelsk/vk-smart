#!/bin/bash

# SSH Tunel pre pripojenie na PostgreSQL databázu na remote serveri
# Lokálny port: 5601
# Remote DB port: 5433 (vk-smart-postgres kontajner)

echo "🔗 Spúšťam SSH tunel na databázu..."
echo "   Lokálne: localhost:5601"
echo "   Remote: 165.22.95.150:5433 (vk-smart-postgres)"
echo ""
echo "Tunel bude aktívny až kým túto konzolu nezatvoríte (Ctrl+C)."
echo ""

# SSH tunel s autoreconnect
while true; do
  ssh -i ~/.ssh/monitra_do \
    -L 5601:localhost:5433 \
    -N \
    root@165.22.95.150

  echo "⚠️  Tunel sa odpojil. Reštartujem za 5 sekúnd..."
  sleep 5
done
