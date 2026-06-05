const { loadDb, sendError, sendJson, storageMode } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    const db = await loadDb();
    return sendJson(res, 200, { ...db, storageMode: storageMode() });
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
