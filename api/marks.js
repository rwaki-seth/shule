const { getSession, requireRoles, validateCsrf } = require("./_lib/auth");
const { audit, calculateResults, isDuplicateMark, loadDb, saveDb, sendError, sendJson, transitionAssessmentWorkflow, upsertMark, validateMarks } = require("./_lib/shule");

const TEACHER_ROLES = new Set(["Class Teacher", "Subject Teacher"]);
const SCHOOL_ADMIN_ROLES = ["Super Admin", "School Admin"];

function requireOwnTeacherContext(db, session, body) {
  if (!TEACHER_ROLES.has(session.role)) return;
  const teacher = db.teachers.find((item) =>
    String(item.email || "").trim().toLowerCase() === String(session.email || "").trim().toLowerCase()
  );
  if (!teacher || teacher.id !== body.teacherId) {
    const error = new Error("Teachers may only upload marks under their own assigned account");
    error.statusCode = 403;
    throw error;
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    validateCsrf(req);
    const session = await getSession(req, res);
    requireRoles(session, ["Super Admin", "School Admin", "DOS", "Class Teacher", "Subject Teacher"]);
    const db = await loadDb();
    const body = req.body || {};
    if (body.action === "workflow") {
      const workflow = transitionAssessmentWorkflow(db, body, session);
      await saveDb(db);
      return sendJson(res, 200, { ok: true, workflow });
    }
    const batches = body.mode === "multi" ? (body.batches || []) : [body];
    if (body.mode === "multi") requireRoles(session, SCHOOL_ADMIN_ROLES);
    if (!batches.length) throw new Error("No marks batches were supplied");
    const errors = [];
    for (const batch of batches) {
      const context = {
        ...batch,
        academicYear: batch.academicYear || body.academicYear,
        term: batch.term || body.term,
        examType: batch.examType || body.examType,
        subjectId: batch.subjectId || body.subjectId,
        teacherId: batch.teacherId || body.teacherId
      };
      requireOwnTeacherContext(db, session, context);
      errors.push(...validateMarks(db, context));
    }
    if (errors.length) {
      db.uploadErrors = errors;
      db.audit.push(audit(session.name, "Rejected marks upload", "-", `${errors.length} validation issue(s)`));
      await saveDb(db);
      return sendJson(res, 422, { ok: false, errors });
    }
    let saved = 0;
    let skippedDuplicates = 0;
    for (const batch of batches) {
      let batchSkippedDuplicates = 0;
      const context = {
        ...batch,
        academicYear: batch.academicYear || body.academicYear,
        term: batch.term || body.term,
        examType: batch.examType || body.examType,
        subjectId: batch.subjectId || body.subjectId,
        teacherId: batch.teacherId || body.teacherId
      };
      for (const mark of context.marks || []) {
        const payload = {
          ...mark,
          academicYear: context.academicYear,
          term: context.term,
          examType: context.examType,
          classId: context.classId,
          subjectId: context.subjectId,
          teacherId: context.teacherId,
          updatedBy: session.name
        };
        if (isDuplicateMark(db, payload)) {
          skippedDuplicates += 1;
          batchSkippedDuplicates += 1;
          continue;
        }
        upsertMark(db, payload);
        saved += 1;
      }
      db.uploadBatches.push({
        id: `batch-${Date.now()}-${context.classId}`,
        teacherId: context.teacherId,
        classId: context.classId,
        subjectId: context.subjectId,
        academicYear: context.academicYear,
        term: context.term,
        examType: context.examType,
        status: "complete",
        rows: context.marks.length,
        validRows: context.marks.length - batchSkippedDuplicates,
        errorRows: 0,
        skippedDuplicates: batchSkippedDuplicates,
        uploadedAt: new Date().toISOString()
      });
    }
    db.uploadErrors = [];
    db.audit.push(audit(session.name, "Uploaded marks", "-", `${saved} mark(s) saved, ${skippedDuplicates} duplicate(s) skipped across ${batches.length} class(es)`));
    await saveDb(db);
    return sendJson(res, 200, {
      ok: true,
      saved,
      skippedDuplicates,
      duplicateWarning: skippedDuplicates ? `${skippedDuplicates} duplicate mark record(s) were already in the system and were skipped.` : "",
      results: calculateResults(db)
    });
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message || "Request failed");
  }
};
