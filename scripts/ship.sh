#!/usr/bin/env bash
# ship.sh — Preflight + commit + push with retry
# Usage: npm run ship -- "commit message"
#   or:  ./scripts/ship.sh "commit message"
set -euo pipefail

GREEN='\033[1;32m'
RED='\033[1;31m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
NC='\033[0m'

info() { echo -e "${CYAN}[ship]${NC} $1"; }
ok()   { echo -e "${GREEN}[ship]${NC} $1"; }
warn() { echo -e "${YELLOW}[ship]${NC} $1"; }
fail() { echo -e "${RED}[ship]${NC} $1"; exit 1; }

# ── Validate environment ──────────────────────────────────────
git rev-parse --git-dir > /dev/null 2>&1 || fail "Not a git repository."

BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || true)
[ -z "$BRANCH" ] && fail "Detached HEAD — checkout a branch first."

info "On branch: $BRANCH"

# ── Run preflight ─────────────────────────────────────────────
info "Running preflight (lint + typecheck + test)..."
npm run preflight || fail "Preflight failed — fix issues before shipping."
ok "Preflight passed!"

# ── Stage & commit ────────────────────────────────────────────
MSG="${1:-}"

if [ -n "$(git status --porcelain)" ]; then
  if [ -z "$MSG" ]; then
    fail "Uncommitted changes found but no commit message provided.\nUsage: npm run ship -- \"your message\""
  fi

  info "Staging changes..."
  git add -A
  git commit -m "$MSG"
  ok "Committed: $MSG"
else
  if [ -z "$MSG" ]; then
    info "Nothing to commit — pushing existing commits."
  else
    info "No changes to commit — pushing existing commits."
  fi
fi

# ── Push with retry ───────────────────────────────────────────
MAX_RETRIES=4
RETRY_DELAY=2
PUSHED=false

for i in $(seq 1 $MAX_RETRIES); do
  if git push -u origin "$BRANCH" 2>&1; then
    PUSHED=true
    break
  fi
  if [ "$i" -lt "$MAX_RETRIES" ]; then
    warn "Push failed — retrying in ${RETRY_DELAY}s... (attempt $i/$MAX_RETRIES)"
    sleep $RETRY_DELAY
    RETRY_DELAY=$((RETRY_DELAY * 2))
  fi
done

$PUSHED || fail "Could not push after $MAX_RETRIES attempts."

# ── Get remote URL for PR link ────────────────────────────────
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ "$REMOTE_URL" =~ github\.com[:/](.+)/(.+)(\.git)?$ ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]%.git}"
  echo ""
  ok "Pushed successfully!"
  ok "Create PR: https://github.com/$OWNER/$REPO/pull/new/$BRANCH"
else
  ok "Pushed successfully to $BRANCH!"
fi
