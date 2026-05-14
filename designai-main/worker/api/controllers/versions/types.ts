/**
 * Type definitions for the version history and fork controllers.
 */

import type { App, AppSnapshot, AppSnapshotFile } from '../../../database/schema';

export interface SnapshotListData {
    snapshots: AppSnapshot[];
}

export interface SnapshotDetailData {
    snapshot: AppSnapshot;
    files: AppSnapshotFile[];
}

export interface SnapshotCreateData {
    snapshot: AppSnapshot;
}

export interface SnapshotRestoreData {
    snapshot: AppSnapshot;
    fileCount: number;
}

export interface ForkAppData {
    app: App;
    message: string;
}
