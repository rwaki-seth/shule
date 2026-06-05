const { audit, loadDb, saveDb, sendError, sendJson } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    const db = await loadDb();
    db.school = { ...db.school, ...(req.body || {}) };
    db.audit.push(audit("School Admin", "Updated school profile", "-", db.school.name));
    await saveDb(db);
    return sendJson(res, 200, db.school);
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
