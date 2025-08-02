export interface DocumentMetadata {
  type: string;
  filename: string;
  uploadedAt: string;
}

export interface DownloadedFile {
  data: Buffer;
  contentType: string;
}

export type UserType = 'candidate' | 'employer';

export interface StorageProvider {
  uploadDocument(userType: UserType, uid: string, docType: string, file: Buffer, mimeType: string, filename: string): Promise<DocumentMetadata>;
  uploadMultiple?(userType: UserType, uid: string, docType: string, files: { buffer: Buffer; mimetype: string; originalname: string; }[]): Promise<DocumentMetadata[]>;
  downloadDocument(userType: UserType, uid: string, docType: string, filename: string): Promise<DownloadedFile>;
  listDocuments(userType: UserType, uid: string): Promise<DocumentMetadata[]>;
}
