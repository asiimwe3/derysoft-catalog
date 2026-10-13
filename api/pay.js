// DerySoft pay gate — PesaPal API 3.0. Creates a UGX 10,000 order and returns the checkout URL.
// Env vars (set in Vercel): PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, PESAPAL_ENV (live|sandbox)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const key = process.env.PESAPAL_CONSUMER_KEY, secret = process.env.PESAPAL_CONSUMER_SECRET;
  const { product = 'Vendor site access', phone = '', email = '' } = req.body || {};
  if (!key || !secret) {
    return res.status(200).json({ ok:false, reason:'not_configured',
      instructions:'PesaPal keys not set yet. Pay UGX 10,000 via MoMo (message us on WhatsApp) and we send you the link instantly.' });
  }
  const base = process.env.PESAPAL_ENV === 'sandbox' ? 'https://cyb.pesapal.com' : 'https://pay.pesapal.com/v3';
  try {
    const auth = await fetch(base + '/api/Auth/GrantToken', {
      method:'POST',
      headers:{ 'Accept':'application/json','Content-Type':'application/json','Authorization':`Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` }
    });
    const { token } = await auth.json();
    const callback = (req.headers.origin || '') + '/paid.html';
    const order = {
      id: 'DSF-' + Date.now().toString(36).toUpperCase(),
      currency: 'UGX', amount: 10000,
      description: 'DerySoft: proceed to vendor site - ' + product,
      callback_url: callback,
      notification_type: 'GET',
      billing_address: { phone_number: phone, email_address: email || 'guest@derysoft.store' }
    };
    const r = await fetch(base + '/api/Transactions/SubmitOrderRequest', {
      method:'POST',
      headers:{ 'Accept':'application/json','Content-Type':'application/json','Authorization':`Bearer ${token}` },
      body: JSON.stringify({ order })
    });
    const data = await r.json();
    return res.status(200).json({ ok:true, redirect: data.redirect_url || data.payment_url, ref: data.order_tracking_id });
  } catch (e) {
    return res.status(200).json({ ok:false, reason:'error', instructions:'Payment service unreachable. Message us on WhatsApp to proceed.' });
  }
}
