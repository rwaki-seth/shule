const { getSession, requireRoles, validateCsrf } = require("./_lib/auth");
const { loadDb, saveDb, sendError, sendJson, updateSettings } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    validateCsrf(req);
    const session = await getSession(req, res);
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS"]);
    const db = await loadDb();
    const settings = updateSettings(db, req.body || {});
    await saveDb(db);
    return sendJson(res, 200, settings);
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message || "Request failed");
  }
};
