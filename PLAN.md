# MarkLogic Grafana Data Source - Implementation Plan

## Executive Summary

This plan outlines the development of a Grafana data source plugin that connects to MarkLogic to query **meters** (time-series metrics) for monitoring dashboards, with future extensibility for **logs**. The plugin will enable Grafana to visualize MarkLogic-backed operational and application metrics.

---

## 1. Architecture Overview

### 1.1 Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        Grafana Dashboard                         │
├─────────────────────────────────────────────────────────────────┤
│  MarkLogic Data Source Plugin                                    │
│  ├── DataSourceApi (core query execution)                        │
│  ├── Query Editor (meters / logs query builder)                  │
│  ├── Config Editor (connection, auth, defaults)                 │
│  └── Variable Support (for template variables)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MarkLogic Server                              │
│  ├── Management API /manage/v2/servers/{id}/metrics/meters       │
│  │   (Meters API - server health & performance metrics)          │
│  ├── REST API /v1/search  (Search API - for logs, if needed)     │
│  └── REST API /v1/rows    (Optic API - for custom metrics)       │
└─────────────────────────────────────────────────────────────────┘
```

**Meters API Reference:** [https://docs.marklogic.com/REST/management/meters](https://docs.marklogic.com/REST/management/meters)

### 1.2 Technology Stack

| Layer | Technology |
|-------|------------|
| Plugin Framework | Grafana Plugin SDK (@grafana/data, @grafana/ui) |
| Language | TypeScript |
| UI | React (via Grafana UI components) |
| Build | Grafana toolkit / esbuild |
| MarkLogic Client | REST API (fetch/axios) – no native Node SDK in browser |

---

## 2. Phase 1: Foundation (Weeks 1–2)

### 2.1 Project Setup

- [ ] **Scaffold plugin** using `@grafana/create-plugin` or manual setup
  - Standard structure: `src/`, `package.json`, `tsconfig.json`, `plugin.json`
- [ ] **Define plugin metadata** in `plugin.json`:
  - Type: `datasource`
  - ID: `grafana-marklogic-datasource`
  - Capabilities: `metrics`, `logs` (when ready)
- [ ] **Configure build** (Grafana toolkit or esbuild) for dev and prod
- [ ] **Add basic README** with setup and run instructions

### 2.2 Data Source Configuration

- [ ] **Config Editor** for:
  - **Base URL** (e.g., `https://marklogic-host:8002` for Management API; port 8002 is typical for manage)
  - **Authentication**: Digest Auth (required for Management API; Basic not supported)
  - **TLS / SSL**: options for self-signed certs (common with Docker/local dev)
  - **Server ID** (optional): target specific host in cluster; default to local
- [ ] **Health check**: Call Management API (e.g., `/manage/v2`) to validate connection on save
- [ ] **Secure credentials** handling (Grafana secure storage)

### 2.3 Core Data Source API

- [ ] Implement `DataSourceApi` interface (`query()`, `testDatasource()`)
- [ ] Implement `getResource()` for variable queries (later phase)
- [ ] Basic error handling and connection failure messages

---

## 3. Phase 2: Meters / Metrics Support (Weeks 3–5)

### 3.1 Management Meters API

Meters are provided by the **MarkLogic Management API** ([docs](https://docs.marklogic.com/REST/management/meters)), which exposes built-in server health and performance metrics (request rates, cache stats, disk I/O, etc.). This is not document querying—it is live telemetry from the MarkLogic cluster.

- **Endpoint pattern**: `GET /manage/v2/servers/{server-id}/metrics/meters`
- **Response**: JSON structure with meter names and values (exact format per API docs)
- **Auth**: Digest Authentication (Management API requirement)
- **Port**: Management API typically runs on **8002** (manage app server)

### 3.2 Query Editor for Meters

- [ ] **Query type selector**: "Meters" (and later "Logs")
- [ ] **Meters query options**:
  - **Server ID** (or use default from config; e.g., `Admin`, `Manage`, or app server name)
  - **Meter name / pattern** (filter which meters to retrieve, e.g., `requests`, `*cache*`)
  - **Group** (if API supports grouping; e.g., by host in cluster)
- [ ] **Time handling**: Management API returns current snapshot; use Grafana refresh interval for time-series. Optionally poll and store last-N samples in plugin for simple trend views.
- [ ] **Query preview** (optional): show request URL before run

### 3.3 Query Execution for Meters

- [ ] **Call Management Meters API**: `GET /manage/v2/servers/{id}/metrics/meters`
- [ ] **Parse response** per [API documentation](https://docs.marklogic.com/REST/management/meters)
- [ ] **Transform** → Grafana `DataFrame` (time series or table format):
  - Single snapshot: use query execution time as timestamp; suitable for Stat/Gauge
  - For time-series: either (a) rely on Grafana refresh + last value, or (b) implement client-side buffering of recent samples
- [ ] **Map meter names** → panel-friendly labels (e.g., `expanded-tree-cache-hits` → "Expanded Tree Cache Hits")

### 3.4 Visualization Support

- [ ] Ensure output works with **Time series** panels (if implementing sample buffering)
- [ ] Ensure output works with **Stat** and **Gauge** panels (primary use case for snapshot API)
- [ ] Support **Table** panel for multi-metric comparison (all meters in one table)
- [ ] Handle **multiple queries** per panel (e.g., different servers or meter filters)

---

## 4. Phase 3: Logs Support (Weeks 6–8)

### 4.1 Log Data Model Assumptions

Log documents typically include:

- **Timestamp**
- **Level** (info, warn, error, debug)
- **Message** (text)
- **Optional fields** (host, service, traceId, etc.)

### 4.2 Query Editor for Logs

- [ ] **Logs query options**:
  - Collection / directory
  - Level filter
  - Full-text or structured filters
  - Time range
  - Limit (e.g., 1000 lines)
- [ ] **Live tail** support (optional): streaming logs via MarkLogic if available

### 4.3 Query Execution for Logs

- [ ] Use **Search API** or **Optic** to fetch log documents
- [ ] **Transform** → Grafana **Logs DataFrame** format:
  - `time` (nanoseconds since epoch)
  - `level` (string)
  - `message` (string)
  - Labels for metadata fields

### 4.4 Visualization Support

- [ ] Compatible with **Logs** panel
- [ ] Optional: **Loki-style** log volume histogram (if supported by Grafana version)

---

## 5. Phase 4: Advanced Features (Weeks 9–10)

### 5.1 Template Variables

- [ ] **Variable query type**: e.g., list server IDs, meter names (from Meters API response)
- [ ] Implement `getResource()` for ad-hoc variable queries
- [ ] Support `$variable` substitution in query editor

### 5.2 Annotations (Optional)

- [ ] Support **annotation queries** for events (e.g., deployments, incidents)
- [ ] Map MarkLogic events to Grafana annotation format

### 5.3 Caching & Performance

- [ ] Respect Grafana **query cache** settings
- [ ] Consider **query timeout** configuration for Management API calls
- [ ] Document recommended **refresh intervals** for meters (snapshot API benefits from shorter refresh)

---

## 6. MarkLogic-Side Considerations

### 6.1 Meters API Setup

- **Management API**: Enabled by default; runs on manage app server (port 8002)
- **Authentication**: User must have `manage-user` or equivalent role for Meters API
- **Cluster**: For multi-node clusters, specify server ID or use host-specific URLs to target individual nodes

### 6.2 Logs (Future Phase)

Logs will likely come from a different source—e.g., MarkLogic ErrorLog, AccessLog, or document storage—not the Meters API. Query patterns (Search API, Optic) remain relevant for logs.

### 6.3 Local Testing with Docker

Use the official MarkLogic image for local development and integration testing:

```bash
docker run -d \
  --name marklogic \
  -p 8000:8000 \
  -p 8001:8001 \
  -p 8002:8002 \
  -e MARKLOGIC_INIT=true \
  -e MARKLOGIC_ADMIN_USERNAME=admin \
  -e MARKLOGIC_ADMIN_PASSWORD=admin \
  progressofficial/marklogic-db
```

- **Port 8000**: REST API (app server)
- **Port 8001**: REST API (alternative)
- **Port 8002**: Management API (Meters API endpoint)

**Meters API test URL**: `http://localhost:8002/manage/v2/servers/Admin/properties` (or `/metrics/meters` once server is initialized)

**Note**: MarkLogic can take a few minutes to initialize. Wait for healthy status before running plugin tests. Use `admin`/`admin` for dev only; use strong credentials in production.

---

## 7. Testing Strategy

- [ ] **Unit tests**: Query builder logic, response transformation (mock Meters API JSON)
- [ ] **Integration tests**: Mock MarkLogic Management API HTTP responses
- [ ] **E2E with Docker**: Grafana + plugin + `progressofficial/marklogic-db` container (see §6.3)
- [ ] **Manual QA**: Dashboards with Time series, Logs, Stat panels against local MarkLogic

---

## 8. Documentation & Delivery

- [ ] **README**: Install, config, example queries
- [ ] **Changelog**: Version history
- [ ] **Example dashboards**: JSON exports for meters and logs
- [ ] **Plugin signing**: For Grafana.com publication (optional)

---

## 9. Risk & Mitigation

| Risk | Mitigation |
|------|-------------|
| MarkLogic Digest Auth complexity | Use fetch with `digest-auth` or similar; document cert setup for TLS |
| Meters API returns snapshots, not history | Use Grafana refresh for near-real-time; document limitation for long-term trends |
| Grafana SDK changes | Pin versions; follow Grafana upgrade guides |
| Docker ML startup time | Document wait-for-ready; add retry in health check |

---

## 10. Suggested Milestones

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| M1 | Week 2 | Configurable plugin, passes `testDatasource()` |
| M2 | Week 5 | Meters queryable, Time series panels work |
| M3 | Week 8 | Logs queryable, Logs panel works |
| M4 | Week 10 | Variables, documentation, example dashboards |

---

## Next Steps

1. **Review Meters API response format**: Inspect actual JSON from [Management Meters API](https://docs.marklogic.com/REST/management/meters) to implement correct transformation
2. **Run Docker MarkLogic**: `docker run ... progressofficial/marklogic-db` and verify Meters API accessibility on port 8002
3. **Confirm server IDs**: List available servers (e.g., Admin, Manage) for the Meters endpoint path
4. **Kick off Phase 1**: Scaffold plugin and implement config editor with Digest Auth

---

*This plan is intended for review and refinement. Adjust timeline and scope based on team capacity and MarkLogic environment specifics.*
