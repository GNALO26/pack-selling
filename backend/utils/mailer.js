const nodemailer = require('nodemailer');

// ── Transporter ───────────────────────────────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp-relay.brevo.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Brevo utilise STARTTLS sur 587, pas SSL direct
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Évite les erreurs de certificat sur certains hébergeurs
    ciphers: 'SSLv3',
  },
  connectionTimeout: 10000, // 10 secondes max
  greetingTimeout:   10000,
  socketTimeout:     15000,
});

// ── Templates HTML ────────────────────────────────────────────────────────────
const templates = {

  verifyEmail: ({ firstName, verifUrl }) => ({
    subject: 'Activez votre compte — Pack Digital 360',
    html: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#0A1628 0%,#1565C0 100%);padding:40px 32px;text-align:center}
  .logo{color:#F9A825;font-size:24px;font-weight:800;letter-spacing:2px}
  .badge{display:inline-block;background:rgba(249,168,37,.15);color:#F9A825;font-size:12px;padding:4px 12px;border-radius:20px;margin-top:8px;border:1px solid rgba(249,168,37,.3)}
  .body{padding:40px 32px}
  h2{color:#0A1628;font-size:22px;margin:0 0 16px}
  p{color:#4a5568;line-height:1.7;margin:0 0 16px;font-size:15px}
  .btn{display:inline-block;background:linear-gradient(135deg,#1565C0,#1E88E5);color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;margin:8px 0 24px}
  .note{background:#f7fafc;border-left:3px solid #1565C0;padding:12px 16px;border-radius:4px;font-size:13px;color:#718096}
  .footer{background:#f7fafc;padding:24px 32px;text-align:center;color:#a0aec0;font-size:12px;border-top:1px solid #e2e8f0}
</style></head><body>
<div class="wrap">
  <div class="header">
    <div class="logo">PACK DIGITAL 360</div>
    <div class="badge">Votre présence Google, enfin maîtrisée</div>
  </div>
  <div class="body">
    <h2>Bonjour ${firstName} 👋</h2>
    <p>Merci pour votre inscription sur <strong>Pack Digital 360</strong>. Vous êtes à un clic d'accéder à votre espace personnel.</p>
    <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte :</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${verifUrl}" class="btn">✅ Activer mon compte</a>
    </div>
    <div class="note">⏱ Ce lien est valable pendant <strong>24 heures</strong>. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</div>
  </div>
  <div class="footer">
    Pack Digital 360 · Cotonou, Bénin<br>
    guidolokossouolympe@gmail.com
  </div>
</div>
</body></html>`,
  }),

  purchaseConfirmation: ({ firstName, packName, amount, currency, dashboardUrl, transactionId }) => ({
    subject: `✅ Paiement confirmé — ${packName}`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#1B5E20 0%,#2E7D32 100%);padding:40px 32px;text-align:center}
  .logo{color:#fff;font-size:24px;font-weight:800;letter-spacing:2px}
  .success{font-size:48px;margin:8px 0}
  .body{padding:40px 32px}
  h2{color:#0A1628;font-size:22px;margin:0 0 16px}
  p{color:#4a5568;line-height:1.7;margin:0 0 16px;font-size:15px}
  .receipt{background:#f0fff4;border:1px solid #c6f6d5;border-radius:8px;padding:20px;margin:24px 0}
  .receipt-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px}
  .receipt-row:last-child{border-bottom:none;font-weight:700;color:#1B5E20}
  .btn{display:inline-block;background:linear-gradient(135deg,#1565C0,#1E88E5);color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px}
  .footer{background:#f7fafc;padding:24px 32px;text-align:center;color:#a0aec0;font-size:12px;border-top:1px solid #e2e8f0}
</style></head><body>
<div class="wrap">
  <div class="header">
    <div class="logo">PACK DIGITAL 360</div>
    <div class="success">✅</div>
    <div style="color:#fff;font-size:18px;font-weight:600">Paiement confirmé</div>
  </div>
  <div class="body">
    <h2>Félicitations ${firstName} ! 🎉</h2>
    <p>Votre achat a été <strong>confirmé avec succès</strong>. Vous avez maintenant accès à tous les documents de votre pack.</p>
    <div class="receipt">
      <div class="receipt-row"><span>Pack acheté</span><span>${packName}</span></div>
      <div class="receipt-row"><span>Référence</span><span>#${transactionId}</span></div>
      <div class="receipt-row"><span>Total payé</span><span>${new Intl.NumberFormat('fr-FR').format(amount)} ${currency}</span></div>
    </div>
    <p>Connectez-vous à votre tableau de bord pour accéder à vos documents :</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${dashboardUrl}" class="btn">📊 Accéder à mon tableau de bord</a>
    </div>
  </div>
  <div class="footer">Pack Digital 360 · Cotonou, Bénin · guidolokossouolympe@gmail.com</div>
</div>
</body></html>`,
  }),

  resetPassword: ({ firstName, resetUrl }) => ({
    subject: 'Réinitialisation de mot de passe — Pack Digital 360',
    html: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#B71C1C 0%,#E53935 100%);padding:40px 32px;text-align:center;color:#fff}
  .logo{font-size:24px;font-weight:800;letter-spacing:2px}
  .body{padding:40px 32px}
  h2{color:#0A1628;font-size:22px;margin:0 0 16px}
  p{color:#4a5568;line-height:1.7;margin:0 0 16px;font-size:15px}
  .btn{display:inline-block;background:linear-gradient(135deg,#B71C1C,#E53935);color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px}
  .note{background:#fff5f5;border-left:3px solid #fc8181;padding:12px 16px;border-radius:4px;font-size:13px;color:#742a2a}
  .footer{background:#f7fafc;padding:24px;text-align:center;color:#a0aec0;font-size:12px;border-top:1px solid #e2e8f0}
</style></head><body>
<div class="wrap">
  <div class="header"><div class="logo">PACK DIGITAL 360</div><div style="font-size:15px;margin-top:8px;opacity:.9">Réinitialisation de mot de passe</div></div>
  <div class="body">
    <h2>Bonjour ${firstName},</h2>
    <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${resetUrl}" class="btn">🔑 Réinitialiser mon mot de passe</a>
    </div>
    <div class="note">⚠️ Ce lien expire dans <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe reste inchangé.</div>
  </div>
  <div class="footer">Pack Digital 360 · Cotonou, Bénin</div>
</div>
</body></html>`,
  }),

  accessGranted: ({ firstName, packName, dashboardUrl, grantedBy }) => ({
    subject: `🎁 Accès offert — ${packName}`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#4A148C 0%,#7B1FA2 100%);padding:40px 32px;text-align:center;color:#fff}
  .logo{font-size:24px;font-weight:800;letter-spacing:2px}
  .body{padding:40px 32px}
  h2{color:#0A1628;font-size:22px;margin:0 0 16px}
  p{color:#4a5568;line-height:1.7;margin:0 0 16px;font-size:15px}
  .btn{display:inline-block;background:linear-gradient(135deg,#1565C0,#1E88E5);color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px}
  .footer{background:#f7fafc;padding:24px;text-align:center;color:#a0aec0;font-size:12px;border-top:1px solid #e2e8f0}
</style></head><body>
<div class="wrap">
  <div class="header"><div class="logo">PACK DIGITAL 360</div><div style="font-size:36px;margin:8px 0">🎁</div></div>
  <div class="body">
    <h2>Bonne nouvelle, ${firstName} !</h2>
    <p>Un accès au <strong>${packName}</strong> vous a été offert par <strong>${grantedBy}</strong>.</p>
    <p>Connectez-vous à votre tableau de bord pour accéder immédiatement à vos documents :</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${dashboardUrl}" class="btn">📊 Accéder à mon tableau de bord</a>
    </div>
  </div>
  <div class="footer">Pack Digital 360 · Cotonou, Bénin</div>
</div>
</body></html>`,
  }),
};

// ── sendEmail ─────────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, template, data, html }) => {
  try {
    const transporter = createTransporter();
    const tpl = templates[template]?.(data) || { subject, html };

    const from = process.env.SMTP_FROM
      ? process.env.SMTP_FROM
      : `"GUI-LOK DEV" <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
      from,
      to,
      subject: tpl.subject || subject,
      html:    tpl.html    || html,
    });

    console.log(`[Mailer] ✅ Email envoyé à ${to} — messageId: ${info.messageId}`);
    return { success: true };
  } catch (err) {
    console.error(`[Mailer] ❌ Erreur envoi à ${to}:`, err.message);
    // Retourne l'erreur pour que le controller puisse réagir
    return { success: false, error: err.message };
  }
};

module.exports = { sendEmail };