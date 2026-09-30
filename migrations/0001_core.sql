CREATE TABLE IF NOT EXISTS jobs (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, actor_id TEXT NOT NULL, request TEXT NOT NULL,
 status TEXT NOT NULL, agent_id TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_tenant_created ON jobs(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS approvals (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, actor_id TEXT NOT NULL, tool_id TEXT NOT NULL,
 job_id TEXT, status TEXT NOT NULL CHECK(status IN ('pending','approved','denied','expired','consumed')),
 args_hash TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, decided_at INTEGER
);
CREATE INDEX IF NOT EXISTS approvals_scope ON approvals(tenant_id, actor_id, tool_id, status, expires_at);

CREATE TABLE IF NOT EXISTS audit_events (
 seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE, job_id TEXT, tenant_id TEXT,
 actor_id TEXT, type TEXT NOT NULL, data_json TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_created ON audit_events(created_at DESC);
