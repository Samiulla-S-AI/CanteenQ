import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  )

  if (req.method === "POST") {
    const payload = await req.json()
    const { data, type } = payload

    if (type === "user.created" || type === "user.updated") {
      const { id, email_addresses, first_name, last_name } = data
      const email = email_addresses[0]?.email_address

      const { error } = await supabase.from("users").upsert(
        {
          id: id,
          email: email,
          first_name: first_name,
          last_name: last_name,
        },
        { onConflict: "id" },
      )

      if (error) {
        console.error("Error upserting user:", error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(JSON.stringify({ message: "User synced successfully" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  return new Response("Not Found", { status: 404 })
})