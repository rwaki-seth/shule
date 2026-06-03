const { readDb, sendError, sendJson, writeDb } = require("./_lib/shule");

module.exports = function handler(req, res) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed");
    const db = readDb();
    const body = req.body || {};
    const student = {
      id: body.id || `s${Date.now()}`,
      admissionNo: String(body.admissionNo || "").trim(),
      name: String(body.name || "").trim(),
      classId: body.classId || db.classes[0]?.id || "default",
      gender: body.gender || ""
    };
    if (!student.admissionNo || !student.name) throw new Error("Admission number and name are required");
    db.students.push(student);
    db.audit.push({ action: "student.create", studentId: student.id, at: new Date().toISOString() });
    writeDb(db);
    return sendJson(res, 201, student);
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
