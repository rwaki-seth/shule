const { loadDb, saveDb, saveDeadline, sendError, sendJson } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    const db = await loadDb();
    const deadline = saveDeadline(db, req.body || {});
    await saveDb(db);
    return sendJson(res, 200, deadline);
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
