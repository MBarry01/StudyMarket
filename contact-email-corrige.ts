import { createTransport } from "npm:nodemailer@6.9.7";

// Configuration CORS compatible avec Supabase
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-client-version, x-client-name',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Vérification de la méthode POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Méthode non autorisée'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Parse du payload
    const payload = await req.json();
    const { name, email, subject, message } = payload;

    // Validation des données
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({
        error: 'Tous les champs sont requis'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Configuration du transporteur email
    const transporter = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: Deno.env.get("GMAIL_USER"),
        pass: Deno.env.get("GMAIL_APP_PASSWORD")
      }
    });

    // Template email HTML
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>📨 Nouveau Message de Contact - StudyMarket</h2>
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email de réponse:</strong> ${email}</p>
        <p><strong>Sujet:</strong> ${subject}</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">
          <strong>Message:</strong>
          <p>${message}</p>
        </div>
        <small>Reçu le: ${new Date().toLocaleString('fr-FR')}</small>
      </div>
    `;

    // Envoi de l'email
    await transporter.sendMail({
      from: `"StudyMarket Contact" <${Deno.env.get("GMAIL_USER")}>`,
      to: Deno.env.get("CONTACT_EMAIL"),
      replyTo: email,
      subject: `Nouveau message : ${subject}`,
      html: htmlContent
    });

    // Réponse de succès
    return new Response(JSON.stringify({
      success: true,
      message: 'Votre message a été envoyé avec succès !'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return new Response(JSON.stringify({
      error: 'Échec de l\'envoi du message',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
