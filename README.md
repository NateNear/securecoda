# SecureCoda - Coda Security Monitoring & Remediation Platform

SecureCoda is a comprehensive security monitoring and automated remediation platform designed to identify and fix security vulnerabilities in Coda documents and workspaces. It continuously scans for unused documents, public sharing, external access, and sensitive data exposure.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Detection Rules](#detection-rules)
- [API Reference](#api-reference)
- [Development](#development)
- [Database Configuration](#database-configuration)
- [AI Tools & Development Process](#ai-tools--development-process)

---

## Quick Start

### Docker (Recommended)

Build and run the application in a single command:

```bash
# Build the Docker image
docker build -t securecoda .

# Run the container
docker run -p 3000:3000 --env-file .env securecoda
```

Then visit `http://localhost:3000` in your browser.

### Local Development

**Backend:**
```bash
npm install
npm run dev
```

**Frontend (in separate terminal):**
```bash
cd frontend
npm install
npm run dev
```

Backend will run on `http://localhost:3000` and frontend on `http://localhost:5173` (Vite dev server).

---

## Architecture

### High-Level Overview

The application uses a client-server architecture with three main layers:

1. **Frontend (React + Vite)** - Interactive dashboard for security monitoring
2. **Backend API (Express.js)** - REST API for alerts and remediation
3. **Coda Integration** - Real-time scanning of Coda documents

```
Frontend Dashboard → Backend API → Coda.io API
     (React)          (Express)    (External)
```

### Component Responsibilities

| Component | Responsibility |
|-----------|-----------------|
| **Frontend Dashboard** | React UI displaying alerts and remediation controls |
| **API Routes** | RESTful endpoints for `/alerts`, `/rescan`, `/remediate/:docId` |
| **Poller Service** | Orchestrates document scanning and detection |
| **Detection Service** | Analyzes security issues (unused docs, public sharing, sensitive data) |
| **Remediation Service** | Executes fixes (delete docs, remove permissions) |
| **Alert Store** | In-memory storage of current security alerts |
| **Coda Client** | API wrapper for Coda.io integration with error handling |

### Data Flow

1. **Scan Initiation** → Poller fetches all documents from Coda API
2. **Detection** → Analyzes documents for security issues
3. **Alert Generation** → Stores alerts in alertStore
4. **Display** → Frontend fetches and displays alerts every 5 seconds
5. **Remediation** → User clicks "Fix" → API calls remediation service → Alert removed

---

## Installation

### Prerequisites

- **Node.js** 18+ or **Docker**
- **Coda API Token** (from https://coda.io/account/settings)
- **.env file** with configuration

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd securecoda
```

### Step 2: Setup Environment

```bash
cp .env.example .env
```

Edit `.env` with your Coda credentials:

```env
CODA_API_TOKEN=your_token_here
CODA_DOC_ID=optional_doc_id
PORT=3000
MOCK_MODE=false
```

### Step 3: Install Dependencies

```bash
npm run install:all
```

### Step 4: Run Application

```bash
npm run dev
```

---

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CODA_API_TOKEN` | Your Coda.io API token | `pkce_...` |
| `CODA_DOC_ID` | Optional specific doc to monitor | `abcXYZ_doc` |
| `PORT` | Server port | `3000` |
| `MOCK_MODE` | Use mock data for testing | `false` |

### Getting Your Coda API Token

1. Go to https://coda.io/account/settings
2. Scroll to "API tokens"
3. Click "Generate API Token"
4. Add to `.env`

---

## Detection Rules

SecureCoda implements 5 core detection strategies:

### 1. Unused Documents (Severity: 5)

**Rule:** Documents not modified within threshold (default: 1.5 minutes testing / 90 days production)

**Logic:**
```javascript
const ageDays = (now - doc.updatedAt) / (1000 * 60 * 60 * 24);
if (ageDays > THRESHOLD) → UNUSED_DOCUMENT alert
```

**Why:** Forgotten documents may contain stale sensitive data

**Fix:** Delete the document

---

### 2. Public Documents (Severity: 9 - Critical)

**Rule:** Documents shared with anonymous viewers

**Logic:**
```javascript
if (permissions.find(p => p.principal?.type === "anonymousViewer")) 
  → PUBLIC_DOCUMENT alert
```

**Why:** Public documents expose data to anyone with the link

**Fix:** Remove anonymous viewer permission

---

### 3. External Domain Sharing (Severity: 8)

**Rule:** Documents shared with users outside your organization

**Logic:**
```javascript
if (externalEmail && !allowedDomains.includes(domain)) 
  → EXTERNAL_SHARE alert
```

**Why:** External users may pose data exfiltration risks

**Fix:** Restrict to internal domains only

---

### 4. Sensitive Data in Rows (Severity: 8)

**Rule:** Table rows containing sensitive keywords

**Keywords:** password, secret, card, ssn, token, key, credential

**Logic:**
```javascript
if (/(password|secret|card|ssn|token|key|credential)/i.test(rowData))
  → SENSITIVE_DATA_IN_ROW alert
```

**Why:** Credentials/PII in shared docs violate security best practices

**Fix:** Remove or mask sensitive data

---

### 5. Sensitive Text on Pages (Severity: 8)

**Rule:** Page HTML containing sensitive keywords

**Logic:**
```javascript
if (/(password|token|secret|apikey|credential)/i.test(html))
  → SENSITIVE_TEXT_ON_PAGE alert
```

**Why:** Published pages may accidentally expose secrets

**Fix:** Remove sensitive content from page

---

## API Reference

### GET /api/alerts

Returns all current security alerts.

**Response:**
```json
[
  {
    "docId": "doc1",
    "type": "PUBLIC_DOCUMENT",
    "severity": 9,
    "message": "Finance Sheet is shared publicly"
  }
]
```

---

### POST /api/rescan

Triggers a new security scan.

**Response:**
```json
{
  "message": "Scan complete"
}
```

---

### POST /api/remediate/:docId

Fixes a security issue.

**Request:**
```bash
POST /api/remediate/doc1
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted"
}
```

---

## Development

### Project Structure

```
securecoda/
├── src/
│   ├── app.js                    # Express server
│   ├── config/codaClient.js      # Coda API wrapper
│   ├── routes/api.js             # API endpoints
│   ├── services/
│   │   ├── alertStore.js         # Alert storage
│   │   ├── detectionService.js   # Detection logic
│   │   ├── poller.js             # Scan orchestration
│   │   └── remediationService.js # Remediation logic
│   └── utils/logger.js           # Logging
├── frontend/
│   ├── src/
│   │   ├── pages/Dashboard.jsx   # Main UI
│   │   ├── components/AlertCard.jsx
│   │   ├── api/codaApi.js        # Frontend API client
│   │   └── index.css             # Styles
│   ├── vite.config.js
│   └── package.json
├── Dockerfile                    # Multi-stage build
└── package.json
```

### Adding Detection Rules

1. Add logic to `src/services/detectionService.js`
2. Call from `src/services/poller.js`
3. Add alert to `alertStore`

Example:
```javascript
detectNewIssue(docs) {
  return docs.map(doc => ({
    docId: doc.id,
    type: "NEW_ALERT",
    severity: 7,
    message: "Description"
  }));
}
```

---

## Database Configuration

### Current Implementation

Alerts are stored **in-memory** in `alertStore.js`:

```javascript
const alertStore = {
  alerts: [],
  add(alerts) { this.alerts.push(...alerts); },
  list() { return this.alerts; },
  clear() { this.alerts = []; }
};
```

### For Production

Recommend persistent storage:

**Option 1: PostgreSQL**
```bash
npm install pg
```

**Option 2: MongoDB**
```bash
npm install mongoose
```

**Option 3: Redis**
```bash
npm install redis
```

**Recommended Setup:**
- Redis: Real-time alerts
- PostgreSQL: Historical audit trail
- MongoDB: Flexible scan results storage

---

## AI Tools & Development Process

### GitHub Copilot Usage

**Contributions:**

1. **Architecture Design**
   - Multi-tier architecture suggestion (API → Services → Config)
   - In-memory store for MVP
   - Modular service structure

2. **Code Generation**
   - Express routes boilerplate
   - Coda API client with error handling
   - Detection service with regex patterns
   - React components and hooks

3. **Frontend Development**
   - Vite configuration
   - Dashboard UI with polling
   - Responsive styling

4. **Docker Optimization**
   - Multi-stage build strategy
   - Alpine Linux optimization
   - Dependency caching

5. **Error Handling**
   - Try-catch blocks throughout
   - Fallback error responses
   - Comprehensive logging

### Development Workflow

1. Initial planning → Architecture design
2. Backend structure → API routes & services
3. Coda integration → API client with mocks
4. Frontend → React dashboard
5. Docker → Multi-stage production build
6. Documentation → Comprehensive README

### Key Benefits

- **Speed:** ~70% boilerplate auto-generated
- **Best Practices:** Node.js & React conventions
- **Error Handling:** Comprehensive error management
- **Scalability:** Architecture supports growth
- **Quality:** Clear, documented code

### Manual Enhancements

- Core detection rule logic
- Security considerations (API token handling)
- CommonJS compatibility
- UI/UX refinements
- Dockerfile production optimization

---

## Troubleshooting

### Docker Issues

**Port already in use:**
```bash
docker run -p 8080:3000 securecoda
```

**Build fails:**
```bash
docker build --no-cache -t securecoda .
```

### API Issues

**Can't reach /api/alerts:**
```bash
curl http://localhost:3000/api/alerts
```

**Coda API returns 401:**
- Verify `CODA_API_TOKEN` in `.env`
- Check token hasn't expired
- Generate new token at https://coda.io/account/settings

### Frontend Issues

**Blank page on http://localhost:3000:**
- Check frontend built to `public/` directory
- Verify backend serving static files
- Check browser console for errors

---

## Performance Considerations

- **Scan Frequency:** Consider periodic scheduling (cron jobs)
- **Alert Retention:** Implement cleanup policies
- **API Rate Limits:** Add backoff strategies
- **Frontend Polling:** WebSockets for production

---

## Future Enhancements

- [ ] WebSocket real-time updates
- [ ] User authentication & RBAC
- [ ] Alert historical analysis
- [ ] Automated remediation scheduling
- [ ] Slack/email notifications
- [ ] Custom detection rules UI
- [ ] Audit logging
- [ ] Multi-workspace support

---

## License

MIT License

---

**Last Updated:** December 2024  
**Version:** 0.1.0  
**Status:** Beta
