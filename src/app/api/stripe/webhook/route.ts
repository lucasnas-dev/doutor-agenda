import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

export const POST = async (request: Request) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing Stripe environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      console.error("No Stripe signature found");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const text = await request.text();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        text,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("Processing webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.customer) {
          await db
            .update(usersTable)
            .set({
              stripeCustomerId: session.customer as string,
              plan: "essential",
            })
            .where(eq(usersTable.id, userId));
          console.log("Updated user plan for checkout completion:", userId);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customer = invoice.customer as string;

        // Tipagem mais específica para invoice.parent
        const parent = invoice.parent as {
          subscription_details?: {
            metadata?: {
              userId?: string;
            };
            subscription?: string;
          };
        } | null;

        const subscription_details = parent?.subscription_details;

        if (subscription_details?.metadata?.userId) {
          const userId = subscription_details.metadata.userId;
          const subscription = subscription_details.subscription;

          await db
            .update(usersTable)
            .set({
              stripeSubscriptionId: subscription || null,
              stripeCustomerId: customer,
              plan: "essential",
            })
            .where(eq(usersTable.id, userId));
          console.log("Updated user plan for invoice payment:", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await db
            .update(usersTable)
            .set({
              stripeSubscriptionId: null,
              stripeCustomerId: null,
              plan: null,
            })
            .where(eq(usersTable.id, userId));
          console.log("Cancelled subscription for user:", userId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
};
