const { readDb, saveDeadline, sendError, sendJson, writeDb } = require("./_lib/shule");

module.exports = function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    const db = readDb();
    const deadline = saveDeadline(db, req.body || {});
    writeDb(db);
    return sendJson(res, 200, deadline);
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
