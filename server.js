const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DATA_VERSION = 2;
const DEFAULT_DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "shule-mja-db.json")
  : path.join(DATA_DIR, "shule-db.json");
const DB_PATH = process.env.VERCEL ? DEFAULT_DB_PATH : process.env.SHULE_DB_PATH || DEFAULT_DB_PATH;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const SUBJECTS = [
  ["eng", "ENG", "English"],
  ["math", "MATH", "Mathematics"],
  ["sci", "SCI", "Science"],
  ["sst", "SST", "Social Studies"],
  ["re", "RE", "Religious Education"],
  ["lit1", "LIT I", "Literacy I"],
  ["lit2", "LIT II", "Literacy II"],
  ["read", "READ", "Reading"],
  ["write", "WRITE", "Writing"],
  ["ict", "ICT", "ICT"],
  ["arts", "ART", "Creative Arts"],
  ["pe", "PE", "Physical Education"]
].map(([id, code, name]) => ({ id, code, name, maxScore: 100 }));

function buildClasses() {
  const classes = [];
  for (let level = 1; level <= 7; level += 1) {
    for (const stream of ["East", "West"]) {
      classes.push({ id: `p${level}-${stream.toLowerCase()}`, level: `P${level}`, stream, name: `P${level} ${stream}` });
    }
  }
  return classes;
}

function seedData() {
  const classes = buildClasses();
  const students = [
    student("mja-001", "MJA/2022/001", "Amina Kato", "F", "2014-03-18", "p6-east", "Active", "Sarah Kato", "+256 700 111 001", 89, 1),
    student("mja-002", "MJA/2022/002", "Brian Okello", "M", "2014-07-02", "p6-east", "Active", "James Okello", "+256 700 111 002", 78, 2),
    student("mja-003", "MJA/2022/003", "Claire Nambi", "F", "2014-09-28", "p6-east", "Active", "Ruth Nambi", "+256 700 111 003", 94, 3),
    student("mja-004", "MJA/2022/004", "Daniel Ssebuggwawo", "M", "2013-11-08", "p6-east", "Active", "Peter Ssebuggwawo", "+256 700 111 004", 61, 4),
    student("mja-005", "MJA/2022/005", "Esther Namuli", "F", "2014-05-14", "p6-west", "Active", "Grace Namuli", "+256 700 111 005", 83, 5),
    student("mja-006", "MJA/2022/006", "Farouk Mutebi", "M", "2013-12-20", "p6-west", "Active", "Hassan Mutebi", "+256 700 111 006", 49, 6),
    student("mja-007", "MJA/2023/014", "Gloria Nansubuga", "F", "2015-01-12", "p5-east", "Active", "Agnes Nansubuga", "+256 700 111 007", 72, 7),
    student("mja-008", "MJA/2023/021", "Henry Mugisha", "M", "2015-06-11", "p5-west", "Active", "Moses Mugisha", "+256 700 111 008", 67, 8),
    student("mja-009", "MJA/2021/044", "Ivan Kiggundu", "M", "2013-02-21", "p7-east", "Active", "Joy Kiggundu", "+256 700 111 009", 81, 9),
    student("mja-010", "MJA/2021/052", "Joy Kirabo", "F", "2012-10-03", "p7-west", "Active", "Robert Kirabo", "+256 700 111 010", 76, 10),
    student("mja-011", "MJA/2020/017", "Kevin Lutaaya", "M", "2012-04-04", "p7-east", "Transferred", "Doreen Lutaaya", "+256 700 111 011", 58, 11),
    student("mja-012", "MJA/2021/071", "Lydia Akello", "F", "2013-08-19", "p7-west", "Inactive", "Margaret Akello", "+256 700 111 012", 42, 12)
  ];

  return {
    version: DATA_VERSION,
    school: {
      name: "MAKINDYE JUNIOR ACADEMY",
      shortName: "MJA",
      motto: "HEAD • HEART • HAND",
      academicYear: "2026",
      term: "Term 1",
      exam: "End of Term",
      address: "Makindye, Kampala",
      phone: "+256 700 000 000",
      email: "admin@mja.ac.ug"
    },
    academicYears: [{ id: "2026", name: "2026", active: true }],
    terms: [{ id: "t1", name: "Term 1", active: true }],
    examTypes: [
      { id: "bot", name: "Beginning of Term" },
      { id: "weekly", name: "Weekly Test" },
      { id: "mid", name: "Mid Term" },
      { id: "end", name: "End of Term" },
      { id: "mock", name: "Mock Exam" }
    ],
    classes,
    subjects: SUBJECTS,
    teachers: [
      { id: "t1", name: "Teacher A", role: "Subject Teacher", email: "teacher.a@mja.ac.ug" },
      { id: "t2", name: "Teacher B", role: "Subject Teacher", email: "teacher.b@mja.ac.ug" },
      { id: "t3", name: "Teacher C", role: "Class Teacher", email: "teacher.c@mja.ac.ug" },
      { id: "dos", name: "Director of Studies", role: "Director of Studies", email: "dos@mja.ac.ug" }
    ],
    teacherAssignments: [
      assignment("t1", "p6-east", "math"),
      assignment("t1", "p6-west", "math"),
      assignment("t2", "p6-east", "eng"),
      assignment("t2", "p6-west", "eng"),
      assignment("t3", "p6-east", "sci"),
      assignment("t3", "p6-west", "sst")
    ],
    students,
    marks: buildMarks(students),
    gradingScale: [
      { grade: "D1", min: 90, max: 100, aggregate: 1, comment: "Excellent" },
      { grade: "D2", min: 80, max: 89, aggregate: 2, comment: "Very Good" },
      { grade: "C3", min: 70, max: 79, aggregate: 3, comment: "Good" },
      { grade: "C4", min: 60, max: 69, aggregate: 4, comment: "Fairly Good" },
      { grade: "C5", min: 55, max: 59, aggregate: 5, comment: "Fair" },
      { grade: "C6", min: 50, max: 54, aggregate: 6, comment: "Satisfactory" },
      { grade: "P7", min: 40, max: 49, aggregate: 7, comment: "Pass" },
      { grade: "F9", min: 0, max: 39, aggregate: 9, comment: "Fail" }
    ],
    deadlines: [
      deadline("p6-east", "math", "2026-06-12T17:00:00+03:00", "complete"),
      deadline("p6-east", "eng", "2026-06-12T17:00:00+03:00", "complete"),
      deadline("p6-east", "sci", "2026-06-12T17:00:00+03:00", "pending"),
      deadline("p6-east", "sst", "2026-06-03T17:00:00+03:00", "late"),
      deadline("p6-west", "math", "2026-06-12T17:00:00+03:00", "complete"),
      deadline("p6-west", "eng", "2026-06-12T17:00:00+03:00", "pending")
    ],
    uploadBatches: [
      { id: "batch-001", teacherId: "t1", classId: "p6-east", subjectId: "math", rows: 4, validRows: 4, errorRows: 0, uploadedAt: "2026-06-03T09:20:00+03:00" },
      { id: "batch-002", teacherId: "t2", classId: "p6-east", subjectId: "eng", rows: 4, validRows: 3, errorRows: 1, uploadedAt: "2026-06-03T10:05:00+03:00" }
    ],
    uploadErrors: [
      { batchId: "batch-002", rowNumber: 5, admissionNo: "MJA/2022/099", errorType: "Missing Student", errorMessage: "Admission number does not exist", timestamp: "2026-06-03T10:05:21+03:00" }
    ],
    comments: {
      teacher: "Shows steady effort and should keep practicing weaker subject areas.",
      headteacher: "A promising learner. Parent support and consistent revision are encouraged."
    },
    activities: ["Debate", "Football", "Music", "Scouts"],
    audit: [
      { user: "Director of Studies", action: "Generated demo reports", timestamp: "2026-06-03T14:20:00+03:00", previousValue: "-", newValue: "MJA Term 1 reports" }
    ]
  };
}

function student(id, admissionNo, name, gender, dob, classId, status, guardian, contact, attendance, seed) {
  return {
    id,
    admissionNo,
    name,
    gender,
    dateOfBirth: dob,
    guardian,
    contact,
    classId,
    status,
    admissionDate: "2022-02-07",
    notes: status === "Active" ? "Active learner" : "Retained for historical records",
    photo: "",
    attendance,
    conduct: seed % 3 === 0 ? "Excellent" : "Good",
    competencies: {
      Communication: 3 + (seed % 3),
      Leadership: 2 + (seed % 4),
      Creativity: 3 + (seed % 2),
      Discipline: 3 + (seed % 3),
      Teamwork: 2 + (seed % 4),
      Responsibility: 3 + (seed % 3)
    }
  };
}

function assignment(teacherId, classId, subjectId) {
  return { id: `${teacherId}-${classId}-${subjectId}`, teacherId, classId, subjectId };
}

function deadline(classId, subjectId, dueAt, status) {
  return { id: `${classId}-${subjectId}`, academicYear: "2026", term: "Term 1", examType: "End of Term", classId, subjectId, dueAt, status, lockAfterDeadline: true };
}

function buildMarks(students) {
  const activeStudents = students.filter((item) => item.status === "Active");
  const baseScores = {
    "mja-001": [88, 82, 79, 85, 76, 84, 81, 90, 87, 78, 80, 92],
    "mja-002": [74, 80, 67, 72, 70, 76, 73, 82, 75, 69, 77, 88],
    "mja-003": [94, 92, 89, 91, 86, 90, 88, 96, 93, 85, 91, 95],
    "mja-004": [61, 58, 55, 62, 50, 57, 54, 63, 59, 48, 60, 74],
    "mja-005": [82, 86, 77, 80, 73, 79, 76, 88, 84, 71, 82, 90],
    "mja-006": [45, 52, 39, 47, 42, 49, 44, 55, 50, 38, 53, 64],
    "mja-007": [72, 68, 70, 66, 71, 73, 69, 75, 74, 65, 70, 82],
    "mja-008": [65, 70, 61, 63, 60, 66, 64, 71, 69, 62, 68, 78],
    "mja-009": [84, 79, 82, 78, 80, 83, 81, 86, 85, 77, 82, 91],
    "mja-010": [77, 74, 75, 72, 76, 78, 73, 80, 79, 70, 74, 86]
  };
  const marks = [];
  for (const learner of activeStudents) {
    const scores = baseScores[learner.id] || baseScores["mja-004"];
    SUBJECTS.forEach((subject, index) => {
      const finalMark = scores[index];
      const status = learner.id === "mja-006" && ["sci", "ict"].includes(subject.id) ? "Missing" : "Captured";
      marks.push({
        studentId: learner.id,
        subjectId: subject.id,
        classId: learner.classId,
        academicYear: "2026",
        term: "Term 1",
        examType: "End of Term",
        bot: Math.max(0, finalMark - 7),
        mid: Math.max(0, finalMark - 3),
        end: status === "Captured" ? finalMark : null,
        score: status === "Captured" ? finalMark : null,
        status,
        remarks: status === "Captured" ? "Captured" : "Awaiting valid mark"
      });
    });
  }
  return marks;
}

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    writeDb(seedData());
    return;
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  if (db.version !== DATA_VERSION || db.school?.name !== "MAKINDYE JUNIOR ACADEMY") {
    writeDb(seedData());
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function gradeFor(score, scale) {
  if (score === null || score === undefined || score === "") return { grade: "X", aggregate: null, comment: "Missing" };
  const numericScore = Number(score);
  return scale.find((row) => numericScore >= row.min && numericScore <= row.max) || scale[scale.length - 1];
}

function calculateResults(db) {
  const activeStudents = db.students.filter((student) => student.status === "Active");
  const marksByStudent = new Map();
  for (const mark of db.marks) {
    if (!marksByStudent.has(mark.studentId)) marksByStudent.set(mark.studentId, new Map());
    marksByStudent.get(mark.studentId).set(mark.subjectId, mark);
  }

  const students = activeStudents.map((student) => {
    const classInfo = db.classes.find((item) => item.id === student.classId) || {};
    const studentMarks = marksByStudent.get(student.id) || new Map();
    const subjects = db.subjects.map((subject) => {
      const mark = studentMarks.get(subject.id);
      const status = mark?.status || "Missing";
      const score = status === "Captured" ? Number(mark.score) : null;
      const grade = gradeFor(score, db.gradingScale);
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        code: subject.code,
        bot: mark?.bot ?? null,
        mid: mark?.mid ?? null,
        end: mark?.end ?? null,
        score,
        status,
        grade: status === "Absent" ? "ABS" : status === "Exempted" ? "EX" : grade.grade,
        aggregate: status === "Captured" ? grade.aggregate : null,
        comment: status === "Captured" ? grade.comment : status
      };
    });
    const captured = subjects.filter((subject) => subject.status === "Captured");
    const missing = subjects.filter((subject) => subject.status !== "Captured");
    const total = captured.reduce((sum, subject) => sum + subject.score, 0);
    const average = captured.length ? total / captured.length : 0;
    const aggregate = captured.reduce((sum, subject) => sum + Number(subject.aggregate || 0), 0);
    const failedSubjects = subjects.filter((subject) => subject.grade === "F9").length;
    const promotion = missing.length ? "MANUAL REVIEW" : average >= 50 && failedSubjects <= 2 ? "PROMOTED" : "REPEAT";
    return {
      ...student,
      className: classInfo.level,
      stream: classInfo.stream,
      subjects,
      total,
      average: round(average),
      aggregate,
      overallGrade: gradeFor(average, db.gradingScale).grade,
      failedSubjects,
      missingSubjects: missing.length,
      promotion,
      verificationCode: `MJA-${db.school.academicYear}-${student.admissionNo.replaceAll("/", "")}`
    };
  });

  const ranked = assignRanks(students);
  const subjectStats = db.subjects.map((subject) => {
    const captured = db.marks.filter((mark) => mark.subjectId === subject.id && mark.status === "Captured");
    const scores = captured.map((mark) => Number(mark.score));
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      entries: scores.length,
      average: round(scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0),
      highest: scores.length ? Math.max(...scores) : 0,
      lowest: scores.length ? Math.min(...scores) : 0
    };
  });

  const expectedUploads = db.deadlines.length;
  const completedUploads = db.deadlines.filter((item) => item.status === "complete").length;
  const pendingUploads = db.deadlines.filter((item) => item.status === "pending").length;
  const lateUploads = db.deadlines.filter((item) => item.status === "late").length;
  const missingMarks = db.marks.filter((mark) => mark.status === "Missing").length;
  const classAverage = ranked.length ? ranked.reduce((sum, student) => sum + student.average, 0) / ranked.length : 0;

  return {
    school: db.school,
    counts: {
      students: db.students.length,
      activeStudents: activeStudents.length,
      inactiveStudents: db.students.length - activeStudents.length,
      subjects: db.subjects.length,
      teachers: db.teachers.length,
      marks: db.marks.length
    },
    monitoring: {
      expectedUploads,
      completedUploads,
      pendingUploads,
      lateUploads,
      missingMarks,
      validationFailures: db.uploadErrors.length,
      completionRate: expectedUploads ? round((completedUploads / expectedUploads) * 100) : 0
    },
    classAverage: round(classAverage),
    subjectStats,
    students: ranked,
    deadlines: enrichDeadlines(db),
    uploadErrors: db.uploadErrors,
    uploadBatches: db.uploadBatches,
    audit: db.audit
  };
}

function assignRanks(students) {
  const overall = [...students].sort((a, b) => b.average - a.average || b.total - a.total || a.name.localeCompare(b.name));
  overall.forEach((student, index) => {
    student.position = index + 1;
  });
  const classGroups = groupBy(students, (student) => student.className);
  for (const list of classGroups.values()) {
    [...list].sort((a, b) => b.average - a.average).forEach((student, index) => {
      student.classPosition = index + 1;
    });
  }
  const streamGroups = groupBy(students, (student) => `${student.className}-${student.stream}`);
  for (const list of streamGroups.values()) {
    [...list].sort((a, b) => b.average - a.average).forEach((student, index) => {
      student.streamPosition = index + 1;
    });
  }
  return overall;
}

function enrichDeadlines(db) {
  return db.deadlines.map((deadlineRow) => ({
    ...deadlineRow,
    className: db.classes.find((item) => item.id === deadlineRow.classId)?.name || deadlineRow.classId,
    subjectName: db.subjects.find((item) => item.id === deadlineRow.subjectId)?.name || deadlineRow.subjectId
  }));
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function round(value) {
  return Math.round(Number(value) * 10) / 10;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function upsertMark(db, studentId, subjectId, score, status = "Captured") {
  const numericScore = score === null || status !== "Captured" ? null : Number(score);
  if (status === "Captured" && (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100)) {
    throw new Error("Score must be between 0 and 100");
  }
  const student = db.students.find((item) => item.id === studentId);
  if (!student) throw new Error("Student not found");
  const existing = db.marks.find((mark) => mark.studentId === studentId && mark.subjectId === subjectId);
  if (existing) {
    existing.score = numericScore;
    existing.end = numericScore;
    existing.status = status;
  } else {
    db.marks.push({
      studentId,
      subjectId,
      classId: student.classId,
      academicYear: db.school.academicYear,
      term: db.school.term,
      examType: db.school.exam,
      bot: null,
      mid: null,
      end: numericScore,
      score: numericScore,
      status,
      remarks: "Captured"
    });
  }
}

async function handleApi(req, res, pathname) {
  const db = readDb();

  if (req.method === "GET" && pathname === "/api/bootstrap") return sendJson(res, 200, db);
  if (req.method === "GET" && pathname === "/api/results") return sendJson(res, 200, calculateResults(db));

  if (req.method === "POST" && pathname === "/api/school") {
    const body = await parseBody(req);
    db.school = { ...db.school, ...body };
    db.audit.push({ user: "School Admin", action: "Updated school profile", timestamp: new Date().toISOString(), previousValue: "-", newValue: db.school.name });
    writeDb(db);
    return sendJson(res, 200, db.school);
  }

  if (req.method === "POST" && pathname === "/api/students") {
    const body = await parseBody(req);
    const studentRow = {
      id: body.id || `mja-${Date.now()}`,
      admissionNo: String(body.admissionNo || "").trim(),
      name: String(body.name || "").trim(),
      gender: body.gender || "",
      dateOfBirth: body.dateOfBirth || "",
      guardian: body.guardian || "",
      contact: body.contact || "",
      classId: body.classId || db.classes[0]?.id,
      status: body.status || "Active",
      admissionDate: body.admissionDate || new Date().toISOString().slice(0, 10),
      notes: body.notes || "",
      attendance: Number(body.attendance || 0),
      conduct: "Good",
      competencies: { Communication: 3, Leadership: 3, Creativity: 3, Discipline: 3, Teamwork: 3, Responsibility: 3 }
    };
    if (!studentRow.admissionNo || !studentRow.name) throw new Error("Admission number and name are required");
    db.students.push(studentRow);
    db.audit.push({ user: "School Admin", action: "Created student", timestamp: new Date().toISOString(), previousValue: "-", newValue: studentRow.admissionNo });
    writeDb(db);
    return sendJson(res, 201, studentRow);
  }

  if (req.method === "POST" && pathname === "/api/marks") {
    const body = await parseBody(req);
    if (Array.isArray(body.marks)) {
      for (const mark of body.marks) upsertMark(db, mark.studentId, mark.subjectId, mark.score, mark.status || "Captured");
    } else {
      upsertMark(db, body.studentId, body.subjectId, body.score, body.status || "Captured");
    }
    db.audit.push({ user: "Subject Teacher", action: "Upserted marks", timestamp: new Date().toISOString(), previousValue: "-", newValue: Array.isArray(body.marks) ? `${body.marks.length} marks` : "1 mark" });
    writeDb(db);
    return sendJson(res, 200, { ok: true, results: calculateResults(db) });
  }

  sendError(res, 404, "API route not found");
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
    } else {
      serveStatic(req, res, url.pathname);
    }
  } catch (error) {
    sendError(res, 400, error.message || "Request failed");
  }
});

server.listen(PORT, HOST, () => {
  ensureDb();
  console.log(`Shule MJA running at http://localhost:${PORT}`);
});
