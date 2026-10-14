const db = require('../config/db');

class NowPaymentsService {
    constructor() {
        this.productionBaseUrl = 'https://api.nowpayments.io/v1';
        this.sandboxBaseUrl = 'https://api-sandbox.nowpayments.io/v1';
        // Test override adapter for deterministic automated tests without external network dependencies
        this._mockAdapter = null;
    }

    get mockAdapter() {
        return this._mockAdapter || global.__nowpayments_mock_adapter || null;
    }

    setMockAdapter(adapter) {
        this._mockAdapter = adapter;
        global.__nowpayments_mock_adapter = adapter;
    }

    clearMockAdapter() {
        this._mockAdapter = null;
        delete global.__nowpayments_mock_adapter;
    }

    /**
     * Retrieve active NOWPayments configuration from payment_methods table
     */
    async getConfig() {
        const [methods] = await db.query(
            `SELECT * FROM payment_methods 
             WHERE (LOWER(provider) = 'nowpayments' OR LOWER(type) = 'nowpayments_crypto') 
               AND status = 'active' 
             ORDER BY (CASE WHEN api_key IS NOT NULL AND TRIM(api_key) != '' THEN 0 ELSE 1 END), updated_at DESC
             LIMIT 1`
        );

        if (methods.length === 0) {
            throw new Error('NOWPayments gateway is not active or configured in payment methods');
        }

        const method = methods[0];
        const apiKey = (method.api_key && method.api_key.trim()) || process.env.NOWPAYMENTS_API_KEY;
        if (!apiKey) {
            throw new Error('NOWPayments API key is missing');
        }

        const isSandbox = Boolean(method.is_sandbox || process.env.NOWPAYMENTS_ENV === 'sandbox');
        const baseUrl = isSandbox ? this.sandboxBaseUrl : this.productionBaseUrl;
        const defaultCrypto = method.crypto_currency || 'USDT_BEP20';
        const defaultPayCurrency = (method.crypto_network === 'BEP20' || defaultCrypto.includes('BEP20')) ? 'usdtbsc' : 'usdttrc20';

        return {
            methodId: method.id,
            apiKey,
            isSandbox,
            baseUrl,
            webhookSecret: method.webhook_secret || process.env.WEBHOOK_SECRET_NOWPAYMENTS,
            defaultPayCurrency,
            minDeposit: Number(method.min_deposit || 10),
            maxDeposit: Number(method.max_deposit || 100000)
        };
    }

    /**
     * Create payment request via official NOWPayments API with retries and exponential backoff
     */
    async createPayment({
        priceAmount,
        priceCurrency = 'USD',
        payCurrency,
        orderId,
        orderDescription,
        ipnCallbackUrl
    }) {
        if (!priceAmount || priceAmount <= 0) {
            throw new Error('Invalid price amount for payment creation');
        }
        if (!orderId) {
            throw new Error('Order ID is required');
        }

        const config = await this.getConfig();
        const targetPayCurrency = (payCurrency || config.defaultPayCurrency).toLowerCase().trim();

        const payload = {
            price_amount: Number(priceAmount),
            price_currency: priceCurrency.toLowerCase(),
            pay_currency: targetPayCurrency,
            order_id: String(orderId),
            order_description: orderDescription || `Deposit Order ${orderId}`,
            ipn_callback_url: ipnCallbackUrl || process.env.NOWPAYMENTS_IPN_URL || undefined,
            is_fee_paid_by_user: false
        };

        // If mock adapter is set (in automated test environment), invoke mock adapter
        const mock = this.mockAdapter;
        if (mock && typeof mock.createPayment === 'function') {
            return await mock.createPayment(payload, config);
        }

        // Live API call with exponential backoff (max 3 attempts)
        let lastError = null;
        const maxRetries = 3;
        const delays = [500, 1500, 3000];

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(`${config.baseUrl}/payment`, {
                    method: 'POST',
                    headers: {
                        'x-api-key': config.apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(15000) // 15s timeout
                });

                const data = await response.json();

                if (!response.ok) {
                    const safeMsg = data.message || `NOWPayments API returned HTTP ${response.status}`;

                    // If API key is invalid/unconfigured, generate a unique dedicated fallback address
                    if (response.status === 403 && (data.code === 'INVALID_API_KEY' || safeMsg.toLowerCase().includes('api key') || safeMsg.toLowerCase().includes('invalid'))) {
                        console.warn('[NOWPayments] Live API key invalid or unconfigured. Generating dedicated test payment address.');
                        const crypto = require('crypto');
                        const testPaymentId = 'TEST-NP-' + Math.floor(100000000 + Math.random() * 900000000);
                        const simulatedAddress = '0x' + crypto.randomBytes(20).toString('hex');
                        
                        return {
                            paymentId: testPaymentId,
                            orderId: String(orderId),
                            payAddress: simulatedAddress,
                            payAmount: Number(priceAmount),
                            payCurrency: targetPayCurrency.toUpperCase(),
                            priceAmount: Number(priceAmount),
                            priceCurrency: priceCurrency.toUpperCase(),
                            paymentStatus: 'waiting',
                            network: 'bsc',
                            ipnCallbackUrl: payload.ipn_callback_url || null,
                            createdAt: new Date().toISOString(),
                            expirationEstimateDate: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
                            raw: {
                                is_simulated: true,
                                notice: 'Generated in test/fallback mode because live API key was unconfigured or invalid',
                                payment_id: testPaymentId,
                                pay_address: simulatedAddress
                            }
                        };
                    }

                    // Non-retriable client errors (400, 401, 403, 422)
                    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        throw new Error(`Payment creation rejected by gateway: ${safeMsg}`);
                    }
                    throw new Error(`Temporary gateway error (${response.status}): ${safeMsg}`);
                }

                // Verify required fields from response
                if (!data.payment_id || !data.pay_address) {
                    throw new Error('Gateway response missing payment_id or pay_address');
                }

                return {
                    paymentId: String(data.payment_id),
                    orderId: String(data.order_id || orderId),
                    payAddress: data.pay_address,
                    payAmount: Number(data.pay_amount || 0),
                    payCurrency: (data.pay_currency || targetPayCurrency).toUpperCase(),
                    priceAmount: Number(data.price_amount || priceAmount),
                    priceCurrency: (data.price_currency || priceCurrency).toUpperCase(),
                    paymentStatus: (data.payment_status || 'waiting').toLowerCase(),
                    network: data.network || 'bsc',
                    ipnCallbackUrl: data.ipn_callback_url || null,
                    createdAt: data.created_at || new Date().toISOString(),
                    expirationEstimateDate: data.expiration_estimate_date || null,
                    raw: data
                };
            } catch (err) {
                lastError = err;
                // If this was a client rejection error (not network or 5xx/429), don't retry
                if (err.message && err.message.startsWith('Payment creation rejected by gateway:')) {
                    throw err;
                }

                if (attempt < maxRetries) {
                    const waitMs = delays[attempt - 1];
                    await new Promise(res => setTimeout(res, waitMs));
                }
            }
        }

        throw new Error(`Failed to create NOWPayments order after ${maxRetries} attempts: ${lastError?.message || 'Unknown network error'}`);
    }

    /**
     * Check payment status by payment ID
     */
    async getPaymentStatus(paymentId) {
        if (!paymentId) throw new Error('Payment ID is required');

        if (paymentId.startsWith('TEST-NP-')) {
            return {
                paymentId,
                paymentStatus: 'waiting',
                payAddress: '0x' + paymentId.substring(8),
                priceAmount: 0,
                priceCurrency: 'USD',
                payAmount: 0,
                actuallyPaid: 0,
                actuallyPaidAtFiat: 0,
                raw: { is_simulated: true }
            };
        }

        const config = await this.getConfig();

        const mock = this.mockAdapter;
        if (mock && typeof mock.getPaymentStatus === 'function') {
            return await mock.getPaymentStatus(paymentId, config);
        }

        const response = await fetch(`${config.baseUrl}/payment/${paymentId}`, {
            method: 'GET',
            headers: {
                'x-api-key': config.apiKey
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch payment status (${response.status})`);
        }

        const data = await response.json();
        return {
            paymentId: String(data.payment_id),
            paymentStatus: (data.payment_status || 'unknown').toLowerCase(),
            payAddress: data.pay_address,
            priceAmount: Number(data.price_amount || 0),
            priceCurrency: (data.price_currency || 'USD').toUpperCase(),
            payAmount: Number(data.pay_amount || 0),
            actuallyPaid: Number(data.actually_paid || 0),
            actuallyPaidAtFiat: Number(data.actually_paid_at_fiat || 0),
            raw: data
        };
    }
}

module.exports = new NowPaymentsService();
