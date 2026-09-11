// Vercel Serverless Function: /api/orders
// Uses Supabase as the persistent orders database (free tier, no credit card needed)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ error: "Database not configured (set SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel env vars)" });
  }

  const sbHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "apikey": SUPABASE_KEY
  };

  try {
    // ----- POST: Save a new order -----
    if (req.method === "POST") {
      const o = req.body;
      if (!o || !o.orderId) return res.status(400).json({ error: "Invalid order" });

      const r = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: "POST",
        headers: { ...sbHeaders, "Prefer": "return=minimal" },
        body: JSON.stringify({
          order_id: o.orderId,
          date: o.date,
          time: o.time,
          full_name: o.fullName,
          delivery_address: o.deliveryAddress,
          phone: o.phone,
          email: o.email,
          item: o.item,
          qty: o.qty,
          unit_price: o.unitPrice,
          total: o.total,
          payment_method: o.paymentMethod
        })
      });

      if (!r.ok) throw new Error(await r.text());
      return res.status(200).json({ success: true });
    }

    // ----- GET: Fetch all orders -----
    if (req.method === "GET") {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`, {
        headers: sbHeaders
      });

      if (!r.ok) throw new Error(await r.text());

      const rows = await r.json();
      const orders = rows.map(row => ({
        orderId: row.order_id,
        date: row.date,
        time: row.time,
        deliveryRange: "",
        fullName: row.full_name,
        deliveryAddress: row.delivery_address,
        phone: row.phone,
        email: row.email,
        item: row.item,
        qty: row.qty,
        unitPrice: row.unit_price,
        total: row.total,
        paymentMethod: row.payment_method
      }));

      return res.status(200).json(orders);
    }

    // ----- DELETE: Clear all orders -----
    if (req.method === "DELETE") {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?order_id=neq.null`, {
        method: "DELETE",
        headers: { ...sbHeaders, "Prefer": "return=minimal" }
      });

      if (!r.ok) throw new Error(await r.text());
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("API Error:", err.message);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
};
