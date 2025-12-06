// supabase/functions/create-user/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Service Role Key ile admin yetkili client oluştur
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, firstName, lastName, roleId } = await req.json()

    // 1. Auth kullanıcısı oluştur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    })

    if (authError) throw authError

    // 2. Profil tablosunu güncelle (Trigger zaten oluşturabilir ama biz garantiye alalım ve rolü ekleyelim)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        first_name: firstName, 
        last_name: lastName,
        role_id: roleId 
      })
      .eq('id', authData.user.id)

    if (profileError) {
        // Profil güncellenemezse (örneğin trigger çalışmadıysa), manuel insert deneyelim
        await supabaseAdmin.from('profiles').upsert({
            id: authData.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            role_id: roleId
        })
    }

    return new Response(
      JSON.stringify(authData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})