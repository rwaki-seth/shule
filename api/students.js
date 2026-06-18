const { addStudent, importStudents, loadDb, saveDb, secureStudentPhoto, sendError, sendJson } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    const db = await loadDb();
    const body = req.body || {};
    if (body.action === "import") {
      const result = importStudents(db, body);
      if (!result.ok) return sendJson(res, 422, result);
      await saveDb(db);
      return sendJson(res, 200, result);
    }
    if (body.action === "updatePhoto") {
      const student = await secureStudentPhoto(db, body);
      await saveDb(db);
      return sendJson(res, 200, student);
    }
    const student = addStudent(db, body);
    await saveDb(db);
    return sendJson(res, 201, student);
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
