import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export class StorageService {
  static async uploadFile(
    file: string,
    bucket: string,
    folder: string,
    fileName?: string
  ): Promise<string> {
    try {
      if (!file?.startsWith('file://')) {
        throw new Error('Invalid file URI');
      }

      const base64 = await FileSystem.readAsStringAsync(file, {
        encoding: 'base64',
      });

      const fileExt = file.split('.').pop() || 'png';
      const finalFileName = fileName || `${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${finalFileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: false
        });

      if (error) throw error;
      return data.path;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  static getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
