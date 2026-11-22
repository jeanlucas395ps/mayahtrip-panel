#!/usr/bin/env bash
# Deploy deste repo em https://admin-painel.mayahtrip.com
# Uso: ./scripts/deploy-admin-painel.sh
set -euo pipefail
export DEPLOY_TARGET_DIR="${DEPLOY_TARGET_DIR:-/var/www/admin-painel}"
export DEPLOY_TARGET_DOMAIN="${DEPLOY_TARGET_DOMAIN:-admin-painel.mayahtrip.com}"
# shellcheck source=/dev/null
source "$(cd "$(dirname "$0")" && pwd)/_deploy-panel-common.sh"
