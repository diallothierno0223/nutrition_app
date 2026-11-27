// Réglages des notifications (heure et activation de chacune), dans la ligne Réglages du compte.
import { lireReglagesDesNotifications, type ReglagesDesNotifications } from "@noyau";

import { supabase } from "@/lib/supabase";
import { lectureEnCache } from "@/synchro/synchro";

export async function chargerReglagesDesNotifications(): Promise<ReglagesDesNotifications> {
  return lectureEnCache("reglages-notifications", async () => {
    const { data, error } = await supabase.from("reglages").select("notifications").single();
    if (error) throw error;
    return lireReglagesDesNotifications(data.notifications);
  });
}

export async function enregistrerReglagesDesNotifications(reglages: ReglagesDesNotifications): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Session requise");
  const { error } = await supabase.from("reglages").update({ notifications: reglages }).eq("user_id", userId);
  if (error) throw error;
}
