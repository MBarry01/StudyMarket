import { createTransport } from "npm:nodemailer@6.9.7";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { name, email, subject, message, user_id } = payload;

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

    // Initialize Supabase client pour sauvegarder le message
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Sauvegarder le message dans la base de données
    const { data: dbData, error: dbError } = await supabase.from('contact_logs').insert([
      {
        name,
        email,
        subject,
        message
      }
    ]).select();

    if (dbError) {
      console.error('Erreur sauvegarde DB:', dbError);
      throw new Error('Erreur lors de la sauvegarde du message');
    }

    console.log('Message sauvegardé avec ID:', dbData[0]?.id);

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

    // Template email HTML avec style moderne
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau Message - StudyMarket</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f7fa;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px;
        }
        .info-card {
            background: #f8f9ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .info-card h3 {
            margin: 0 0 15px 0;
            color: #667eea;
            font-size: 18px;
        }
        .info-item {
            margin: 10px 0;
            display: flex;
            align-items: center;
        }
        .info-item strong {
            color: #333;
            min-width: 80px;
            margin-right: 10px;
        }
        .info-item span {
            color: #666;
        }
        .message-card {
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .message-card h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
        }
        .message-text {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #667eea;
            white-space: pre-wrap;
            font-family: inherit;
            line-height: 1.6;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e1e5e9;
        }
        .footer p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            margin-left: 10px;
        }
        .reply-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 StudyMarket</h1>
            <p>Nouveau message de contact</p>
        </div>
        
        <div class="content">
            <div class="info-card">
                <h3>📋 Informations du contact</h3>
                <div class="info-item">
                    <strong>Nom:</strong>
                    <span>${name}</span>
                </div>
                <div class="info-item">
                    <strong>Email:</strong>
                    <span>${email}</span>
                    <span class="badge">Répondre ici</span>
                </div>
                <div class="info-item">
                    <strong>Sujet:</strong>
                    <span>${subject}</span>
                </div>
                <div class="info-item">
                    <strong>ID:</strong>
                    <span>#${dbData[0]?.id}</span>
                </div>
            </div>
            
            <div class="message-card">
                <h3>💬 Message</h3>
                <div class="message-text">${message}</div>
            </div>
            
            <div style="text-align: center;">
                <a href="mailto:${email}?subject=Re: ${subject}" class="reply-button">
                    📧 Répondre directement
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>StudyMarket</strong> - Plateforme d'échange pour étudiants</p>
            <p>Message reçu le ${new Date().toLocaleString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
            <p style="font-size: 12px; color: #999;">
                Cet email a été envoyé automatiquement depuis le chatbot StudyMarket
            </p>
        </div>
    </div>
</body>
</html>
    `;

    // Envoi de l'email
    await transporter.sendMail({
      from: `"StudyMarket Contact" <${Deno.env.get("GMAIL_USER")}>`,
      to: Deno.env.get("CONTACT_EMAIL"),
      replyTo: email,
      subject: `📚 Nouveau message : ${subject}`,
      html: htmlContent
    });

    console.log('Email envoyé avec succès');

    // Réponse de succès
    return new Response(JSON.stringify({
      success: true,
      message: 'Votre message a été envoyé avec succès !',
      id: dbData[0]?.id
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
