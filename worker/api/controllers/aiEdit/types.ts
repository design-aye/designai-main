export interface AiEditRequest {
    filePath: string;
    fileContent: string;
    selectionText?: string;
    instruction: string;
}

export interface AiEditData {
    editedContent: string;
}
