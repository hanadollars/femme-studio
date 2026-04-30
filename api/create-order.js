// api/create-order.js — Femme Studio
// CommonJS – no npm packages needed

async function kvSet(key, value, ex) {
  await fetch(process.env.KV_REST_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['SET', key, value, 'EX', ex]),
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Thiếu thông tin khách hàng' });
    }

    // Tạo mã đơn hàng: FMS + 4 ký tự
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'FMS';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const orderData = {
      code,
      name,
      email,
      phone: phone || '',
      amount: 199000,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await kvSet(`order:${code}`, JSON.stringify(orderData), 172800);

    const acbAccount = process.env.ACB_ACCOUNT;
    const accountName = encodeURIComponent(process.env.ACCOUNT_NAME || 'HANADOLA');
    const description = encodeURIComponent(`Thanh toan ${code}`);
    const qrUrl = `https://img.vietqr.io/image/ACB-${acbAccount}-compact2.png?amount=199000&addInfo=${description}&accountName=${accountName}`;

    return res.status(200).json({
      success: true,
      orderCode: code,
      qrUrl,
      amount: 199000,
      bankAccount: acbAccount,
      bankInfo: {
        account: acbAccount,
        name: process.env.ACCOUNT_NAME || 'HANADOLA',
      },
      description: `Thanh toan ${code}`,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Lỗi tạo đơn hàng' });
  }
};
