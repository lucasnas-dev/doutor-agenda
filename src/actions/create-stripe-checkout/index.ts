"use server";

import Stripe from "stripe";

import { protectedActionClient } from "@/lib/next-safe-action";

export const createStripeCheckout = protectedActionClient.action(
  async ({ ctx }) => {
    console.log("🚀 Starting checkout for user:", ctx.user.id, ctx.user.email);

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not found");
    }

    if (!process.env.STRIPE_ESSENTIAL_PLAN_PRICE_ID) {
      throw new Error("Stripe price ID not found");
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error("App URL not found");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?canceled=true`,
        customer_email: ctx.user.email,
        subscription_data: {
          metadata: {
            userId: ctx.user.id,
          },
        },
        metadata: {
          userId: ctx.user.id,
        },
        line_items: [
          {
            price: process.env.STRIPE_ESSENTIAL_PLAN_PRICE_ID,
            quantity: 1,
          },
        ],
      });

      console.log("✅ Checkout session created successfully:", session.id);

      return {
        sessionId: session.id,
      };
    } catch (error) {
      console.error("❌ Error creating checkout session:", error);
      throw new Error("Failed to create checkout session");
    }
  },
);
