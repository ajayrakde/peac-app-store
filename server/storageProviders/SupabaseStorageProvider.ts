import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import type { StorageProvider, UserType, DocumentMetadata, DownloadedFile } from './StorageProvider.js';

export class SupabaseStorageProvider implements StorageProvider {
  private client: SupabaseClient;
  private candidateBucket: string;
  private employerBucket: string;

  constructor() {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not provided');
    }
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    this.candidateBucket = 'candidates';
    this.employerBucket = 'employers';
  }

  private bucket(type: UserType) {
    return type === 'candidate' ? this.candidateBucket : this.employerBucket;
  }

  private path(uid: string, docType: string, filename: string) {
    return `${uid}/${docType}/${filename}`;
  }

  async uploadDocument(userType: UserType, uid: string, docType: string, file: Buffer, mimeType: string, filename: string): Promise<DocumentMetadata> {
    const { error } = await this.client.storage
      .from(this.bucket(userType))
      .upload(this.path(uid, docType, filename), file, {
        contentType: mimeType,
        upsert: true,
      });
    if (error) throw new Error(error.message);
    return { type: docType, filename, uploadedAt: new Date().toISOString() };
  }

  async uploadMultiple(userType: UserType, uid: string, docType: string, files: { buffer: Buffer; mimetype: string; originalname: string; }[]): Promise<DocumentMetadata[]> {
    const results: DocumentMetadata[] = [];
    for (const f of files) {
      results.push(await this.uploadDocument(userType, uid, docType, f.buffer, f.mimetype, f.originalname));
    }
    return results;
  }

  async downloadDocument(userType: UserType, uid: string, docType: string, filename: string): Promise<DownloadedFile> {
    const { data, error } = await this.client.storage
      .from(this.bucket(userType))
      .download(this.path(uid, docType, filename));
    if (error || !data) throw new Error('Document not found');
    const buffer = Buffer.from(await data.arrayBuffer());
    const contentType = data.type || 'application/octet-stream';
    return { data: buffer, contentType };
  }

  async listDocuments(userType: UserType, uid: string): Promise<DocumentMetadata[]> {
    const bucket = this.bucket(userType);
    const docTypes = userType === 'candidate'
      ? ['aadhar', 'pan', 'resume', 'certificates']
      : ['registration', 'gst'];
    const results: DocumentMetadata[] = [];
    for (const docType of docTypes) {
      const { data, error } = await this.client.storage.from(bucket).list(`${uid}/${docType}`);
      if (error) continue;
      for (const item of data ?? []) {
        if (item.name.endsWith('/')) continue;
        results.push({ type: docType, filename: item.name, uploadedAt: item.updated_at || '' });
      }
    }
    return results;
  }
}
