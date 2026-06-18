const { loadDb, sendError, sendJson, storageStatus } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    await loadDb();
    return sendJson(res, 200, storageStatus());
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
