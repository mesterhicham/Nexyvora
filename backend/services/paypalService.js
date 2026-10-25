const db = require('../config/db');

/**
 * PayPal REST API v2 Service for Services section
 */
class PayPalService {
    static async getCredentials() {
        const [rows] = await db.query(
            "SELECT `key`, value FROM platform_settings WHERE `key` IN ('paypal_client_id', 'paypal_client_secret', 'paypal_mode', 'paypal_enabled')"
        );
        const settings = {};
        rows.forEach(r => { settings[r.key] = r.value; });

        const clientId = settings.paypal_client_id || process.env.PAYPAL_CLIENT_ID || '';
        const clientSecret = settings.paypal_client_secret || process.env.PAYPAL_CLIENT_SECRET || '';
        const mode = settings.paypal_mode || process.env.PAYPAL_MODE || 'sandbox';
        const enabled = settings.paypal_enabled !== '0';

        const baseUrl = mode === 'live' 
            ? 'https://api-m.paypal.com' 
            : 'https://api-m.sandbox.paypal.com';

        return { clientId, clientSecret, mode, enabled, baseUrl };
    }

    static async getAccessToken() {
        const { clientId, clientSecret, baseUrl } = await this.getCredentials();
        if (!clientId || !clientSecret) {
            throw new Error('PayPal credentials are not configured in platform_settings');
        }

        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to obtain PayPal access token: ${errText}`);
        }

        const data = await response.json();
        return data.access_token;
    }

    static async createOrder({ amount, currency = 'USD', orderNumber, description = 'Nextvora Service Order', returnUrl, cancelUrl }) {
        const { baseUrl } = await this.getCredentials();
        const accessToken = await this.getAccessToken();

        const formattedAmount = Number(amount).toFixed(2);

        const application_context = {
            brand_name: 'Nexyvora Services',
            landing_page: 'BILLING',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW'
        };

        if (returnUrl) application_context.return_url = returnUrl;
        if (cancelUrl) application_context.cancel_url = cancelUrl;

        const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        reference_id: orderNumber,
                        description: description.substring(0, 127),
                        amount: {
                            currency_code: currency,
                            value: formattedAmount
                        }
                    }
                ],
                application_context
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`PayPal Create Order Error: ${errText}`);
        }

        return await response.json();
    }

    static async captureOrder(paypalOrderId) {
        const { baseUrl } = await this.getCredentials();
        const accessToken = await this.getAccessToken();

        const response = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`PayPal Capture Order Error: ${errText}`);
        }

        return await response.json();
    }
}

module.exports = PayPalService;
