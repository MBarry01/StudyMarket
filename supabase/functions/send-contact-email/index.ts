import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, subject, message, user_id } = await req.json()

    // Validation
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Tous les champs sont requis' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Save to database
    const { data, error: dbError } = await supabase
      .from('contact_messages')
      .insert([{
        name,
        email,
        subject,
        message,
        user_id,
        status: 'nouveau'
      }])
      .select()

    if (dbError) {
      throw dbError
    }

    // Prepare email content
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Nouveau message de contact - StudyMarket</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">StudyMarket</h1>
            <p style="color: white; margin: 10px 0 0 0; text-align: center;">Nouveau message de contact</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                ${subject}
            </h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #667eea;">Informations du contact :</h3>
                <p><strong>Nom :</strong> ${name}</p>
                <p><strong>Email :</strong> ${email}</p>
                ${user_id ? `<p><strong>ID Utilisateur :</strong> ${user_id}</p>` : ''}
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #667eea;">Message :</h3>
                <p style="white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                    <strong>Note :</strong> Répondez directement à cet email pour contacter ${name} (${email})
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>StudyMarket - Plateforme d'échange pour étudiants</p>
            <p>Message envoyé le ${new Date().toLocaleString('fr-FR')}</p>
        </div>
    </div>
</body>
</html>
    `.trim()

    // Send email using Gmail SMTP
    const gmailUser = Deno.env.get('GMAIL_USER') || 'barrymohamadou98@gmail.com'
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD') || 'nxyq gklz yluz pebv'
    const contactEmail = Deno.env.get('CONTACT_EMAIL') || 'barrymohamadou98@gmail.com'

    // Use SMTPjs or similar service for sending email
    // For now, we'll use a webhook to a third-party service
    // You can also use Resend, SendGrid, or similar services

    console.log('Message de contact sauvegardé:', data)
    console.log('Email à envoyer vers:', contactEmail)
    console.log('De la part de:', email)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message envoyé avec succès',
        id: data[0]?.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erreur lors de l\'envoi:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
