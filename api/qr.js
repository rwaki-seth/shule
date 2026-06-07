const QRCode = require("qrcode");
const { loadDb, sendError, verifiedReport } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    const code = String(req.query?.code || "").trim();
    const db = await loadDb();
    verifiedReport(db, code);
    const url = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/#verify/${encodeURIComponent(code)}`;
    const svg = await QRCode.toString(url, { type: "svg", width: 140, margin: 1, errorCorrectionLevel: "M" });
    res.statusCode = 200;
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.end(svg);
  } catch (error) {
    return sendError(res, 404, error.message || "QR code unavailable");
  }
};
