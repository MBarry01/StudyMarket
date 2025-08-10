import { sendEmailVerification, ActionCodeSettings } from 'firebase/auth';
import { User as FirebaseUser } from 'firebase/auth';

// Interface pour les paramètres d'email
interface EmailVerificationParams {
  user: FirebaseUser;
  actionCodeSettings?: ActionCodeSettings;
  fallbackService?: 'resend' | 'gmail' | 'supabase';
}

// Service principal d'envoi d'emails de vérification
export class EmailService {
  private static instance: EmailService;
  private fallbackEnabled: boolean = false;
  private fallbackService: 'resend' | 'gmail' | 'supabase' = 'resend';

  private constructor() {
    // Vérifier si un service de fallback est configuré
    this.checkFallbackAvailability();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Vérifier la disponibilité des services de fallback
  private async checkFallbackAvailability(): Promise<void> {
    try {
      // Vérifier Resend
      if (import.meta.env.VITE_RESEND_API_KEY) {
        this.fallbackEnabled = true;
        this.fallbackService = 'resend';
        console.log('✅ Service de fallback Resend disponible');
        return;
      }

      // Vérifier Supabase
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        this.fallbackEnabled = true;
        this.fallbackService = 'supabase';
        console.log('✅ Service de fallback Supabase disponible');
        return;
      }

      // Vérifier Gmail
      if (import.meta.env.VITE_GMAIL_USER && import.meta.env.VITE_GMAIL_APP_PASSWORD) {
        this.fallbackEnabled = true;
        this.fallbackService = 'gmail';
        console.log('✅ Service de fallback Gmail disponible');
        return;
      }

      console.log('⚠️ Aucun service de fallback configuré');
    } catch (error) {
      console.error('Erreur lors de la vérification des services de fallback:', error);
    }
  }

  // Envoyer un email de vérification
  public async sendVerificationEmail(params: EmailVerificationParams): Promise<boolean> {
    const { user, actionCodeSettings } = params;

    try {
      // Essayer d'abord Firebase
      console.log('📧 Tentative d\'envoi via Firebase...');
      await sendEmailVerification(user, actionCodeSettings);
      console.log('✅ Email de vérification envoyé via Firebase');
      return true;
    } catch (firebaseError) {
      console.warn('⚠️ Firebase a échoué, tentative via service de fallback...', firebaseError);
      
      // Si Firebase échoue et qu'un fallback est disponible
      if (this.fallbackEnabled) {
        return await this.sendFallbackEmail(user, actionCodeSettings);
      }
      
      throw firebaseError;
    }
  }

  // Envoyer un email via le service de fallback
  private async sendFallbackEmail(user: FirebaseUser, actionCodeSettings?: ActionCodeSettings): Promise<boolean> {
    try {
      switch (this.fallbackService) {
        case 'resend':
          return await this.sendViaResend(user, actionCodeSettings);
        case 'supabase':
          return await this.sendViaSupabase(user, actionCodeSettings);
        case 'gmail':
          return await this.sendViaGmail(user, actionCodeSettings);
        default:
          throw new Error('Service de fallback non configuré');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi via le service de fallback:', error);
      throw error;
    }
  }

  // Envoyer via Resend
  private async sendViaResend(user: FirebaseUser, actionCodeSettings?: ActionCodeSettings): Promise<boolean> {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Clé API Resend non configurée');
    }

    const verificationUrl = actionCodeSettings?.url || `${window.location.origin}/auth`;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'StudyMarket <noreply@studymarket.fr>',
        to: user.email!,
        subject: 'Vérifiez votre email - StudyMarket',
        html: this.generateVerificationEmailHTML(user, verificationUrl),
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur Resend: ${response.statusText}`);
    }

    console.log('✅ Email de vérification envoyé via Resend');
    return true;
  }

  // Envoyer via Supabase
  private async sendViaSupabase(user: FirebaseUser, actionCodeSettings?: ActionCodeSettings): Promise<boolean> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuration Supabase manquante');
    }

    const verificationUrl = actionCodeSettings?.url || `${window.location.origin}/auth`;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-verification-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        verificationUrl,
        displayName: user.displayName || 'Utilisateur',
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur Supabase: ${response.statusText}`);
    }

    console.log('✅ Email de vérification envoyé via Supabase');
    return true;
  }

  // Envoyer via Gmail
  private async sendViaGmail(user: FirebaseUser, actionCodeSettings?: ActionCodeSettings): Promise<boolean> {
    const gmailUser = import.meta.env.VITE_GMAIL_USER;
    const gmailPassword = import.meta.env.VITE_GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !gmailPassword) {
      throw new Error('Configuration Gmail manquante');
    }

    // Utiliser un service proxy pour Gmail (car CORS)
    const verificationUrl = actionCodeSettings?.url || `${window.location.origin}/auth`;
    
    const response = await fetch('/api/send-gmail-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        verificationUrl,
        displayName: user.displayName || 'Utilisateur',
        gmailUser,
        gmailPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur Gmail: ${response.statusText}`);
    }

    console.log('✅ Email de vérification envoyé via Gmail');
    return true;
  }

  // Générer le HTML de l'email de vérification
  private generateVerificationEmailHTML(user: FirebaseUser, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérifiez votre email - StudyMarket</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 StudyMarket</h1>
            <p>Vérifiez votre adresse email</p>
          </div>
          <div class="content">
            <h2>Bonjour ${user.displayName || 'Étudiant'} !</h2>
            <p>Merci de vous être inscrit sur StudyMarket, la plateforme d'échange entre étudiants.</p>
            <p>Pour activer votre compte et commencer à utiliser StudyMarket, veuillez cliquer sur le bouton ci-dessous :</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">✅ Vérifier mon email</a>
            </div>
            
            <p><strong>Important :</strong> Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte sur StudyMarket, vous pouvez ignorer cet email.</p>
            
            <p>Une fois votre email vérifié, vous pourrez :</p>
            <ul>
              <li>📚 Publier des annonces de cours et matériel</li>
              <li>💬 Échanger avec d'autres étudiants</li>
              <li>🔄 Acheter, vendre ou donner des ressources</li>
              <li>⭐ Bâtir votre réputation sur la plateforme</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2024 StudyMarket - Tous droits réservés</p>
            <p>Si le bouton ne fonctionne pas, copiez ce lien : <a href="${verificationUrl}">${verificationUrl}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Vérifier le statut de l'email
  public async checkEmailVerificationStatus(user: FirebaseUser): Promise<boolean> {
    try {
      await user.reload();
      return user.emailVerified;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut email:', error);
      return false;
    }
  }

  // Renvoyer un email de vérification
  public async resendVerificationEmail(user: FirebaseUser, actionCodeSettings?: ActionCodeSettings): Promise<boolean> {
    return this.sendVerificationEmail({ user, actionCodeSettings });
  }
}

// Export de l'instance singleton
export const emailService = EmailService.getInstance();
