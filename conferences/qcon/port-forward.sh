#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${GREEN}Starting port-forwards for MCP Demo...${NC}"
echo ""
echo -e "${YELLOW}Services will be available at:${NC}"
echo "  - MCP Server:  http://localhost:8080"
echo "  - Trades API:  http://localhost:8081"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both port-forwards${NC}"
echo ""

# Start both port-forwards in parallel
kubectl port-forward service/trades-mcp-server 8080:80 &
MCP_PID=$!

kubectl port-forward service/trades 8081:80 &
TRADES_PID=$!

# Cleanup function
cleanup() {
    echo ""
    echo -e "${GREEN}Stopping port-forwards...${NC}"
    kill $MCP_PID 2>/dev/null
    kill $TRADES_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Wait for both processes
wait
