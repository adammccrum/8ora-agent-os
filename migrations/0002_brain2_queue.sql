-- Brain 2 durable, tenant-scoped scheduled work. Apply to development D1 only.
CREATE TABLE IF NOT EXISTS brain2_queue (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 actor_id TEXT NOT NULL,
 pipeline TEXT NOT NULL CHECK(pipeline IN ('iriskey','8ora','internal')),
 agent_id TEXT NOT NULL,
 task_json TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','leased','completed','failed','awaiting-approval','dead')),
 attempts INTEGER NOT NULL DEFAULT 0,
 max_attempts INTEGER NOT NULL DEFAULT 3,
 due_at INTEGER NOT NULL,
 lease_until INTEGER,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 last_error TEXT
);
CREATE INDEX IF NOT EXISTS brain2_queue_due ON brain2_queue(status,due_at);
CREATE INDEX IF NOT EXISTS brain2_queue_tenant ON brain2_queue(tenant_id,pipeline,status);
CREATE TABLE IF NOT EXISTS brain2_memory (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 pipeline TEXT NOT NULL CHECK(pipeline IN ('iriskey','8ora','internal')),
 namespace TEXT NOT NULL,
 key TEXT NOT NULL,
 value_json TEXT NOT NULL,
 updated_at INTEGER NOT NULL,
 UNIQUE(tenant_id,pipeline,namespace,key)
);
CREATE TABLE IF NOT EXISTS brain2_runs (
 id TEXT PRIMARY KEY,
 queue_id TEXT NOT NULL,
 tenant_id TEXT NOT NULL,
 started_at INTEGER NOT NULL,
 finished_at INTEGER,
 outcome TEXT NOT NULL,
 details_json TEXT NOT NULL,
 FOREIGN KEY(queue_id) REFERENCES brain2_queue(id)
);
CREATE INDEX IF NOT EXISTS brain2_runs_queue ON brain2_runs(queue_id,started_at);
