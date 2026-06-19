const { getSession, requireRoles, validateCsrf } = require("./_lib/auth");
const { approvePromotion, loadDb, rollbackPromotion, saveDb, sendError, sendJson } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    validateCsrf(req);
    const session = await getSession(req, res);
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS"]);
    const db = await loadDb();
    const body = req.body || {};
    if (body.action === "rollback") {
      requireRoles(session, ["Super Admin", "School Admin"]);
      const history = rollbackPromotion(db, { ...body, rolledBackBy: session.name });
      await saveDb(db);
      return sendJson(res, 200, history);
    }
    const history = approvePromotion(db, body);
    await saveDb(db);
    return sendJson(res, 200, history);
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message || "Request failed");
  }
};
