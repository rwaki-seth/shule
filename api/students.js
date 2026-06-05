const { addStudent, loadDb, saveDb, sendError, sendJson } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    const db = await loadDb();
    const student = addStudent(db, req.body || {});
    await saveDb(db);
    return sendJson(res, 201, student);
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
