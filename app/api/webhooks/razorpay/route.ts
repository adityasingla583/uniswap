import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify cryptographic signature if secret is configured
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          { error: "Missing x-razorpay-signature header" },
          { status: 400 }
        );
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        await pool.query(
          `UPDATE "PaymentRecord"
           SET status = 'SUCCESS', "paymentId" = COALESCE($1, "paymentId"), "updatedAt" = NOW()
           WHERE "orderId" = $2`,
          [paymentId || null, orderId]
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Razorpay webhook processing error:", err);
    return NextResponse.json(
      { error: "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
