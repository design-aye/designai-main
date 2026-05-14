import type { AppFile } from '../../../database/schema';

export interface FileUpsertData {
    file: AppFile;
}

export interface FileDeleteData {
    deleted: boolean;
    filePath: string;
}

export interface FilesListData {
    files: AppFile[];
}
