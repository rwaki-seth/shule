const { calculateResults, readDb, sendError, sendJson, upsertMark, writeDb } = require("./_lib/shule");

module.exports = function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    const db = readDb();
    const body = req.body || {};
    if (Array.isArray(body.marks)) {
      for (const mark of body.marks) upsertMark(db, mark.studentId, mark.subjectId, mark.score);
    } else {
      upsertMark(db, body.studentId, body.subjectId, body.score);
    }
    db.audit.push({
      action: "marks.upsert",
      count: Array.isArray(body.marks) ? body.marks.length : 1,
      at: new Date().toISOString()
    });
    writeDb(db);
    return sendJson(res, 200, { ok: true, results: calculateResults(db) });
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
