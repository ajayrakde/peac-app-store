import type { StorageProvider, UserType, DocumentMetadata, DownloadedFile } from './StorageProvider.js';

export class FirebaseStorageProvider implements StorageProvider {
  // Stub implementation for future Firebase Storage support
  async uploadDocument(_userType: UserType, _uid: string, _docType: string, _file: Buffer, _mimeType: string, _filename: string): Promise<DocumentMetadata> {
    throw new Error('FirebaseStorageProvider.uploadDocument not implemented');
  }

  async uploadMultiple(_userType: UserType, _uid: string, _docType: string, _files: { buffer: Buffer; mimetype: string; originalname: string; }[]): Promise<DocumentMetadata[]> {
    throw new Error('FirebaseStorageProvider.uploadMultiple not implemented');
  }

  async downloadDocument(_userType: UserType, _uid: string, _docType: string, _filename: string): Promise<DownloadedFile> {
    throw new Error('FirebaseStorageProvider.downloadDocument not implemented');
  }

  async listDocuments(_userType: UserType, _uid: string): Promise<DocumentMetadata[]> {
    throw new Error('FirebaseStorageProvider.listDocuments not implemented');
  }
}
