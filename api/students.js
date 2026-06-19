const { getSession, requireRoles, validateCsrf } = require("./_lib/auth");
const { addStudent, importStudents, loadDb, saveDb, secureStudentPhoto, sendError, sendJson, updateStudentDetails } = require("./_lib/shule");

const SCHOOL_ADMIN_ROLES = ["Super Admin", "School Admin"];

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    validateCsrf(req);
    const session = await getSession(req, res);
    const db = await loadDb();
    const body = req.body || {};
    if (body.action === "previewImport") {
      requireRoles(session, SCHOOL_ADMIN_ROLES);
      const result = importStudents(db, body, { commit: false });
      return sendJson(res, result.ok ? 200 : 422, result);
    }
    if (body.action === "import") {
      requireRoles(session, SCHOOL_ADMIN_ROLES);
      const result = importStudents(db, body);
      if (!result.ok) return sendJson(res, 422, result);
      await saveDb(db);
      return sendJson(res, 200, result);
    }
    if (body.action === "updatePhoto") {
      requireRoles(session, SCHOOL_ADMIN_ROLES);
      const student = await secureStudentPhoto(db, { ...body, updatedBy: session.name });
      await saveDb(db);
      return sendJson(res, 200, student);
    }
    if (body.action === "updateDetails") {
      requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS", "Class Teacher"]);
      let permittedBody = body;
      if (session.role === "Class Teacher") {
        permittedBody = { studentId: body.studentId, reportComments: { classTeacher: body.reportComments?.classTeacher || "" } };
      } else if (session.role === "DOS") {
        permittedBody = { studentId: body.studentId, reportComments: { dos: body.reportComments?.dos || "" } };
      } else if (session.role === "Head Teacher") {
        permittedBody = { studentId: body.studentId, reportComments: { headTeacher: body.reportComments?.headTeacher || "" } };
      }
      const student = updateStudentDetails(db, permittedBody);
      await saveDb(db);
      return sendJson(res, 200, student);
    }
    requireRoles(session, SCHOOL_ADMIN_ROLES);
    const student = addStudent(db, body);
    await saveDb(db);
    return sendJson(res, 201, student);
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message || "Request failed");
  }
};
