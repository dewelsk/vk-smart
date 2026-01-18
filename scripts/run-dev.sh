#!/bin/bash

# Script pre spustenie dev prostredia s databázovým tunelom
# Použitie: ./scripts/dev.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   VK Smart - Dev Environment Startup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Funkcia pre cleanup pri ukončení
cleanup() {
    echo ""
    echo -e "${YELLOW}Ukončujem...${NC}"

    # Zabiť SSH tunel ak beží na pozadí z tohto scriptu
    if [ ! -z "$TUNNEL_PID" ]; then
        echo -e "${YELLOW}Zastavujem SSH tunel (PID: $TUNNEL_PID)...${NC}"
        kill $TUNNEL_PID 2>/dev/null || true
    fi

    echo -e "${GREEN}Hotovo.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kontrola či SSH tunel už beží
check_tunnel() {
    if lsof -i :5601 > /dev/null 2>&1; then
        return 0  # Tunel beží
    else
        return 1  # Tunel nebeží
    fi
}

# Spustenie SSH tunelu
start_tunnel() {
    echo -e "${YELLOW}Spúšťam SSH tunel na databázu...${NC}"
    echo "   Lokálne: localhost:5601"
    echo "   Remote: 165.22.95.150:5433"
    echo ""

    ssh -i ~/.ssh/monitra_do \
        -L 5601:localhost:5433 \
        -N \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        root@165.22.95.150 &

    TUNNEL_PID=$!

    # Počkaj kým sa tunel nadviaže
    echo -n "Čakám na pripojenie tunelu"
    for i in {1..10}; do
        sleep 1
        echo -n "."
        if check_tunnel; then
            echo ""
            echo -e "${GREEN}SSH tunel je aktívny.${NC}"
            return 0
        fi
    done

    echo ""
    echo -e "${RED}Nepodarilo sa nadviazať SSH tunel!${NC}"
    echo "Skontrolujte:"
    echo "  - Či existuje SSH kľúč: ~/.ssh/monitra_do"
    echo "  - Či je server dostupný: 165.22.95.150"
    exit 1
}

# Zabitie existujúceho procesu na porte a spustenie tunelu
kill_existing_tunnel() {
    local pids=$(lsof -t -i :5601 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}Zastavujem existujúci proces na porte 5601...${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Spustenie tunelu (vždy nanovo)
echo -e "${BLUE}[1/3] Spúšťam SSH tunel...${NC}"
kill_existing_tunnel
start_tunnel
echo ""

# Kontrola node_modules
echo -e "${BLUE}[2/3] Kontrola závislostí...${NC}"
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo -e "${YELLOW}Inštalujem závislosti...${NC}"
    cd "$PROJECT_DIR" && npm install
else
    echo -e "${GREEN}Závislosti sú nainštalované.${NC}"
fi
echo ""

# Spustenie dev servera
echo -e "${BLUE}[3/3] Spúšťam dev server...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Aplikácia bude dostupná na: http://localhost:5700${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Pre ukončenie stlačte Ctrl+C${NC}"
echo ""

cd "$PROJECT_DIR" && npm run dev
