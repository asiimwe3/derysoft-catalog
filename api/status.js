export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  const key = process.env.PESAPAL_CONSUMER_KEY, secret = process.env.PESAPAL_CONSUMER_SECRET;
  const { ref = '' } = req.query || {};
  if (!key || !secret) return res.status(200).json({ ok:false, reason:'not_configured' });
  const base = process.env.PESAPAL_ENV === 'sandbox' ? 'https://cyb.pesapal.com' : 'https://pay.pesapal.com/v3';
  try {
    const auth = await fetch(base + '/api/Auth/GrantToken', {
      method:'POST',
      headers:{ 'Accept':'application/json','Content-Type':'application/json','Authorization':`Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` }
    });
    const { token } = await auth.json();
    const r = await fetch(`${base}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(ref)}`, {
      headers:{ 'Accept':'application/json','Authorization':`Bearer ${token}` }
    });
    const data = await r.json();
    return res.status(200).json({ ok:true, status: data.payment_status_description || data.status });
  } catch (e) { return res.status(200).json({ ok:false, reason:'error' }); }
}
