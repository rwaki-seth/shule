const { getSession, requireRoles } = require("../_lib/auth");
const { archiveReports, listReportArchive, loadDb, saveDb, sendError, sendJson } = require("../_lib/shule");

module.exports = async function handler(req, res) {
  try {
    const session = await getSession(req, res);
    const db = await loadDb();
    if (req.method === "GET") {
      requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS", "Class Teacher", "Viewer"]);
      return sendJson(res, 200, listReportArchive(db, req.query || {}));
    }
    if (req.method === "POST") {
      requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS", "Class Teacher"]);
      const result = archiveReports(db, req.body || {}, session);
      await saveDb(db);
      return sendJson(res, 201, result);
    }
    return sendError(res, 405, "Method not allowed");
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message || "Request failed");
  }
};
