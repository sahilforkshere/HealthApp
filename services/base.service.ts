import { supabase } from './supabase';
import { DatabaseId } from '../types';

export class BaseService {
  protected static async getUserEntityId(tableName: string, userId: string): Promise<DatabaseId> {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error(`${tableName} record not found for user ${userId}`);
    }

    return Number(data.id);
  }

  protected static handleError(error: any, operation: string): never {
    console.error(`❌ ${operation} failed:`, error);
    throw new Error(`${operation} failed: ${error.message}`);
  }
}
