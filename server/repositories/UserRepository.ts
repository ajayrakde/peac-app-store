import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '@shared/schema';
import type { InsertUser } from '@shared/types';

/**
 * Repository for handling user-related database operations
 */
export class UserRepository {
  /**
   * Find a user by their Firebase UID
   */
  static async findByFirebaseUid(firebaseUid: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);
    
    return user;
  }

  /**
   * Find a user by their email address
   */
  static async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return user;
  }

  /**
   * Create a new user
   */
  static async create(data: InsertUser) {
    const [user] = (await db
      .insert(users)
      .values(data)
      .returning()) as any[];
    
    return user;
  }

  /**
   * Update a user by their ID
   */
  static async update(id: number, data: Partial<InsertUser>) {
    const [updated] = (await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()) as any[];
    
    return updated;
  }

  /**
   * Find a user by their ID
   */
  static async findById(id: number) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return user;
  }
}
