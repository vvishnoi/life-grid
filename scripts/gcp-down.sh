#!/usr/bin/env bash
# Tears down the billable/stored resources scripts/gcp-up.sh created.
#
# Usage:
#   ./scripts/gcp-down.sh            # deletes the running service + stored images, asks first
#   ./scripts/gcp-down.sh --yes      # same, no confirmation prompt
#   ./scripts/gcp-down.sh --full     # also disables Vertex AI/Cloud Trace APIs and
#                                     # deletes the runtime service account — a clean
#                                     # slate, but gcp-up.sh takes a bit longer next time
#
# By default APIs stay enabled and the runtime SA stays around — both are
# free to leave in place, and it makes the next gcp-up.sh faster.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="us-central1"
AR_LOCATION="us-central1"
AR_REPO="life-grid"
SERVICE_NAME="life-grid"
RUNTIME_SA_NAME="life-grid-runtime"
RUNTIME_SA_EMAIL="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

SKIP_CONFIRM=false
FULL=false
for arg in "$@"; do
  case "$arg" in
    --yes|-y) SKIP_CONFIRM=true ;;
    --full) FULL=true ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

if [[ -z "$PROJECT_ID" ]]; then
  echo "No project set. Run 'gcloud config set project <id>' or pass PROJECT_ID=<id>." >&2
  exit 1
fi

echo "This will delete, in project '$PROJECT_ID':"
echo "  - Cloud Run service: $SERVICE_NAME ($REGION)"
echo "  - Artifact Registry repo (and all stored images): $AR_REPO ($AR_LOCATION)"
if $FULL; then
  echo "  - Runtime service account: $RUNTIME_SA_EMAIL"
  echo "  - Disabling Vertex AI + Cloud Trace + Firestore APIs"
  echo "    (the Firestore DATABASE and its data are NOT deleted — that's a"
  echo "    separate, harder-to-reverse step; storage cost for a Memory Bank"
  echo "    this small is negligible. Delete manually if you really want to:"
  echo "    gcloud firestore databases delete --database='(default)' --project=$PROJECT_ID)"
fi
echo

if ! $SKIP_CONFIRM; then
  read -r -p "Proceed? (y/N) " reply
  if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    echo "Aborted, nothing was deleted."
    exit 0
  fi
fi

echo "==> Deleting Cloud Run service..."
gcloud run services delete "$SERVICE_NAME" \
  --project="$PROJECT_ID" --region="$REGION" --quiet 2>&1 \
  || echo "    (already gone, or never deployed)"

echo "==> Deleting Artifact Registry repo (and its images)..."
gcloud artifacts repositories delete "$AR_REPO" \
  --project="$PROJECT_ID" --location="$AR_LOCATION" --quiet 2>&1 \
  || echo "    (already gone)"

if $FULL; then
  echo "==> Deleting runtime service account..."
  gcloud iam service-accounts delete "$RUNTIME_SA_EMAIL" \
    --project="$PROJECT_ID" --quiet 2>&1 \
    || echo "    (already gone)"

  echo "==> Disabling Vertex AI + Cloud Trace + Firestore APIs..."
  gcloud services disable aiplatform.googleapis.com cloudtrace.googleapis.com firestore.googleapis.com \
    --project="$PROJECT_ID" --force --quiet
fi

echo
echo "==> Done. Nothing billable should be running for this app now."
echo "    Re-create everything with: ./scripts/gcp-up.sh"
