import { supabase } from './supabase';

export async function signIn(pin: string) {
  try {
    const { data: verified, error: verifyError } = await supabase
      .rpc('verify_pin', { input_pin: pin });

    if (verifyError) throw verifyError;
    if (!verified) throw new Error('Invalid PIN');

    // Store auth state in localStorage
    localStorage.setItem('isAuthenticated', 'true');
    return true;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

export async function signOut() {
  localStorage.removeItem('isAuthenticated');
}

export async function getSession() {
  return localStorage.getItem('isAuthenticated') === 'true';
}