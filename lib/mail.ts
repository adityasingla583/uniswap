import nodemailer from "nodemailer";

interface SendOtpOptions {
  to: string;
  code: string;
  purpose?: string;
}

// Create reusable transporter
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    // For Gmail accounts, nodemailer's built-in 'service: gmail' ensures optimal SSL/TLS on port 465
    if (user.endsWith("@gmail.com") || host.includes("gmail")) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });
  }

  // Fallback for development when SMTP_PASS is not yet provided
  return null;
}

export async function sendOtpEmail({ to, code, purpose = "Authentication" }: SendOtpOptions) {
  const transporter = getTransporter();
  const from =
    process.env.EMAIL_FROM || '"Local Loop Campus" <demotests403@gmail.com>';

  const subject = `Your Local Loop Verification Code: ${code}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background-color: #4f46e5; color: #ffffff; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; font-weight: bold; font-size: 20px;">
          LL
        </div>
        <h2 style="color: #0f172a; margin-top: 12px; margin-bottom: 4px; font-size: 22px;">Local Loop Campus Marketplace</h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">Hyper-Localized Student Exchange</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <p style="color: #475569; font-size: 14px; margin-top: 0; margin-bottom: 12px;">
          Use the 6-digit verification code below to complete your ${purpose.toLowerCase()}:
        </p>
        <div style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; background-color: #ffffff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #4f46e5; display: inline-block; margin: 8px 0;">
          ${code}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 12px; margin-bottom: 0;">
          This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
        <p style="margin: 0;">Sent securely by Local Loop to ${to}</p>
        <p style="margin: 4px 0 0 0;">Buy, sell, and exchange gear safely within your campus community.</p>
      </div>
    </div>
  `;

  if (!transporter) {
    return {
      success: false,
      error:
        "Email server is not configured. Please add the Gmail App Password to SMTP_PASS in .env.",
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`[NODEMAILER] Email successfully sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("[NODEMAILER ERROR]", err);
    const isBlocked =
      err.code === "ETIMEDOUT" ||
      err.code === "ESOCKET" ||
      err.code === "ENETUNREACH" ||
      err.message?.includes("timed out") ||
      err.message?.includes("ENETUNREACH");

    if (isBlocked) {
      return {
        success: false,
        error:
          "Network firewall blocked SMTP ports (465/587). This is common on College/Hostel Wi-Fi. Please switch to your phone's Mobile Hotspot to send emails.",
      };
    }

    return {
      success: false,
      error: `Failed to deliver email: ${err.message || "Invalid credentials"}.`,
    };
  }
}
