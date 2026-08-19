#!/usr/bin/env bash
# Creates everything this app needs on GCP and deploys it to Cloud Run.
# Idempotent — safe to re-run; only missing pieces get created.
#
# Usage:
#   ./scripts/gcp-up.sh
#   PROJECT_ID=my-project DEMO_API_KEY=secret123 ./scripts/gcp-up.sh
#
# See docs/COST_OPTIMIZATION.md and docs/IMPLEMENTATION_PLAN.md for why
# each piece exists. Pair with ./scripts/gcp-down.sh to tear back down.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="us-central1"          # Cloud Run service region — must match cloudbuild.yaml
AR_LOCATION="us-central1"     # Artifact Registry location — must match cloudbuild.yaml
AR_REPO="life-grid"
SERVICE_NAME="life-grid"
RUNTIME_SA_NAME="life-grid-runtime"
RUNTIME_SA_EMAIL="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
DEMO_API_KEY="${DEMO_API_KEY:-}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "No project set. Run 'gcloud config set project <id>' or pass PROJECT_ID=<id>." >&2
  exit 1
fi

if [[ -z "$DEMO_API_KEY" ]]; then
  echo "NOTE: DEMO_API_KEY not set — the live-mode endpoints will be deployed"
  echo "      UNGATED (any visitor to the public URL can trigger paid Vertex AI"
  echo "      calls). See docs/COST_OPTIMIZATION.md #7. Re-run with"
  echo "      DEMO_API_KEY=<secret> ./scripts/gcp-up.sh to gate it."
  echo
fi

echo "==> Project: $PROJECT_ID | Cloud Run region: $REGION | Artifact Registry: $AR_LOCATION"

echo "==> Enabling required APIs (idempotent)..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  cloudtrace.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  --project="$PROJECT_ID"

echo "==> Ensuring Artifact Registry repo exists: $AR_REPO ($AR_LOCATION)"
if ! gcloud artifacts repositories describe "$AR_REPO" \
    --project="$PROJECT_ID" --location="$AR_LOCATION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$AR_REPO" \
    --project="$PROJECT_ID" --location="$AR_LOCATION" \
    --repository-format=docker \
    --description="LifeGrid container images"
else
  echo "    already exists, skipping creation"
fi

echo "==> Ensuring runtime service account exists: $RUNTIME_SA_EMAIL"
if ! gcloud iam service-accounts describe "$RUNTIME_SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$RUNTIME_SA_NAME" \
    --project="$PROJECT_ID" \
    --display-name="LifeGrid Cloud Run runtime (least-privilege)"
  # IAM is eventually consistent — a freshly created SA can briefly 404 when
  # referenced in a policy binding immediately after. Wait until it's visible.
  echo "    waiting for the new SA to propagate..."
  for i in $(seq 1 15); do
    gcloud iam service-accounts describe "$RUNTIME_SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1 && break
    sleep 2
  done
  sleep 5  # policy-binding propagation lags slightly behind the describe() check too
else
  echo "    already exists, skipping creation"
fi

echo "==> Granting minimal IAM roles to the runtime SA (idempotent)..."
for role in roles/aiplatform.user roles/cloudtrace.agent; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${RUNTIME_SA_EMAIL}" \
    --role="$role" \
    --condition=None \
    --quiet >/dev/null
done

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
# Which identity `gcloud builds submit` runs as depends on a per-project
# Cloud Build setting (legacy Cloud Build SA vs. the default compute SA —
# newer projects default to the latter). Granting to both is harmless and
# makes this script work regardless of that setting.
CLOUDBUILD_SAS=(
  "${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
  "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
)

echo "==> Granting Cloud Build's runtime identity what it needs to build+deploy (idempotent)..."
for sa in "${CLOUDBUILD_SAS[@]}"; do
  # cloudbuild.builds.builder = permission to actually *execute* a build
  # (read the uploaded source, write logs) — separate from run.admin /
  # artifactregistry.writer, which cover what the build *steps* do.
  for role in roles/cloudbuild.builds.builder roles/run.admin roles/artifactregistry.writer; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
      --member="serviceAccount:${sa}" \
      --role="$role" \
      --condition=None \
      --quiet >/dev/null 2>&1 || true
  done
  # Cloud Build must be allowed to deploy Cloud Run AS the runtime SA above —
  # this is a binding on the SA resource itself, not a project-level role.
  gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA_EMAIL" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:${sa}" \
    --role="roles/iam.serviceAccountUser" \
    --quiet >/dev/null 2>&1 || true
done
sleep 10  # let the IAM grants above actually propagate before the build needs them

echo "==> Building image and deploying to Cloud Run (this runs Docker build + push + deploy)..."
gcloud builds submit \
  --project="$PROJECT_ID" \
  --config=cloudbuild.yaml \
  --substitutions="_DEMO_API_KEY=${DEMO_API_KEY}" \
  .

echo
echo "==> Done. Service URL:"
gcloud run services describe "$SERVICE_NAME" \
  --project="$PROJECT_ID" --region="$REGION" --format="value(status.url)"
echo
echo "Tear down with: ./scripts/gcp-down.sh"
