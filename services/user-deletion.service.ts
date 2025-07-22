import { supabase } from './supabase';

export interface DeletionResult {
  success: boolean;
  user_id: string;
  tables_affected: string[];
  deleted_at: string;
}

export async function confirmUserDeletion(email: string, confirmationEmail: string): Promise<boolean> {
  if (email.toLowerCase() !== confirmationEmail.toLowerCase()) {
    throw new Error('Email confirmation does not match');
  }
  return true;
}

export async function deleteUserWithConfirmation(
  userId: string,
  userEmail: string,
  confirmationEmail: string
): Promise<DeletionResult> {
  // Verify confirmation
  await confirmUserDeletion(userEmail, confirmationEmail);

  // Call deletion function
  const { data, error } = await supabase.rpc('delete_user_completely', {
    user_uuid: userId
  });

  if (error) {
    throw error;
  }

  return data as DeletionResult;
}
