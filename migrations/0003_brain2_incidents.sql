-- Durable incident inbox; no direct ChatGPT transport or phone delivery is implied.
CREATE TABLE IF NOT EXISTS brain2_incidents (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 pipeline TEXT NOT NULL CHECK(pipeline IN ('iriskey','8ora','internal')),
 queue_id TEXT,
 fingerprint TEXT NOT NULL,
 severity TEXT NOT NULL CHECK(severity IN ('warning','critical')),
 category TEXT NOT NULL,
 summary TEXT NOT NULL,
 details_json TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved')),
 occurrences INTEGER NOT NULL DEFAULT 1,
 first_seen_at INTEGER NOT NULL,
 last_seen_at INTEGER NOT NULL,
 acknowledged_at INTEGER,
 resolved_at INTEGER,
 UNIQUE(tenant_id,pipeline,fingerprint)
);
CREATE INDEX IF NOT EXISTS brain2_incidents_open ON brain2_incidents(tenant_id,status,severity,last_seen_at);
