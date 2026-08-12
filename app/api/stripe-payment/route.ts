// app/api/stripe-payment/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("❌ MISSING STRIPE_SECRET_KEY in environment variables!");
}

const stripe = new Stripe(stripeSecretKey || "");

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    // Safety check for amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    // Convert USD to cents (e.g. $12.50 -> 1250 cents)
    const amountInCents = Math.round(Number(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    // THIS WILL PRINT THE EXACT CAUSE IN YOUR TERMINAL
    console.error("❌ Stripe Payment Intent Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}