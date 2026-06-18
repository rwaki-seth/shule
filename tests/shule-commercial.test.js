const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

process.env.SHULE_DB_PATH = path.join(os.tmpdir(), `shule-test-${process.pid}.json`);
process.env.SHULE_ALLOW_JSON_FALLBACK = "true";

const {
  addStudent,
  archiveReports,
  approvePromotion,
  calculateResults,
  importStudents,
  isDuplicateMark,
  listAudit,
  listMarks,
  listReportArchive,
  listStudents,
  readDb,
  validateMarks,
  verifiedReport,
  writeDb
} = require("../api/_lib/shule");
const { requireRoles, requireSession } = require("../api/_lib/auth");

const baseDb = readDb();

function freshDb() {
  return JSON.parse(JSON.stringify(baseDb));
}

test("login guards reject anonymous and wrong-role access", () => {
  assert.throws(() => requireSession(null), /Sign in is required/);
  assert.throws(() => requireRoles({ role: "Viewer" }, ["School Admin"]), /does not permit/);
  assert.equal(requireRoles({ role: "School Admin" }, ["School Admin"]).role, "School Admin");
});

test("student management can add and import learners", () => {
  const db = freshDb();
  const student = addStudent(db, {
    admissionNo: "MJA-TEST-001",
    name: "Commercial Test Learner",
    gender: "F",
    classLevel: "P6",
    stream: "East",
    status: "Active"
  });
  assert.equal(student.classId, "p6-east");

  const preview = importStudents(db, {
    mode: "multi",
    students: [{
      admissionNo: "MJA-TEST-002",
      name: "Imported Learner",
      gender: "M",
      classLevel: "P6",
      stream: "West",
      status: "Active"
    }]
  }, { commit: false });
  assert.equal(preview.ok, true);
  assert.equal(preview.created, 1);
});

test("student import skips exact duplicates already in the system", () => {
  const db = freshDb();
  const existing = db.students.find((student) => student.admissionNo === "MJA-1003");
  const result = importStudents(db, {
    students: [{
      admissionNo: existing.admissionNo,
      studentId: existing.studentId,
      name: existing.name,
      gender: existing.gender,
      dateOfBirth: existing.dateOfBirth,
      classLevel: existing.classLevel,
      stream: existing.stream,
      house: existing.house,
      guardian: existing.guardian,
      contact: existing.contact,
      status: existing.status,
      admissionDate: existing.admissionDate,
      attendance: existing.attendance,
      notes: existing.notes
    }]
  }, { commit: false });
  assert.equal(result.created, 0);
  assert.equal(result.updated, 0);
  assert.equal(result.skipped, 1);
  assert.match(result.duplicateWarning, /skipped/);
});

test("marks upload validation catches invalid scores and accepts clean marks", () => {
  const db = freshDb();
  const context = {
    academicYear: db.school.academicYear,
    term: db.school.term,
    examType: db.school.exam,
    classId: "p6-east",
    subjectId: "eng",
    teacherId: "t-eng",
    marks: [{ admissionNo: "MJA-1003", score: 150 }]
  };
  assert.match(validateMarks(db, context)[0].errorMessage, /0 and 100/);
  context.marks = [{ admissionNo: "MJA-1003", score: 75 }];
  assert.equal(validateMarks(db, context).length, 0);
});

test("marks upload detects exact duplicate mark records", () => {
  const db = freshDb();
  const existing = db.marks.find((mark) =>
    mark.studentId === "mja-1003" &&
    mark.subjectId === "eng" &&
    mark.academicYear === db.school.academicYear &&
    mark.term === db.school.term &&
    mark.examType === db.school.exam
  );
  assert.equal(isDuplicateMark(db, {
    admissionNo: "MJA-1003",
    subjectId: existing.subjectId,
    academicYear: existing.academicYear,
    term: existing.term,
    examType: existing.examType,
    score: existing.score,
    remarks: existing.remarks
  }), true);
});

test("promotion approval records history and preserves manual reviews", () => {
  const db = freshDb();
  const results = calculateResults(db);
  const review = results.students.find((student) => student.promotion === "MANUAL REVIEW");
  const history = approvePromotion(db, {
    approvedBy: "Automated Test",
    overrides: review ? [{ studentId: review.id, decision: "PROMOTED", targetClassId: review.classId, notes: "Reviewed" }] : []
  });
  assert.ok(history.id);
  assert.ok(Array.isArray(history.rows));
});

test("report generation archives reports and verification reopens the latest archive", () => {
  const db = freshDb();
  const student = calculateResults(db).students.find((item) => item.classId === "p6-east");
  const archived = archiveReports(db, { studentIds: [student.id] }, { name: "Automated Test" });
  assert.equal(archived.archived, 1);
  const verified = verifiedReport(db, student.verificationCode);
  assert.equal(verified.archiveId, archived.reports[0].id);
  assert.equal(verified.student.admissionNo, student.admissionNo);
});

test("server-side pagination and search return bounded result sets", () => {
  const db = freshDb();
  archiveReports(db, { classId: "p6-east" }, { name: "Automated Test" });
  assert.ok(listStudents(db, { search: "MJA", pageSize: 10 }).rows.length <= 10);
  assert.ok(listMarks(db, { classId: "p6-east", pageSize: 10 }).rows.length <= 10);
  assert.ok(listAudit(db, { search: "report", pageSize: 10 }).rows.length <= 10);
  assert.ok(listReportArchive(db, { search: "MJA", pageSize: 10 }).rows.length <= 10);
});
