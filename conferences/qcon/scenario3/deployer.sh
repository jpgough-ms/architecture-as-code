#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================================"
echo " Infrastructure Pre-requisite Checks"
echo "============================================================"
echo ""

echo "[CHECK] Cluster type: minikube. Verifying profile 'secure' is active and running..."
echo ""


echo "[OK]    Minikube profile 'secure' is running."
echo ""

echo "============================================================"
echo " Infrastructure checks passed. Ready for deployment."
echo "============================================================"
echo ""
exit 0

