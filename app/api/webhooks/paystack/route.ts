import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify HMAC-SHA512 signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the event
    const event = JSON.parse(rawBody);

    // Handle charge.success event only
    if (event.event !== 'charge.success') {
      return NextResponse.json({ status: 'ok' });
    }

    const { data } = event;
    const { reference, customer, amount, metadata } = data;

    if (!reference || !customer?.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract tier from metadata, default to 'monthly'
    const tier = metadata?.tier || 'monthly';
    console.log('Webhook processing:', {
      reference,
      email: customer.email,
      amount,
      tier,
      metadata
    });

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', customer.email)
      .single();

    if (userError || !userData) {
      console.error('User not found:', customer.email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if subscription with this payment_reference already exists
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('payment_reference', reference)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Subscription check error:', checkError);
      return NextResponse.json(
        { error: 'Failed to check subscription' },
        { status: 500 }
      );
    }

    if (existingSubscription) {
      console.log('Subscription already exists for reference:', reference);
      return NextResponse.json({ status: 'ok' }); // Already processed
    }

    // Insert subscription record
    const startsAt = new Date();
    // Calculate end date based on tier
    let daysToAdd = 30; // Default for monthly
    if (tier === 'quarterly') {
      daysToAdd = 90; // 3 months
    } else if (tier === 'annual') {
      daysToAdd = 365; // 1 year
    }
    const endsAt = new Date(startsAt.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userData.id,
        tier: tier,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        payment_reference: reference,
        status: 'active',
      });

    if (subscriptionError) {
      console.error('Subscription insert error:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: userData.id,
      type: 'subscription_activated',
      payload: {
        tier: tier,
        ends_at: endsAt.toISOString(),
      },
    });

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
