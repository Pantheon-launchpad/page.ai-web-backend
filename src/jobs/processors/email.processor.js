/**
 * Email delivery is provider-agnostic and no real provider (SendGrid/SES/
 * Postmark/etc.) is wired up in this pass — this processor is the single
 * seam to add one. It's used identically whether the job runs on a worker
 * (Redis available) or inline (Redis absent), so wiring in a real provider
 * here immediately benefits both paths.
 */
export const sendPasswordResetEmail = async ({ email, resetToken }) => {
  console.log(`[email] Password reset for ${email}. Token (dev-only log): ${resetToken}`);
};

export const sendWelcomeEmail = async ({ email, name }) => {
  console.log(`[email] Welcome email for ${name} <${email}> (dev-only log, no provider wired up)`);
};

export const emailProcessors = {
  "password-reset": sendPasswordResetEmail,
  "welcome": sendWelcomeEmail,
};
