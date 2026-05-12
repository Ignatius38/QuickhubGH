import { createClientWithAsyncCookies } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const PAYSTACK_API_URL = 'https://api.paystack.co';

// Subscription tiers with prices in GHS
const SUBSCRIPTION_TIERS = {
  monthly: {
    name: 'Monthly',
    amount: 4000, // GHS 40 in pesewas (smallest unit)
    description: 'Full access for 30 days'
  },
  quarterly: {
    name: 'Quarterly',
    amount: 10800, // GHS 108 (10% discount)
    description: '3 months access with 10% discount'
  },
  annual: {
    name: 'Annual',
    amount: 38400, // GHS 384 (20% discount)
    description: '12 months access with 20% discount'
  }
};

// Payment method channels supported by Paystack
const PAYSTACK_CHANNELS = {
  momo: ['mobile_money'],
  card: ['card'],
  all: ['card', 'mobile_money', 'bank_transfer']
};

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClientWithAsyncCookies();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { tier = 'monthly', paymentMethod = 'all' } = body;

    // Validate subscription tier
    if (!SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!PAYSTACK_CHANNELS[paymentMethod as keyof typeof PAYSTACK_CHANNELS]) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Get user email and check for existing active subscription
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription
    const { data: activeSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString())
      .maybeSingle();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Subscription check error:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to check subscription status' },
        { status: 500 }
      );
    }

    if (activeSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Test mode: return mock response
    if (process.env.PAYMENT_TEST_MODE === 'true') {
      const reference = `test_${Date.now()}_${tier}`;
      const amount = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS].amount;
      
      return NextResponse.json({
        status: true,
        message: 'Test mode: Authorization URL created',
        data: {
          authorization_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/test-complete?reference=${reference}&amount=${amount}&tier=${tier}`,
          access_code: `test_access_${reference}`,
          reference,
          amount,
          currency: 'GHS',
          channels: PAYSTACK_CHANNELS[paymentMethod as keyof typeof PAYSTACK_CHANNELS]
        },
      });
    }

    // Get Paystack secret key from environment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      );
    }

    // Get amount for selected tier
    const amount = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS].amount;
    const channels = PAYSTACK_CHANNELS[paymentMethod as keyof typeof PAYSTACK_CHANNELS];

    // Call Paystack API
    const paystackResponse = await fetch(
      `${PAYSTACK_API_URL}/transaction/initialize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paystackSecretKey}`,
        },
        body: JSON.stringify({
          email: userData.email,
          amount: amount,
          currency: 'GHS',
          channels: channels,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/callback`,
          metadata: {
            tier: tier,
            userId: user.id,
            userEmail: userData.email
          }
        }),
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      console.error('Paystack error:', paystackData);
      return NextResponse.json(
        { error: paystackData.message || 'Failed to initialize payment' },
        { status: paystackResponse.status }
      );
    }

    if (!paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || 'Payment initialization failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(paystackData);
  } catch (error) {
    console.error('Subscription initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
