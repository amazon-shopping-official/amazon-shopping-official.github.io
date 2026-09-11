const { kv } = require("@vercel/kv");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "POST") {
      const order = req.body;
      if (!order || !order.orderId) {
        return res.status(400).json({ error: "Invalid order data" });
      }
      const orders = (await kv.get("amazon_orders")) || [];
      orders.unshift(order);
      await kv.set("amazon_orders", orders);
      return res.status(200).json({ success: true });
    }

    if (req.method === "GET") {
      const orders = (await kv.get("amazon_orders")) || [];
      return res.status(200).json(orders);
    }

    if (req.method === "DELETE") {
      await kv.set("amazon_orders", []);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
};
