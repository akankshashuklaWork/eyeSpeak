# 🚀 EyeSpeak AI - Deployment Guide

## InsForge/Butterbase Deployment

InsForge (built on Butterbase) is our deployment platform sponsor.

### Prerequisites

1. Butterbase account and CLI installed
2. API keys configured in `.env`

### Step 1: Initialize App

```bash
# Login to Butterbase
butterbase login

# Initialize new app
butterbase apps:create eyespeak-ai
```

### Step 2: Configure Environment

```bash
# Set environment variables
butterbase config:set NEBIUS_API_KEY="your_nebius_key_here"
butterbase config:set COGNEE_BASE_URL="your_cognee_url"
butterbase config:set COGNEE_API_KEY="your_cognee_key"
butterbase config:set NIMBLE_API_KEY="your_nimble_key"
```

### Step 3: Deploy

```bash
# Deploy the application
butterbase deploy
```

### Step 4: Verify Deployment

```bash
# Check deployment status
butterbase apps:info eyespeak-ai

# View logs
butterbase logs --tail
```

Your app will be available at:
- Main API: `https://eyespeak-ai.butterbase.app`
- Caregiver Assistant: `https://eyespeak-ai.butterbase.app/caregiver-assistant`
- API Docs: `https://eyespeak-ai.butterbase.app/docs`

---

## Alternative: Docker Deployment

### Build and Run Locally

```bash
# Build the Docker image
docker build -t eyespeak-ai .

# Run the container
docker run -p 8000:8000 --env-file .env eyespeak-ai
```

### Deploy to Cloud (AWS, GCP, Azure)

**AWS Elastic Beanstalk:**
```bash
eb init -p docker eyespeak-ai
eb create eyespeak-ai-env
eb deploy
```

**Google Cloud Run:**
```bash
gcloud run deploy eyespeak-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Azure Container Apps:**
```bash
az containerapp up \
  --name eyespeak-ai \
  --resource-group eyespeak-rg \
  --location eastus \
  --environment eyespeak-env \
  --image eyespeak-ai:latest
```

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEBIUS_API_KEY` | Nebius AI API key for MiniMax-M3 | ✅ |
| `COGNEE_BASE_URL` | Cognee knowledge graph base URL | ✅ |
| `COGNEE_API_KEY` | Cognee API authentication key | ✅ |
| `NIMBLE_API_KEY` | Nimble search API key | ✅ |

---

## Health Checks

After deployment, verify all endpoints:

```bash
# Health check
curl https://your-app-url.com/

# Test category endpoint
curl -X POST https://your-app-url.com/category \
  -H "Content-Type: application/json" \
  -d '{"category": "Water"}'

# Test caregiver search
curl -X POST https://your-app-url.com/caregiver/search \
  -H "Content-Type: application/json" \
  -d '{"category": "rehabilitation", "location": "SF"}'
```

---

## Scaling & Performance

### Recommended Settings

- **CPU:** 1-2 vCPUs
- **Memory:** 2GB RAM minimum
- **Instances:** 2-3 for high availability
- **Auto-scaling:** Based on CPU usage (>70%)

### Monitoring

Monitor these metrics:
- Response time for `/category` endpoint (should be <2s)
- Cognee memory operations success rate
- TTS generation time
- Caregiver search response time

---

## Troubleshooting

### Common Issues

**1. Cognee connection fails:**
```bash
# Verify Cognee credentials
curl -H "Authorization: Bearer $COGNEE_API_KEY" $COGNEE_BASE_URL/health
```

**2. Nebius API errors:**
```bash
# Test Nebius connection
curl -X POST https://api.tokenfactory.us-central1.nebius.com/v1/chat/completions \
  -H "Authorization: Bearer $NEBIUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "MiniMaxAI/MiniMax-M3", "messages": [{"role": "user", "content": "test"}]}'
```

**3. Text-to-speech not working:**
- Ensure `espeak` is installed in the container
- Check audio device availability
- Consider using cloud TTS (Google, AWS Polly) for production

---

## CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to InsForge

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to Butterbase
        env:
          BUTTERBASE_API_KEY: ${{ secrets.BUTTERBASE_API_KEY }}
        run: |
          butterbase deploy --app eyespeak-ai
```

---

## Support

For deployment issues:
- InsForge/Butterbase: https://butterbase.com/support
- EyeSpeak AI Backend: Check GitHub Issues

---

**Built for Bay Builders Hackathon 2026**
