# MarkLogic Grafana Data Source

A Grafana data source plugin for querying MarkLogic server metrics via the [Management Meters API](https://docs.marklogic.com/REST/management/meters).

## Features

- **Meters**: Query MarkLogic Management API metrics (request rates, cache stats, etc.)
- **Digest Authentication**: Supports MarkLogic's Digest auth
- **Configurable**: Server ID, meter pattern filter, TLS options

## Installation

### From source

```bash
npm install
npm run build
```

The built plugin will be in the `dist/` directory. Link or copy it to your Grafana plugins directory:

```bash
# Linux / Mac
ln -s $(pwd)/dist /var/lib/grafana/plugins/grafana-marklogic-datasource

# Or copy
cp -r dist /var/lib/grafana/plugins/grafana-marklogic-datasource
```

### Development

```bash
npm run dev
```

## Configuration

1. Add a new data source in Grafana and select **MarkLogic**
2. **URL**: Management API base URL (e.g. `http://localhost:8002`)
3. **Default Server ID**: e.g. `Admin`, `Manage`, or your app server name
4. **Username / Password**: MarkLogic credentials with `manage-user` role
5. **TLS Skip Verify**: Enable for self-signed certs (dev only)

## Testing with Docker

Run MarkLogic locally:

```bash
docker run -d \
  --name marklogic \
  -p 8000:8000 -p 8001:8001 -p 8002:8002 \
  -e MARKLOGIC_INIT=true \
  -e MARKLOGIC_ADMIN_USERNAME=admin \
  -e MARKLOGIC_ADMIN_PASSWORD=admin \
  progressofficial/marklogic-db
```

Wait a few minutes for MarkLogic to initialize, then configure the data source with:

- URL: `http://localhost:8002`
- Username: `admin`
- Password: `admin`
- Server ID: `Admin`

## Query Editor

- **Server ID**: Override the default server for this query
- **Meter pattern**: Filter meters by name (supports `*` wildcard, e.g. `*cache*`, `requests`)

## Panels

The plugin returns metrics as a table/time series. Use **Stat**, **Gauge**, or **Table** panels to visualize. Set a short refresh interval (e.g. 5s) since the Meters API returns current snapshots.

## License

MIT
