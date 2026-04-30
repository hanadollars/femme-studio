// api/check-payment.js — Femme Studio
// CommonJS – no npm packages needed

async function kvGet(key) {
  const r = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const data = await r.json();
  return data.result;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const orderCode = req.query.code || req.query.orderCode;
  if (!orderCode) return res.status(400).json({ error: 'Thiếu mã đơn hàng' });

  try {
    const raw = await kvGet(`order:${orderCode}`);
    if (!raw) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

    const order = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (order.status === 'paid') {
      return res.status(200).json({
        status: 'paid',
        fileUrl: order.fileUrl || process.env.FILE_URL || '#',
        orderCode,
        name: order.name,
      });
    }

    return res.status(200).json({ status: 'pending' });
  } catch (err) {
    console.error('[check-payment] Lỗi:', err.message);
    return res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};
