const { audit, calculateResults, readDb, sendError, sendJson, upsertMark, validateMarks, writeDb } = require("./_lib/shule");

module.exports = function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    const db = readDb();
    const body = req.body || {};
    const errors = validateMarks(db, body);
    if (errors.length) {
      db.uploadErrors = errors;
      db.audit.push(audit("Subject Teacher", "Rejected marks upload", "-", `${errors.length} validation issue(s)`));
      writeDb(db);
      return sendJson(res, 422, { ok: false, errors });
    }
    for (const mark of body.marks || []) upsertMark(db, {
      ...mark,
      academicYear: body.academicYear,
      term: body.term,
      examType: body.examType,
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId: body.teacherId
    });
    db.uploadErrors = [];
    db.uploadBatches.push({
      id: `batch-${Date.now()}`,
      teacherId: body.teacherId,
      classId: body.classId,
      subjectId: body.subjectId,
      academicYear: body.academicYear,
      term: body.term,
      examType: body.examType,
      status: "complete",
      rows: body.marks.length,
      validRows: body.marks.length,
      errorRows: 0,
      uploadedAt: new Date().toISOString()
    });
    db.audit.push(audit("Subject Teacher", "Uploaded marks", "-", `${body.marks.length} mark(s)`));
    writeDb(db);
    return sendJson(res, 200, { ok: true, results: calculateResults(db) });
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
