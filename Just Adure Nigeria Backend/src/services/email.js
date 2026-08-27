import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { EmailLog } from "../models/email-log.js";

const brevoApiUrl = "https://api.brevo.com/v3/smtp/email";

function formatNaira(amountKobo) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(amountKobo ?? 0) / 100);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isBrevoConfigured() {
  return env.BREVO_API_KEY && !env.BREVO_API_KEY.includes("placeholder");
}

function baseTemplate({ title, intro, order, actionLabel, actionUrl }) {
  const items = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #edf0f5;">${escapeHtml(item.name)}<br><small>${escapeHtml(item.sku)} | ${escapeHtml(item.condition || "UK-used")}</small></td>
          <td style="padding:12px;border-bottom:1px solid #edf0f5;text-align:center;">${item.quantity}</td>
          <td style="padding:12px;border-bottom:1px solid #edf0f5;text-align:right;">${formatNaira(item.lineSubtotalKobo)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f1ea;font-family:Arial,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ea;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(31,41,51,.08);">
            <tr>
              <td style="background:#12372a;color:#fff;padding:28px;">
                <div style="font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#d8b56d;">Just Adure Nigeria Ltd</div>
                <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="font-size:16px;line-height:1.6;margin:0 0 18px;">${escapeHtml(intro)}</p>
                <p style="margin:0 0 20px;"><strong>Order:</strong> ${escapeHtml(order.orderNumber)}<br><strong>Total:</strong> ${formatNaira(order.totalKobo)}<br><strong>Status:</strong> ${escapeHtml(order.orderStatus.replaceAll("_", " "))}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #edf0f5;border-radius:12px;overflow:hidden;">
                  <thead>
                    <tr style="background:#f8fafc;">
                      <th align="left" style="padding:12px;">Product</th>
                      <th align="center" style="padding:12px;">Qty</th>
                      <th align="right" style="padding:12px;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>${items}</tbody>
                </table>
                <p style="margin:20px 0 0;line-height:1.6;">Delivery: ${escapeHtml(order.customer.addressLine1)}, ${escapeHtml(order.customer.city)}, ${escapeHtml(order.customer.state)}</p>
                ${actionUrl ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#d8b56d;color:#12372a;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">${escapeHtml(actionLabel)}</a></p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:18px 28px;color:#64748b;font-size:13px;line-height:1.5;">Need help? Reply to this email or contact our support team.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendBrevoEmail({ to, subject, htmlContent, textContent, template, order }) {
  const log = await EmailLog.create({
    recipientEmail: to.email,
    recipientName: to.name,
    subject,
    template,
    status: isBrevoConfigured() ? "pending" : "skipped",
    orderId: order?._id,
    orderNumber: order?.orderNumber,
    payload: { subject, to: to.email },
  });

  if (!isBrevoConfigured()) {
    logger.warn({ template, recipientEmail: to.email }, "Brevo email skipped because BREVO_API_KEY is not configured.");
    return { status: "skipped", log };
  }

  try {
    const response = await fetch(brevoApiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
        to: [{ email: to.email, name: to.name }],
        subject,
        htmlContent,
        textContent,
      }),
    });

    const payload = await response.json().catch(() => null);
    log.attempts += 1;
    log.payload = payload;

    if (!response.ok) {
      log.status = "failed";
      log.lastError = payload?.message ?? `Brevo responded with ${response.status}`;
      await log.save();
      logger.error({ template, recipientEmail: to.email, status: response.status }, "Brevo email failed.");
      return { status: "failed", log };
    }

    log.status = "sent";
    log.providerMessageId = payload?.messageId;
    await log.save();
    return { status: "sent", log };
  } catch (error) {
    log.attempts += 1;
    log.status = "failed";
    log.lastError = error.message;
    await log.save();
    logger.error({ err: error, template, recipientEmail: to.email }, "Brevo email failed unexpectedly.");
    return { status: "failed", log };
  }
}

export async function notifyOrderReceived(order) {
  await sendBrevoEmail({
    to: { email: order.customer.email, name: order.customer.name },
    subject: `We received your order ${order.orderNumber}`,
    template: "order_received_customer",
    order,
    htmlContent: baseTemplate({
      title: "Order received",
      intro: "Thank you for shopping with us. Your order has been created and your items are temporarily reserved while payment is completed.",
      order,
      actionLabel: "Track order",
      actionUrl: `${env.WEB_URL}/order-tracking?orderNumber=${encodeURIComponent(order.orderNumber)}`,
    }),
    textContent: `Order ${order.orderNumber} has been received. Total: ${formatNaira(order.totalKobo)}.`,
  });

  await sendBrevoEmail({
    to: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
    subject: `New order ${order.orderNumber}`,
    template: "new_order_admin",
    order,
    htmlContent: baseTemplate({
      title: "New customer order",
      intro: `${order.customer.name} created a new order awaiting payment.`,
      order,
      actionLabel: "Open admin dashboard",
      actionUrl: `${env.WEB_URL}/admin`,
    }),
    textContent: `New order ${order.orderNumber} from ${order.customer.email}. Total: ${formatNaira(order.totalKobo)}.`,
  });
}

export async function notifyPaymentSuccessful(order, payment) {
  await sendBrevoEmail({
    to: { email: order.customer.email, name: order.customer.name },
    subject: `Payment confirmed for ${order.orderNumber}`,
    template: "payment_successful_customer",
    order,
    htmlContent: baseTemplate({
      title: "Payment successful",
      intro: "Your payment has been verified successfully. We will now prepare your order for pickup or delivery.",
      order,
      actionLabel: "Track order",
      actionUrl: `${env.WEB_URL}/order-tracking?orderNumber=${encodeURIComponent(order.orderNumber)}`,
    }),
    textContent: `Payment confirmed for ${order.orderNumber}. Reference: ${payment.reference}.`,
  });

  await sendBrevoEmail({
    to: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
    subject: `Payment received for ${order.orderNumber}`,
    template: "payment_successful_admin",
    order,
    htmlContent: baseTemplate({
      title: "Payment received",
      intro: `Paystack payment was verified for reference ${payment.reference}.`,
      order,
      actionLabel: "Open admin dashboard",
      actionUrl: `${env.WEB_URL}/admin`,
    }),
    textContent: `Payment received for ${order.orderNumber}. Reference: ${payment.reference}.`,
  });
}
export async function notifyBackInStockEmail(user, product) {
  if (!user?.email || !product) return { status: "skipped" };
  const productUrl = `${env.WEB_URL}/product/${encodeURIComponent(product.slug)}`;
  const htmlContent = `<!doctype html><html lang="en"><body style="margin:0;background:#f5f1ea;font-family:Arial,sans-serif;color:#1f2933;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ea;padding:24px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;"><tr><td style="background:#12372a;color:#fff;padding:28px;"><div style="font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#d8b56d;">Just Adure Nigeria Ltd</div><h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;">Back in stock</h1></td></tr><tr><td style="padding:28px;"><p style="font-size:16px;line-height:1.6;margin:0 0 18px;">Hi ${escapeHtml(user.name)}, ${escapeHtml(product.name)} is available again.</p><p style="margin:0 0 18px;line-height:1.6;"><strong>Price:</strong> ${formatNaira(product.priceKobo)}<br><strong>SKU:</strong> ${escapeHtml(product.sku)}</p><p style="margin:24px 0 0;"><a href="${escapeHtml(productUrl)}" style="display:inline-block;background:#d8b56d;color:#12372a;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">View product</a></p></td></tr><tr><td style="background:#f8fafc;padding:18px 28px;color:#64748b;font-size:13px;line-height:1.5;">UK-used products may have only one unit available, so stock can change quickly.</td></tr></table></td></tr></table></body></html>`;
  return sendBrevoEmail({
    to: { email: user.email, name: user.name },
    subject: `${product.name} is back in stock`,
    template: "back_in_stock_customer",
    htmlContent,
    textContent: `${product.name} is back in stock. View it here: ${productUrl}`,
  });
}
export async function notifyNewsletterSubscription(subscriber) {
  if (!subscriber?.email) return { status: "skipped" };
  const shopUrl = `${env.WEB_URL}/shop`;
  const htmlContent = `<!doctype html><html lang="en"><body style="margin:0;background:#f5f1ea;font-family:Arial,sans-serif;color:#1f2933;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ea;padding:24px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;"><tr><td style="background:#12372a;color:#fff;padding:28px;"><div style="font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#d8b56d;">Just Adure Nigeria Ltd</div><h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;">Newsletter subscription confirmed</h1></td></tr><tr><td style="padding:28px;"><p style="font-size:16px;line-height:1.6;margin:0 0 18px;">Hi ${escapeHtml(subscriber.name || "there")}, thank you for subscribing. We will send honest UK-used product updates, restock notices and store offers.</p><p style="margin:24px 0 0;"><a href="${escapeHtml(shopUrl)}" style="display:inline-block;background:#d8b56d;color:#12372a;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Browse products</a></p></td></tr><tr><td style="background:#f8fafc;padding:18px 28px;color:#64748b;font-size:13px;line-height:1.5;">You can contact support if you subscribed by mistake.</td></tr></table></td></tr></table></body></html>`;
  return sendBrevoEmail({
    to: { email: subscriber.email, name: subscriber.name || "Customer" },
    subject: "You are subscribed to Just Adure Nigeria Ltd updates",
    template: "newsletter_subscription_confirmation",
    htmlContent,
    textContent: `You are subscribed to Just Adure Nigeria Ltd updates. Browse products: ${shopUrl}`,
  });
}

export async function notifyEmailVerification(user, token) {
  if (!user?.email || !token) return { status: "skipped" };
  const verifyUrl = `${env.WEB_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const htmlContent = `<!doctype html><html lang="en"><body style="margin:0;background:#f5f1ea;font-family:Arial,sans-serif;color:#1f2933;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ea;padding:24px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;"><tr><td style="background:#12372a;color:#fff;padding:28px;"><div style="font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#d8b56d;">Just Adure Nigeria Ltd</div><h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;">Verify your email</h1></td></tr><tr><td style="padding:28px;"><p style="font-size:16px;line-height:1.6;margin:0 0 18px;">Hi ${escapeHtml(user.name)}, welcome to Just Adure Nigeria Ltd. Please confirm this email address so we can protect your account and order updates.</p><p style="margin:24px 0 0;"><a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:#d8b56d;color:#12372a;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Verify email</a></p><p style="margin:18px 0 0;color:#64748b;font-size:13px;line-height:1.6;">This link expires in 24 hours.</p></td></tr></table></td></tr></table></body></html>`;
  return sendBrevoEmail({
    to: { email: user.email, name: user.name },
    subject: "Verify your Just Adure Nigeria Ltd account",
    template: "email_verification_customer",
    htmlContent,
    textContent: `Verify your Just Adure Nigeria Ltd account: ${verifyUrl}`,
  });
}

export async function notifyPasswordReset(user, token) {
  if (!user?.email || !token) return { status: "skipped" };
  const resetUrl = `${env.WEB_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const htmlContent = `<!doctype html><html lang="en"><body style="margin:0;background:#f5f1ea;font-family:Arial,sans-serif;color:#1f2933;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ea;padding:24px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;"><tr><td style="background:#12372a;color:#fff;padding:28px;"><div style="font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#d8b56d;">Just Adure Nigeria Ltd</div><h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;">Reset your password</h1></td></tr><tr><td style="padding:28px;"><p style="font-size:16px;line-height:1.6;margin:0 0 18px;">Hi ${escapeHtml(user.name)}, use the button below to choose a new password for your account.</p><p style="margin:24px 0 0;"><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#d8b56d;color:#12372a;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Reset password</a></p><p style="margin:18px 0 0;color:#64748b;font-size:13px;line-height:1.6;">This link expires in 1 hour. If you did not request it, you can ignore this email.</p></td></tr></table></td></tr></table></body></html>`;
  return sendBrevoEmail({
    to: { email: user.email, name: user.name },
    subject: "Reset your Just Adure Nigeria Ltd password",
    template: "password_reset_customer",
    htmlContent,
    textContent: `Reset your Just Adure Nigeria Ltd password: ${resetUrl}`,
  });
}
