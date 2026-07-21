"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    try {
      const supabase = createClient();
      // Use global scope to clear all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        console.error('Error al cerrar sesión:', error);
      }

      // Force hard navigation to clear all state
      window.location.href = '/auth/login';
    } catch (err) {
      console.error('Exception al cerrar sesión:', err);
      window.location.href = '/auth/login';
    }
  };

  return <Button onClick={logout}>Logout</Button>;
}
