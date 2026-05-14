-- migrations/0005_file_versioning.sql
-- Adds file persistence and version history (snapshots) for generated apps.

CREATE TABLE IF NOT EXISTS app_files (
    id          TEXT PRIMARY KEY,
    app_id      TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    file_path   TEXT NOT NULL,
    content     TEXT NOT NULL,
    size_bytes  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(app_id, file_path)
);

CREATE TABLE IF NOT EXISTS app_snapshots (
    id          TEXT PRIMARY KEY,
    app_id      TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    trigger     TEXT NOT NULL DEFAULT 'manual'
                    CHECK(trigger IN ('generation', 'deploy', 'manual', 'fork_source')),
    file_count  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS app_snapshot_files (
    id          TEXT PRIMARY KEY,
    snapshot_id TEXT NOT NULL REFERENCES app_snapshots(id) ON DELETE CASCADE,
    app_id      TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    file_path   TEXT NOT NULL,
    content     TEXT NOT NULL,
    size_bytes  INTEGER NOT NULL DEFAULT 0,
    UNIQUE(snapshot_id, file_path)
);

-- Indexes for app_files
CREATE INDEX IF NOT EXISTS app_files_app_idx
    ON app_files(app_id);

-- Indexes for app_snapshots
CREATE INDEX IF NOT EXISTS app_snapshots_app_idx
    ON app_snapshots(app_id);
CREATE INDEX IF NOT EXISTS app_snapshots_app_created_at_idx
    ON app_snapshots(app_id, created_at);

-- Indexes for app_snapshot_files
CREATE INDEX IF NOT EXISTS app_snapshot_files_snapshot_idx
    ON app_snapshot_files(snapshot_id);
CREATE INDEX IF NOT EXISTS app_snapshot_files_app_idx
    ON app_snapshot_files(app_id);
