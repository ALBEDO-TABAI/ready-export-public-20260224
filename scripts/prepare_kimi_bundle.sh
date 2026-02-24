#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT_DIR/exports/kimi/$TIMESTAMP"
STAGE_DIR="$OUT_DIR/ready"
ZIP_NAME="ready-src-$TIMESTAMP.zip"

echo "[1/4] Create output directory: $OUT_DIR"
mkdir -p "$OUT_DIR"

echo "[2/4] Copy project snapshot (exclude build/deps/cache)"
rsync -a "$ROOT_DIR/" "$STAGE_DIR/" \
  --exclude "node_modules" \
  --exclude "out" \
  --exclude "dist" \
  --exclude "exports" \
  --exclude ".DS_Store" \
  --exclude "*.log"

echo "[3/4] Write quick baseline report"
{
  echo "# BASELINE"
  echo
  echo "Generated at: $(date '+%Y-%m-%d %H:%M:%S')"
  echo
  echo "## Runtime"
  echo "- node: $(node -v 2>/dev/null || echo unavailable)"
  echo "- npm: $(npm -v 2>/dev/null || echo unavailable)"
  echo
  echo "## Suggested verification"
  echo "- npm install"
  echo "- npm run typecheck"
  echo "- npm run lint"
  echo "- npm run build"
} > "$OUT_DIR/BASELINE.md"

echo "[4/4] Build zip"
(
  cd "$OUT_DIR"
  zip -qry "$ZIP_NAME" "ready"
  rm -rf "ready"
)

cp "$ROOT_DIR/KIMI_CLUSTER_PROMPTS.md" "$OUT_DIR/"
cp "$ROOT_DIR/KIMI_TASK_BRIEF_TEMPLATE.md" "$OUT_DIR/"
cp "$ROOT_DIR/OUTPUT_CONTRACT.md" "$OUT_DIR/"
cp "$ROOT_DIR/KIMI_TASK_BRIEF_TEMPLATE.md" "$OUT_DIR/TASK_BRIEF.md"

cat <<EOF

Done.
Bundle directory: $OUT_DIR
Source zip: $OUT_DIR/$ZIP_NAME

Next:
1) Fill TASK_BRIEF.md from template.
2) Upload zip + TASK_BRIEF.md + OUTPUT_CONTRACT.md to Kimi.
EOF
