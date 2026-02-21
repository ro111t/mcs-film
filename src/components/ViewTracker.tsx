"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ViewTracker({ profileId }: { profileId: string }) {
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Don't count self-views
      if (user?.id === profileId) return;

      await supabase.from("profile_views").insert({
        profile_id: profileId,
        viewer_id: user?.id || null,
        referrer: document.referrer || "",
        user_agent: navigator.userAgent || "",
      });
    })();
  }, [profileId]);

  return null;
}
