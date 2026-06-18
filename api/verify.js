const { loadDb, sendError, sendJson, verifiedReport } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    const db = await loadDb();
    return sendJson(res, 200, verifiedReport(db, req.query?.code));
  } catch (error) {
    return sendError(res, 404, error.message || "Report not found");
  }
};
