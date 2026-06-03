const { readDb, sendError, sendJson, writeDb } = require("./_lib/shule");

module.exports = function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    const db = readDb();
    db.school = { ...db.school, ...(req.body || {}) };
    db.audit.push({ action: "school.update", at: new Date().toISOString() });
    writeDb(db);
    return sendJson(res, 200, db.school);
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
