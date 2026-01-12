const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const router = express.Router();

// Create payment intent for course purchase
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { courseId, userId } = req.body;

        // Get course details
        const [courses] = await db.query(
            'SELECT * FROM courses WHERE id = ?',
            [courseId]
        );

        if (courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const course = courses[0];

        // Check if user already owns the course
        const [existingPurchase] = await db.query(
            'SELECT * FROM user_purchases WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );

        if (existingPurchase.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Course already purchased'
            });
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(course.price * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                course_id: courseId,
                user_id: userId,
                course_title: course.title
            },
            description: `Purchase: ${course.title}`,
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('Payment intent creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment intent'
        });
    }
});

// Confirm payment and grant access
router.post('/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId, userId } = req.body;

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            const { course_id, user_id } = paymentIntent.metadata;

            // Verify user matches
            if (parseInt(user_id) !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Payment verification failed'
                });
            }

            // Grant course access
            await db.query(
                'INSERT INTO user_purchases (user_id, course_id, payment_intent_id, amount, purchased_at) VALUES (?, ?, ?, ?, NOW())',
                [userId, course_id, paymentIntentId, paymentIntent.amount / 100]
            );

            // Update user stats
            await awardPoints(userId, 50, 'course_purchase');

            res.json({
                success: true,
                message: 'Course access granted successfully'
            });

        } else {
            res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }

    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment confirmation failed'
        });
    }
});

// Create subscription for premium access
router.post('/create-subscription', async (req, res) => {
    try {
        const { userId, planType } = req.body; // 'monthly' or 'yearly'

        const plans = {
            monthly: {
                priceId: process.env.STRIPE_MONTHLY_PRICE_ID,
                amount: 999 // $9.99
            },
            yearly: {
                priceId: process.env.STRIPE_YEARLY_PRICE_ID,
                amount: 9999 // $99.99
            }
        };

        if (!plans[planType]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan type'
            });
        }

        // Check if user already has active subscription
        const [existingSubscription] = await db.query(
            'SELECT * FROM user_subscriptions WHERE user_id = ? AND status = "active"',
            [userId]
        );

        if (existingSubscription.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Active subscription already exists'
            });
        }

        // Create or retrieve customer
        let customer;
        const [userData] = await db.query(
            'SELECT email, stripe_customer_id FROM users WHERE id = ?',
            [userId]
        );

        if (userData[0].stripe_customer_id) {
            customer = await stripe.customers.retrieve(userData[0].stripe_customer_id);
        } else {
            customer = await stripe.customers.create({
                email: userData[0].email,
                metadata: { user_id: userId }
            });

            // Update user with Stripe customer ID
            await db.query(
                'UPDATE users SET stripe_customer_id = ? WHERE id = ?',
                [customer.id, userId]
            );
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{
                price: plans[planType].priceId,
            }],
            metadata: {
                user_id: userId,
                plan_type: planType
            },
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent'],
        });

        res.json({
            success: true,
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
            status: subscription.status
        });

    } catch (error) {
        console.error('Subscription creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create subscription'
        });
    }
});

// Handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                await handlePaymentSuccess(paymentIntent);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                const subscription = event.data.object;
                await handleSubscriptionUpdate(subscription);
                break;

            case 'customer.subscription.deleted':
                const canceledSubscription = event.data.object;
                await handleSubscriptionCancel(canceledSubscription);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

async function handlePaymentSuccess(paymentIntent) {
    const { course_id, user_id } = paymentIntent.metadata;

    try {
        // Update purchase status
        await db.query(
            'UPDATE user_purchases SET status = "completed" WHERE payment_intent_id = ?',
            [paymentIntent.id]
        );

        // Award achievement points
        await awardPoints(user_id, 100, 'premium_course_purchase');

        console.log(`Payment successful for user ${user_id}, course ${course_id}`);
    } catch (error) {
        console.error('Payment success handling error:', error);
    }
}

async function handleSubscriptionUpdate(subscription) {
    const userId = subscription.metadata.user_id;

    try {
        const status = subscription.status === 'active' ? 'active' : 'inactive';
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        await db.query(
            'INSERT INTO user_subscriptions (user_id, stripe_subscription_id, status, plan_type, current_period_end, created_at) VALUES (?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE status = ?, current_period_end = ?',
            [userId, subscription.id, status, subscription.metadata.plan_type, currentPeriodEnd, status, currentPeriodEnd]
        );

        if (status === 'active') {
            await awardPoints(userId, 200, 'premium_subscription');
        }

        console.log(`Subscription updated for user ${userId}: ${status}`);
    } catch (error) {
        console.error('Subscription update handling error:', error);
    }
}

async function handleSubscriptionCancel(subscription) {
    const userId = subscription.metadata.user_id;

    try {
        await db.query(
            'UPDATE user_subscriptions SET status = "canceled", canceled_at = NOW() WHERE stripe_subscription_id = ?',
            [subscription.id]
        );

        console.log(`Subscription canceled for user ${userId}`);
    } catch (error) {
        console.error('Subscription cancel handling error:', error);
    }
}

// Get user's purchases and subscriptions
router.get('/user-status', async (req, res) => {
    try {
        const userId = req.user.id;

        const [purchases] = await db.query(
            'SELECT up.*, c.title, c.price FROM user_purchases up JOIN courses c ON up.course_id = c.id WHERE up.user_id = ?',
            [userId]
        );

        const [subscription] = await db.query(
            'SELECT * FROM user_subscriptions WHERE user_id = ? AND status = "active" LIMIT 1',
            [userId]
        );

        res.json({
            success: true,
            purchases,
            subscription: subscription[0] || null
        });

    } catch (error) {
        console.error('User status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user status'
        });
    }
});

// Cancel subscription
router.post('/cancel-subscription', async (req, res) => {
    try {
        const userId = req.user.id;

        const [subscription] = await db.query(
            'SELECT stripe_subscription_id FROM user_subscriptions WHERE user_id = ? AND status = "active"',
            [userId]
        );

        if (subscription.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active subscription found'
            });
        }

        // Cancel at period end
        await stripe.subscriptions.update(subscription[0].stripe_subscription_id, {
            cancel_at_period_end: true
        });

        res.json({
            success: true,
            message: 'Subscription will be canceled at the end of the billing period'
        });

    } catch (error) {
        console.error('Subscription cancel error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel subscription'
        });
    }
});

module.exports = router;
