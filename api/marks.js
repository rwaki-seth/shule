const { audit, calculateResults, isDuplicateMark, loadDb, saveDb, sendError, sendJson, upsertMark, validateMarks } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    const db = await loadDb();
    const body = req.body || {};
    const errors = validateMarks(db, body);
    if (errors.length) {
      db.uploadErrors = errors;
      db.audit.push(audit("Subject Teacher", "Rejected marks upload", "-", `${errors.length} validation issue(s)`));
      await saveDb(db);
      return sendJson(res, 422, { ok: false, errors });
    }
    let saved = 0;
    let skippedDuplicates = 0;
    for (const mark of body.marks || []) {
      const payload = {
        ...mark,
        academicYear: body.academicYear,
        term: body.term,
        examType: body.examType,
        classId: body.classId,
        subjectId: body.subjectId,
        teacherId: body.teacherId
      };
      if (isDuplicateMark(db, payload)) {
        skippedDuplicates += 1;
        continue;
      }
      upsertMark(db, payload);
      saved += 1;
    }
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
      validRows: saved,
      errorRows: 0,
      skippedDuplicates,
      uploadedAt: new Date().toISOString()
    });
    db.audit.push(audit("Subject Teacher", "Uploaded marks", "-", `${saved} mark(s) saved, ${skippedDuplicates} duplicate(s) skipped`));
    await saveDb(db);
    return sendJson(res, 200, {
      ok: true,
      saved,
      skippedDuplicates,
      duplicateWarning: skippedDuplicates ? `${skippedDuplicates} duplicate mark record(s) were already in the system and were skipped.` : "",
      results: calculateResults(db)
    });
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
