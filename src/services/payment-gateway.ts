import crypto from 'crypto'

// ── PayPal ──────────────────────────────────────────────────────────

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) throw new Error('PayPal credentials not configured')

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

export async function createPayPalOrder(amount: number, currency: string, description: string) {
  const token = await getPayPalToken()
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: currency, value: amount.toFixed(2) },
        description,
      }],
      application_context: {
        return_url: `${process.env.NEXTAUTH_URL}/payment/success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      },
    }),
  })
  const order = await res.json()
  const approveLink = order.links?.find((l: any) => l.rel === 'approve')?.href
  return { orderId: order.id, approveUrl: approveLink }
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getPayPalToken()
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await res.json()
  return {
    status: data.status === 'COMPLETED' ? 'completed' : 'failed',
    captureId: data.purchase_units?.[0]?.payments?.captures?.[0]?.id,
  }
}

// ── VNPay ───────────────────────────────────────────────────────────

export function createVNPayUrl(
  amount: number,
  orderId: string,
  orderInfo: string,
  ipAddr: string
): string {
  const tmnCode = process.env.VNPAY_TMN_CODE
  const hashSecret = process.env.VNPAY_HASH_SECRET
  const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
  const returnUrl = `${process.env.NEXTAUTH_URL}/api/payments/vnpay/callback`

  if (!tmnCode || !hashSecret) throw new Error('VNPay credentials not configured')

  const createDate = new Date().toISOString().replace(/[-T:Z.]/g, '').slice(0, 14)

  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(amount * 100), // VNPay uses cents
    vnp_CreateDate: createDate,
    vnp_CurrCode: 'VND',
    vnp_IpAddr: ipAddr,
    vnp_Locale: 'vn',
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'subscription',
    vnp_ReturnUrl: returnUrl,
    vnp_TxnRef: orderId,
  }

  // Sort and create hash
  const sortedKeys = Object.keys(params).sort()
  const queryString = sortedKeys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&')
  const hmac = crypto.createHmac('sha512', hashSecret)
  hmac.update(queryString)
  const secureHash = hmac.digest('hex')

  return `${vnpUrl}?${queryString}&vnp_SecureHash=${secureHash}`
}

export function verifyVNPayCallback(query: Record<string, string>): {
  valid: boolean
  orderId: string
  responseCode: string
} {
  const hashSecret = process.env.VNPAY_HASH_SECRET
  if (!hashSecret) return { valid: false, orderId: '', responseCode: '' }

  const secureHash = query.vnp_SecureHash
  const params = { ...query }
  delete params.vnp_SecureHash
  delete params.vnp_SecureHashType

  const sortedKeys = Object.keys(params).sort()
  const queryString = sortedKeys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&')
  const hmac = crypto.createHmac('sha512', hashSecret)
  hmac.update(queryString)
  const checkHash = hmac.digest('hex')

  return {
    valid: secureHash === checkHash,
    orderId: query.vnp_TxnRef || '',
    responseCode: query.vnp_ResponseCode || '',
  }
}
