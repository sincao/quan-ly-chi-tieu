import { createClient } from '@/lib/supabase/client';

export async function loginWithEmail(email: string, pass: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  return { data, error };
}

export async function signupWithEmail(email: string, pass: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/settings/security`,
  });
  return { data, error };
}

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}
