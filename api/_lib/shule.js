const fs = require("fs");
const path = require("path");

const DATA_VERSION = 3;
const LOCAL_DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = process.env.SHULE_DB_PATH || (process.env.VERCEL ? path.join("/tmp", "shule-mvp2-db.json") : path.join(LOCAL_DATA_DIR, "shule-mvp2-db.json"));
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = readSupabaseKey();
let activeStorageMode = supabaseConfigured() ? "supabase" : "json";

const STUDENT_STATUSES = ["Active", "Graduated", "Transferred", "Suspended", "Expelled", "Dropped Out", "Deceased", "Inactive"];
const ROLES = ["Super Admin", "School Admin", "Head Teacher", "DOS", "Class Teacher", "Subject Teacher", "Viewer"];

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
].map(([id, code, name]) => ({ id, code, name, maxScore: 100, active: true }));

function buildClassLevels() {
  return Array.from({ length: 7 }, (_, index) => {
    const level = `P${index + 1}`;
    return { id: level.toLowerCase(), name: level, order: index + 1, active: true };
  });
}

function buildStreams() {
  return ["East", "West"].map((name) => ({ id: name.toLowerCase(), name, active: true }));
}

function buildClasses() {
  const classes = [];
  for (const level of buildClassLevels()) {
    for (const stream of buildStreams()) {
      classes.push({
        id: `${level.id}-${stream.id}`,
        level: level.name,
        stream: stream.name,
        levelId: level.id,
        streamId: stream.id,
        name: `${level.name} ${stream.name}`,
        active: true
      });
    }
  }
  return classes;
}

function seedData() {
  const classLevels = buildClassLevels();
  const streams = buildStreams();
  const classes = buildClasses();
  const students = buildStudentsFromTblStudent();
  const teachers = [
    teacher("t-dos", "Director of Studies", "DOS", "dos@mja.ac.ug"),
    teacher("t-head", "Head Teacher", "Head Teacher", "headteacher@mja.ac.ug"),
    teacher("t-ct-p6e", "P6 East Class Teacher", "Class Teacher", "p6east@mja.ac.ug"),
    teacher("t-eng", "Teacher English", "Subject Teacher", "english@mja.ac.ug"),
    teacher("t-math", "Teacher Mathematics", "Subject Teacher", "math@mja.ac.ug"),
    teacher("t-sci", "Teacher Science", "Subject Teacher", "science@mja.ac.ug"),
    teacher("t-sst", "Teacher SST", "Subject Teacher", "sst@mja.ac.ug")
  ];
  const assignments = [
    assignment("t-eng", "p6-east", "eng"),
    assignment("t-eng", "p6-west", "eng"),
    assignment("t-math", "p6-east", "math"),
    assignment("t-math", "p6-west", "math"),
    assignment("t-sci", "p6-east", "sci"),
    assignment("t-sci", "p6-west", "sci"),
    assignment("t-sst", "p6-east", "sst"),
    assignment("t-sst", "p6-west", "sst"),
    assignment("t-ct-p6e", "p6-east", "re")
  ];

  return {
    version: DATA_VERSION,
    school: {
      name: "MAKINDYE JUNIOR ACADEMY",
      shortName: "MJA",
      motto: "HEAD - HEART - HAND",
      academicYear: "2026",
      term: "Term 1",
      exam: "End of Term",
      address: "Salaama Munyonyo Road, Plot 42 and 43, Kampala",
      phone: "+256 700 000 000",
      email: "admin@mja.ac.ug",
      logoUrl: "",
      watermarkText: "MJA"
    },
    academicYears: [
      { id: "2026", name: "2026", startDate: "2026-02-02", endDate: "2026-12-04", active: true },
      { id: "2025", name: "2025", startDate: "2025-02-03", endDate: "2025-12-05", active: false }
    ],
    terms: [
      { id: "term-1", name: "Term 1", academicYearId: "2026", active: true },
      { id: "term-2", name: "Term 2", academicYearId: "2026", active: false },
      { id: "term-3", name: "Term 3", academicYearId: "2026", active: false }
    ],
    examTypes: [
      { id: "bot", name: "Beginning of Term", weight: 20, active: true },
      { id: "weekly", name: "Weekly Test", weight: 10, active: true },
      { id: "mid", name: "Mid Term", weight: 30, active: true },
      { id: "end", name: "End of Term", weight: 50, active: true },
      { id: "mock", name: "Mock Exam", weight: 100, active: true }
    ],
    classLevels,
    streams,
    classes,
    subjects: SUBJECTS,
    teachers,
    teacherAssignments: assignments,
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
    roles: ROLES.map((name) => ({ id: slug(name), name, active: true })),
    promotionRules: {
      id: "default",
      academicYear: "2026",
      minAverage: 50,
      maxFailedSubjects: 2,
      requireCompleteMarks: true,
      nextAcademicYear: "2027",
      status: "Draft"
    },
    students,
    marks: buildMarks(students),
    deadlines: buildDeadlines(),
    uploadBatches: [
      uploadBatch("batch-001", "t-math", "p6-east", "math", "complete", 8, 8, 0, "2026-06-03T09:20:00+03:00"),
      uploadBatch("batch-002", "t-eng", "p6-east", "eng", "complete", 8, 7, 1, "2026-06-03T10:05:00+03:00"),
      uploadBatch("batch-003", "t-math", "p6-west", "math", "complete", 8, 8, 0, "2026-06-03T11:40:00+03:00")
    ],
    uploadErrors: [
      errorRow(5, "MJA-9999", "Missing Student", "Admission number does not exist", "batch-002"),
      errorRow(8, "MJA-1015", "Teacher Assignment", "Teacher is not assigned to this class and subject", "batch-002")
    ],
    comments: {
      teacher: "Shows steady effort and should keep practicing weaker subject areas.",
      headteacher: "A promising learner. Parent support and consistent revision are encouraged."
    },
    activities: ["Debate", "Football", "Music", "Scouts"],
    audit: [
      audit("Director of Studies", "Generated demo reports", "-", "MJA Term 1 reports"),
      audit("School Admin", "Seeded MVP2 setup", "-", "tblStudent-compatible student structure")
    ],
    promotionHistory: []
  };
}

function buildStudentsFromTblStudent() {
  const rows = [
    ["MJA-1001", "Seth Singh", "Male", "2012-09-30", "P2", "Blue", "Mrs. Smith", "+256786876646", "Placeholder"],
    ["MJA-1002", "Andrew Cruz", "Male", "2010-05-11", "P1", "Red", "Mr. Ncube", "+256764731262", "Placeholder"],
    ["MJA-1003", "Martin Garcia", "Male", "2018-01-11", "P6", "Yellow", "Mr. Williams", "+256775391704", "Placeholder"],
    ["MJA-1004", "Isaac Cruz", "Male", "2013-10-25", "P3", "Blue", "Mr. Mirembe", "+256713197251", "Placeholder"],
    ["MJA-1005", "Grace Baker", "Female", "2013-11-09", "P5", "Green", "Mr. Nakitto", "+256768230889", "Placeholder"],
    ["MJA-1006", "Amina Mugume", "Female", "2013-04-15", "P7", "Green", "Mrs. Garcia", "+256790172933", "Placeholder"],
    ["MJA-1007", "Victor Hakim", "Male", "2010-11-23", "P7", "Blue", "Mr. Otieno", "+256735575435", "Placeholder"],
    ["MJA-1008", "Nora Kim", "Female", "2013-12-26", "P2", "Green", "Mrs. Mugisha", "+256777765822", "Placeholder"],
    ["MJA-1009", "Martin Patel", "Male", "2011-11-01", "P4", "Yellow", "Ms. Mugume", "+256728817870", "Placeholder"],
    ["MJA-1010", "Maria Ncube", "Female", "2010-05-12", "P7", "Green", "Ms. Singh", "+256708321231", "Placeholder"],
    ["MJA-1011", "Fiona Liu", "Female", "2014-06-09", "P6", "Yellow", "Mr. O'Brien", "+256717358607", "Placeholder"],
    ["MJA-1012", "Joy Cruz", "Female", "2016-07-18", "P4", "Green", "Mr. Khan", "+256765617488", "Placeholder"],
    ["MJA-1013", "Derrick Chen", "Male", "2011-09-19", "P6", "Blue", "Mrs. Cruz", "+256776166613", "Placeholder"],
    ["MJA-1014", "Emily Torres", "Female", "2015-04-02", "P5", "Green", "Mrs. Rwakijuma", "+256787855731", "Placeholder"],
    ["MJA-1015", "Martin Singh", "Male", "2018-08-15", "P6", "Green", "Mr. Hakim", "+256755265840", "Placeholder"],
    ["MJA-1016", "Angela O'Brien", "Female", "2015-08-13", "P7", "Blue", "Mrs. Smith", "+256780412942", "Placeholder"],
    ["MJA-1203", "TUSHABE NICKSON", "", "", "P6", "Blue", "", "", ""],
    ["MJA-1204", "SSEKAMATTE FRANCIS", "", "", "P6", "Red", "", "", ""],
    ["MJA-1205", "NYINOMUGISHA PATIENCE", "", "", "P6", "Yellow", "", "", ""],
    ["MJA-1206", "KAYEMBA CALVIN", "", "", "P6", "Green", "", "", ""]
  ];
  return rows.map((row, index) => studentFromTbl(row, index));
}

function studentFromTbl(row, index) {
  const [studentId, fullName, gender, dob, level, house, parentName, parentContact, photoUrl] = row;
  const stream = index % 2 === 0 ? "East" : "West";
  const levelId = String(level || "P6").toLowerCase();
  const streamId = stream.toLowerCase();
  return {
    id: slug(studentId || `student-${index + 1}`),
    studentId,
    admissionNo: studentId,
    name: fullName,
    gender: normalizeGender(gender),
    dateOfBirth: dob,
    classLevel: level || "P6",
    stream,
    house: house || "",
    guardian: parentName || "",
    contact: parentContact || "",
    photo: photoUrl === "Placeholder" ? "" : photoUrl || "",
    classId: `${levelId}-${streamId}`,
    status: "Active",
    admissionDate: "2026-02-02",
    notes: "Imported structure follows Drive tblStudents.xlsx",
    attendance: 70 + ((index * 7) % 26),
    conduct: index % 4 === 0 ? "Excellent" : "Good",
    competencies: {
      Communication: 3 + (index % 3),
      Leadership: 2 + (index % 4),
      Creativity: 3 + (index % 2),
      Discipline: 3 + (index % 3),
      Teamwork: 2 + (index % 4),
      Responsibility: 3 + (index % 3)
    }
  };
}

function buildMarks(students) {
  const activeStudents = students.filter((student) => student.status === "Active");
  const marks = [];
  activeStudents.forEach((student, studentIndex) => {
    SUBJECTS.forEach((subject, subjectIndex) => {
      const score = Math.max(32, Math.min(96, 92 - (studentIndex * 4) + ((subjectIndex * 5) % 17)));
      const missing = studentIndex % 9 === 0 && ["sci", "ict"].includes(subject.id);
      marks.push({
        studentId: student.id,
        subjectId: subject.id,
        classId: student.classId,
        academicYear: "2026",
        term: "Term 1",
        examType: "End of Term",
        teacherId: teacherForSubject(subject.id),
        bot: missing ? null : Math.max(0, score - 7),
        mid: missing ? null : Math.max(0, score - 3),
        end: missing ? null : score,
        score: missing ? null : score,
        status: missing ? "Missing" : "Captured",
        remarks: missing ? "Missing" : "Captured"
      });
    });
  });
  return marks;
}

function buildDeadlines() {
  const rows = [];
  for (const classId of ["p6-east", "p6-west", "p7-east", "p7-west"]) {
    for (const subjectId of ["eng", "math", "sci", "sst"]) {
      const complete = (classId === "p6-east" && ["eng", "math"].includes(subjectId)) || (classId === "p6-west" && subjectId === "math");
      const late = subjectId === "sst";
      rows.push({
        id: `${classId}-${subjectId}-end`,
        academicYear: "2026",
        term: "Term 1",
        examType: "End of Term",
        classId,
        subjectId,
        teacherId: teacherForSubject(subjectId),
        dueAt: late ? "2026-06-03T17:00:00+03:00" : "2026-06-12T17:00:00+03:00",
        status: complete ? "complete" : late ? "late" : "pending",
        lockAfterDeadline: true
      });
    }
  }
  return rows;
}

function teacher(id, name, role, email) {
  return { id, name, role, email, active: true };
}

function assignment(teacherId, classId, subjectId) {
  return { id: `${teacherId}-${classId}-${subjectId}`, teacherId, classId, subjectId, active: true };
}

function uploadBatch(id, teacherId, classId, subjectId, status, rows, validRows, errorRows, uploadedAt) {
  return { id, teacherId, classId, subjectId, academicYear: "2026", term: "Term 1", examType: "End of Term", status, rows, validRows, errorRows, uploadedAt };
}

function teacherForSubject(subjectId) {
  if (subjectId === "math") return "t-math";
  if (subjectId === "sci") return "t-sci";
  if (subjectId === "sst") return "t-sst";
  return "t-eng";
}

function normalizeGender(value) {
  if (value === "Male") return "M";
  if (value === "Female") return "F";
  return value || "";
}

function ensureDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (!fs.existsSync(DB_PATH)) return writeDb(seedData());
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  if (data.version !== DATA_VERSION) writeDb(seedData());
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function calculateResults(db) {
  const activeStudents = db.students.filter((student) => student.status === "Active");
  const marksByStudent = new Map();
  for (const mark of db.marks) {
    if (!marksByStudent.has(mark.studentId)) marksByStudent.set(mark.studentId, new Map());
    marksByStudent.get(mark.studentId).set(`${mark.subjectId}:${mark.academicYear}:${mark.term}:${mark.examType}`, mark);
  }

  const students = activeStudents.map((student) => {
    const classInfo = db.classes.find((item) => item.id === student.classId) || {};
    const studentMarks = marksByStudent.get(student.id) || new Map();
    const subjects = db.subjects.map((subject) => {
      const mark = studentMarks.get(`${subject.id}:${db.school.academicYear}:${db.school.term}:${db.school.exam}`) ||
        [...studentMarks.values()].find((item) => item.subjectId === subject.id);
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
    const total = captured.reduce((sum, subject) => sum + Number(subject.score || 0), 0);
    const average = captured.length ? total / captured.length : 0;
    const aggregate = captured.reduce((sum, subject) => sum + Number(subject.aggregate || 0), 0);
    const failedSubjects = subjects.filter((subject) => subject.grade === "F9").length;
    const promotion = promotionDecision({ average, failedSubjects, missingSubjects: missing.length }, db.promotionRules);
    return {
      ...student,
      className: classInfo.level || student.classLevel,
      stream: classInfo.stream || student.stream,
      subjects,
      total,
      average: round(average),
      aggregate,
      overallGrade: gradeFor(average, db.gradingScale).grade,
      failedSubjects,
      missingSubjects: missing.length,
      promotion,
      verificationCode: `MJA-${db.school.academicYear}-${String(student.admissionNo).replaceAll("/", "").replaceAll("-", "")}`
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

  const monitoring = uploadMonitoring(db);
  const classAverage = ranked.length ? ranked.reduce((sum, student) => sum + student.average, 0) / ranked.length : 0;

  return {
    school: db.school,
    counts: {
      students: db.students.length,
      activeStudents: activeStudents.length,
      inactiveStudents: db.students.length - activeStudents.length,
      subjects: db.subjects.length,
      teachers: db.teachers.length,
      marks: db.marks.length,
      roles: db.roles.length
    },
    monitoring,
    classAverage: round(classAverage),
    subjectStats,
    students: ranked,
    deadlines: enrichDeadlines(db),
    uploadErrors: db.uploadErrors,
    uploadBatches: enrichUploadBatches(db),
    promotionPreview: promotionPreview(db, ranked),
    audit: db.audit
  };
}

function uploadMonitoring(db) {
  const expected = db.deadlines.length;
  const completed = db.deadlines.filter((item) => item.status === "complete").length;
  const pending = db.deadlines.filter((item) => item.status === "pending").length;
  const overdue = db.deadlines.filter((item) => item.status === "late").length;
  const uploadedTeacherIds = new Set(db.uploadBatches.filter((item) => item.errorRows === 0 || item.validRows > 0).map((item) => item.teacherId));
  const expectedTeacherIds = new Set(db.deadlines.map((item) => item.teacherId).filter(Boolean));
  return {
    expectedUploads: expected,
    completedUploads: completed,
    pendingUploads: pending,
    lateUploads: overdue,
    overdueUploads: overdue,
    missingMarks: db.marks.filter((mark) => mark.status === "Missing").length,
    validationFailures: db.uploadErrors.length,
    teachersUploaded: uploadedTeacherIds.size,
    teachersPending: [...expectedTeacherIds].filter((id) => !uploadedTeacherIds.has(id)).length,
    completionRate: expected ? Math.round((completed / expected) * 100) : 0
  };
}

function promotionDecision(summary, rules) {
  if (rules.requireCompleteMarks && summary.missingSubjects) return "MANUAL REVIEW";
  if (summary.average >= rules.minAverage && summary.failedSubjects <= rules.maxFailedSubjects) return "PROMOTED";
  return "REPEAT";
}

function promotionPreview(db, rankedStudents) {
  return rankedStudents.map((student) => ({
    studentId: student.id,
    admissionNo: student.admissionNo,
    name: student.name,
    currentClassId: student.classId,
    currentClass: `${student.className} ${student.stream}`,
    average: student.average,
    failedSubjects: student.failedSubjects,
    missingSubjects: student.missingSubjects,
    decision: student.promotion,
    targetClassId: targetClassId(student, db.classes)
  }));
}

function targetClassId(student, classes) {
  if (student.promotion !== "PROMOTED") return student.classId;
  const current = classes.find((item) => item.id === student.classId);
  if (!current) return student.classId;
  const nextLevel = current.level === "P7" ? null : `P${Number(current.level.replace("P", "")) + 1}`;
  if (!nextLevel) return "graduated";
  return classes.find((item) => item.level === nextLevel && item.stream === current.stream)?.id || student.classId;
}

function approvePromotion(db, body = {}) {
  const results = calculateResults(db);
  const approved = [];
  for (const row of results.promotionPreview) {
    const student = db.students.find((item) => item.id === row.studentId);
    if (!student) continue;
    const before = student.classId;
    if (row.decision === "PROMOTED" && row.targetClassId === "graduated") {
      student.status = "Graduated";
    } else if (row.decision === "PROMOTED") {
      student.classId = row.targetClassId;
    }
    approved.push({ studentId: student.id, admissionNo: student.admissionNo, before, after: student.classId, decision: row.decision });
  }
  const history = {
    id: `promotion-${Date.now()}`,
    approvedBy: body.approvedBy || "Head Teacher",
    approvedAt: new Date().toISOString(),
    academicYear: db.school.academicYear,
    nextAcademicYear: db.promotionRules.nextAcademicYear,
    rows: approved
  };
  db.promotionRules.status = "Approved";
  db.promotionHistory.push(history);
  db.audit.push(audit(history.approvedBy, "Approved promotion", "-", `${approved.length} learners processed`));
  return history;
}

function gradeFor(score, scale) {
  if (score === null || score === undefined || score === "") return { grade: "X", aggregate: null, comment: "Missing" };
  const numericScore = Number(score);
  return scale.find((row) => numericScore >= row.min && numericScore <= row.max) || scale[scale.length - 1];
}

function assignRanks(students) {
  const overall = [...students].sort((a, b) => b.average - a.average || b.total - a.total || a.name.localeCompare(b.name));
  overall.forEach((student, index) => { student.position = index + 1; });
  for (const list of groupBy(students, (student) => student.className).values()) {
    [...list].sort((a, b) => b.average - a.average || a.name.localeCompare(b.name)).forEach((student, index) => {
      student.classPosition = index + 1;
    });
  }
  for (const list of groupBy(students, (student) => `${student.className}-${student.stream}`).values()) {
    [...list].sort((a, b) => b.average - a.average || a.name.localeCompare(b.name)).forEach((student, index) => {
      student.streamPosition = index + 1;
    });
  }
  return overall;
}

function enrichDeadlines(db) {
  return db.deadlines.map((deadline) => ({
    ...deadline,
    className: db.classes.find((item) => item.id === deadline.classId)?.name || deadline.classId,
    subjectName: db.subjects.find((item) => item.id === deadline.subjectId)?.name || deadline.subjectId,
    teacherName: db.teachers.find((item) => item.id === deadline.teacherId)?.name || deadline.teacherId
  }));
}

function enrichUploadBatches(db) {
  return db.uploadBatches.map((batch) => ({
    ...batch,
    className: db.classes.find((item) => item.id === batch.classId)?.name || batch.classId,
    subjectName: db.subjects.find((item) => item.id === batch.subjectId)?.name || batch.subjectId,
    teacherName: db.teachers.find((item) => item.id === batch.teacherId)?.name || batch.teacherId
  }));
}

function validateMarks(db, body) {
  const errors = [];
  const marks = Array.isArray(body.marks) ? body.marks : [];
  const seen = new Set();
  const classInfo = db.classes.find((item) => item.id === body.classId);
  const teacherAssigned = db.teacherAssignments.some((item) =>
    item.teacherId === body.teacherId && item.classId === body.classId && item.subjectId === body.subjectId && item.active !== false
  );
  if (!teacherAssigned) {
    errors.push(errorRow("-", "-", "Teacher Assignment", "Teacher is not assigned to this class, stream and subject"));
  }
  marks.forEach((mark, index) => {
    const rowNumber = mark.rowNumber || index + 2;
    const admissionNo = mark.admissionNo || db.students.find((student) => student.id === mark.studentId)?.admissionNo || "";
    const student = db.students.find((item) => item.id === mark.studentId || item.admissionNo === admissionNo);
    if (!student) return errors.push(errorRow(rowNumber, admissionNo, "Missing Student", "Admission number does not exist"));
    if (student.classId !== body.classId) return errors.push(errorRow(rowNumber, admissionNo, "Wrong Class", `Learner is not in ${classInfo?.name || body.classId}`));
    if (seen.has(student.id)) return errors.push(errorRow(rowNumber, admissionNo, "Duplicate Mark", "Learner appears twice in this upload"));
    if (mark.score === "" || mark.score === null || mark.score === undefined) return errors.push(errorRow(rowNumber, admissionNo, "Missing Mark", "Mark is required"));
    const score = Number(mark.score);
    if (!Number.isFinite(score)) return errors.push(errorRow(rowNumber, admissionNo, "Invalid Mark", "Mark must be numeric"));
    if (score < 0 || score > 100) return errors.push(errorRow(rowNumber, admissionNo, "Mark Range", "Mark must be between 0 and 100"));
    seen.add(student.id);
  });
  return errors;
}

function upsertMark(db, payload) {
  const student = db.students.find((item) => item.id === payload.studentId || item.admissionNo === payload.admissionNo);
  if (!student) throw new Error("Student not found");
  const status = payload.status || "Captured";
  const numericScore = status === "Captured" ? Number(payload.score) : null;
  if (status === "Captured" && (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100)) {
    throw new Error("Score must be between 0 and 100");
  }
  const existing = db.marks.find((mark) =>
    mark.studentId === student.id &&
    mark.subjectId === payload.subjectId &&
    mark.academicYear === payload.academicYear &&
    mark.term === payload.term &&
    mark.examType === payload.examType
  );
  const row = {
    studentId: student.id,
    subjectId: payload.subjectId,
    classId: payload.classId || student.classId,
    academicYear: payload.academicYear || db.school.academicYear,
    term: payload.term || db.school.term,
    examType: payload.examType || db.school.exam,
    teacherId: payload.teacherId || teacherForSubject(payload.subjectId),
    bot: payload.bot ?? null,
    mid: payload.mid ?? null,
    end: numericScore,
    score: numericScore,
    status,
    remarks: payload.remarks || status
  };
  if (existing) Object.assign(existing, row);
  else db.marks.push(row);
}

function addStudent(db, body) {
  const classId = body.classId || `${String(body.classLevel || "P6").toLowerCase()}-${String(body.stream || "East").toLowerCase()}`;
  const studentRow = {
    id: slug(body.studentId || body.admissionNo || `student-${Date.now()}`),
    studentId: String(body.studentId || body.admissionNo || "").trim(),
    admissionNo: String(body.admissionNo || body.studentId || "").trim(),
    name: String(body.name || "").trim(),
    gender: normalizeGender(body.gender),
    dateOfBirth: body.dateOfBirth || "",
    classLevel: body.classLevel || db.classes.find((item) => item.id === classId)?.level || "",
    stream: body.stream || db.classes.find((item) => item.id === classId)?.stream || "",
    house: body.house || "",
    guardian: body.guardian || "",
    contact: body.contact || "",
    photo: body.photo || "",
    classId,
    status: body.status || "Active",
    admissionDate: body.admissionDate || new Date().toISOString().slice(0, 10),
    notes: body.notes || "",
    attendance: Number(body.attendance || 0),
    conduct: body.conduct || "Good",
    competencies: { Communication: 3, Leadership: 3, Creativity: 3, Discipline: 3, Teamwork: 3, Responsibility: 3 }
  };
  if (!studentRow.admissionNo || !studentRow.name) throw new Error("Student ID/admission number and full name are required");
  if (!STUDENT_STATUSES.includes(studentRow.status)) throw new Error("Invalid student status");
  if (db.students.some((student) => student.admissionNo === studentRow.admissionNo)) throw new Error("Admission number already exists");
  db.students.push(studentRow);
  db.audit.push(audit("School Admin", "Created student", "-", studentRow.admissionNo));
  return studentRow;
}

function saveDeadline(db, body) {
  const id = body.id || `${body.classId}-${body.subjectId}-${slug(body.examType || db.school.exam)}`;
  const row = {
    id,
    academicYear: body.academicYear || db.school.academicYear,
    term: body.term || db.school.term,
    examType: body.examType || db.school.exam,
    classId: body.classId,
    subjectId: body.subjectId,
    teacherId: body.teacherId || teacherForSubject(body.subjectId),
    dueAt: body.dueAt,
    status: deadlineStatus(body.dueAt),
    lockAfterDeadline: body.lockAfterDeadline !== false
  };
  const existing = db.deadlines.find((item) => item.id === id);
  if (existing) Object.assign(existing, row);
  else db.deadlines.push(row);
  db.audit.push(audit("School Admin", "Saved deadline", "-", `${row.classId} ${row.subjectId}`));
  return row;
}

function deadlineStatus(dueAt) {
  if (!dueAt) return "pending";
  return new Date(dueAt).getTime() < Date.now() ? "late" : "pending";
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

function slug(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `id-${Date.now()}`;
}

function audit(user, action, previousValue, newValue) {
  return { user, action, timestamp: new Date().toISOString(), previousValue, newValue };
}

function errorRow(rowNumber, admissionNo, errorType, errorMessage, batchId = "") {
  return { batchId, rowNumber, admissionNo, errorType, errorMessage, timestamp: new Date().toISOString() };
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function loadDb() {
  if (supabaseConfigured()) {
    try {
      const db = await readSupabaseDb();
      activeStorageMode = "supabase";
      return db;
    } catch (error) {
      activeStorageMode = "json";
      console.error(`Supabase read failed; using JSON fallback. ${error.message}`);
    }
  }
  return readDb();
}

async function saveDb(data) {
  if (supabaseConfigured()) {
    try {
      const db = await writeSupabaseDb(data);
      activeStorageMode = "supabase";
      return db;
    } catch (error) {
      activeStorageMode = "json";
      console.error(`Supabase write failed; using JSON fallback. ${error.message}`);
    }
  }
  writeDb(data);
  return data;
}

function storageMode() {
  return activeStorageMode;
}

const COLLECTIONS = [
  ["academicYears", "shule_academic_years", academicYearRow],
  ["terms", "shule_terms", termRow],
  ["examTypes", "shule_exam_types", examTypeRow],
  ["classLevels", "shule_class_levels", classLevelRow],
  ["streams", "shule_streams", streamRow],
  ["classes", "shule_classes", classRow],
  ["subjects", "shule_subjects", subjectRow],
  ["teachers", "shule_teachers", teacherRow],
  ["teacherAssignments", "shule_teacher_assignments", assignmentRow],
  ["gradingScale", "shule_grading_scale", gradingRow],
  ["roles", "shule_roles", roleRow],
  ["promotionHistory", "shule_promotion_history", promotionHistoryRow],
  ["students", "shule_students", studentRow],
  ["marks", "shule_marks", markRow],
  ["deadlines", "shule_deadlines", deadlineRow],
  ["uploadBatches", "shule_upload_batches", uploadBatchRow],
  ["uploadErrors", "shule_upload_errors", uploadErrorRow],
  ["audit", "shule_audit_logs", auditRow]
];

async function readSupabaseDb() {
  const settings = await supabaseGet("shule_app_settings", "key=eq.version&select=data&limit=1");
  const version = settings[0]?.data?.version;
  if (version !== DATA_VERSION) {
    const seeded = seedData();
    await writeSupabaseDb(seeded);
    return seeded;
  }

  const db = { version: DATA_VERSION };
  const [schoolRows, metaRows, promotionRuleRows] = await Promise.all([
    supabaseGet("shule_school_profile", "select=data&limit=1"),
    supabaseGet("shule_app_settings", "key=eq.meta&select=data&limit=1"),
    supabaseGet("shule_promotion_rules", "select=data&limit=1")
  ]);
  const fallback = seedData();
  db.school = schoolRows[0]?.data || fallback.school;
  db.promotionRules = promotionRuleRows[0]?.data || fallback.promotionRules;
  db.comments = metaRows[0]?.data?.comments || fallback.comments;
  db.activities = metaRows[0]?.data?.activities || fallback.activities;

  for (const [prop, table] of COLLECTIONS) {
    const rows = await supabaseGet(table, "select=data");
    db[prop] = rows.map((row) => row.data);
  }
  return db;
}

async function writeSupabaseDb(db) {
  await replaceTable("shule_app_settings", "key", [
    { key: "version", data: { version: DATA_VERSION }, updated_at: new Date().toISOString() },
    { key: "meta", data: { comments: db.comments || {}, activities: db.activities || [] }, updated_at: new Date().toISOString() }
  ]);
  await replaceTable("shule_school_profile", "id", [{
    id: "main",
    name: db.school?.name || "",
    short_name: db.school?.shortName || "",
    data: db.school || {},
    updated_at: new Date().toISOString()
  }]);
  await replaceTable("shule_promotion_rules", "id", [{
    id: db.promotionRules?.id || "default",
    academic_year: db.promotionRules?.academicYear || db.school?.academicYear || "",
    status: db.promotionRules?.status || "Draft",
    data: db.promotionRules || {},
    updated_at: new Date().toISOString()
  }]);

  for (const [prop, table, rowFn] of COLLECTIONS) {
    await replaceTable(table, "id", (db[prop] || []).map((item, index) => rowFn(item, index, db)));
  }
  return db;
}

async function replaceTable(table, idColumn, rows) {
  await supabaseDelete(table, `${idColumn}=not.is.null`);
  if (rows.length) await supabasePost(table, rows);
}

async function supabaseGet(table, query) {
  return supabaseRequest(`${table}?${query}`);
}

async function supabaseDelete(table, query) {
  return supabaseRequest(`${table}?${query}`, { method: "DELETE" });
}

async function supabasePost(table, rows) {
  return supabaseRequest(`${table}`, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(rows)
  });
}

async function supabaseRequest(pathname, options = {}) {
  const headers = {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (!isModernSupabaseKey(SUPABASE_KEY)) {
    headers.Authorization = `Bearer ${SUPABASE_KEY}`;
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    method: options.method || "GET",
    headers,
    body: options.body
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${response.status}: ${text || response.statusText}`);
  }
  if (response.status === 204) return [];
  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

function readSupabaseKey() {
  const directKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
  if (directKey.trim()) return directKey.trim();

  const secretKeys = (process.env.SUPABASE_SECRET_KEYS || "").trim();
  if (!secretKeys) return "";

  try {
    const parsed = JSON.parse(secretKeys);
    return String(parsed.default || Object.values(parsed)[0] || "").trim();
  } catch (_error) {
    return secretKeys;
  }
}

function isModernSupabaseKey(key) {
  return key.startsWith("sb_secret_") || key.startsWith("sb_publishable_");
}

function academicYearRow(item) {
  return { id: item.id, name: item.name, active: Boolean(item.active), data: item, updated_at: new Date().toISOString() };
}

function termRow(item) {
  return { id: item.id, name: item.name, academic_year_id: item.academicYearId || "", active: Boolean(item.active), data: item, updated_at: new Date().toISOString() };
}

function examTypeRow(item) {
  return { id: item.id, name: item.name, active: item.active !== false, data: item, updated_at: new Date().toISOString() };
}

function classLevelRow(item) {
  return { id: item.id, name: item.name, sort_order: item.order || null, active: item.active !== false, data: item, updated_at: new Date().toISOString() };
}

function streamRow(item) {
  return { id: item.id, name: item.name, active: item.active !== false, data: item, updated_at: new Date().toISOString() };
}

function classRow(item) {
  return { id: item.id, level: item.level, stream: item.stream, name: item.name, active: item.active !== false, data: item, updated_at: new Date().toISOString() };
}

function subjectRow(item) {
  return { id: item.id, code: item.code, name: item.name, active: item.active !== false, data: item, updated_at: new Date().toISOString() };
}

function teacherRow(item) {
  return { id: item.id, name: item.name, role: item.role || "", email: item.email || "", active: item.active !== false, data: item, updated_at: new Date().toISOString() };
}

function assignmentRow(item) {
  return { id: item.id, teacher_id: item.teacherId, class_id: item.classId, subject_id: item.subjectId, active: item.active !== false, data: item, updated_at: new Date().toISOString() };
}

function gradingRow(item, index) {
  return { id: item.id || `${item.grade}-${index}`, grade: item.grade, min_score: item.min, max_score: item.max, aggregate: item.aggregate, data: item, updated_at: new Date().toISOString() };
}

function roleRow(item) {
  return { id: item.id, name: item.name, active: item.active !== false, data: item, updated_at: new Date().toISOString() };
}

function promotionHistoryRow(item, index) {
  return { id: item.id || `promotion-${index}`, academic_year: item.academicYear || "", approved_by: item.approvedBy || "", approved_at: item.approvedAt || null, data: item, updated_at: new Date().toISOString() };
}

function studentRow(item) {
  return {
    id: item.id,
    student_id: item.studentId || item.admissionNo || "",
    admission_no: item.admissionNo || "",
    full_name: item.name || "",
    class_id: item.classId || "",
    stream: item.stream || "",
    status: item.status || "",
    parent_contact: item.contact || "",
    data: item,
    updated_at: new Date().toISOString()
  };
}

function markRow(item, index) {
  const id = item.id || slug(`${item.studentId}-${item.subjectId}-${item.academicYear}-${item.term}-${item.examType}-${index}`);
  return {
    id,
    student_id: item.studentId,
    subject_id: item.subjectId,
    class_id: item.classId,
    academic_year: item.academicYear,
    term: item.term,
    exam_type: item.examType,
    teacher_id: item.teacherId || "",
    score: item.score,
    status: item.status || "",
    data: { ...item, id },
    updated_at: new Date().toISOString()
  };
}

function deadlineRow(item) {
  return { id: item.id, academic_year: item.academicYear, term: item.term, exam_type: item.examType, class_id: item.classId, subject_id: item.subjectId, teacher_id: item.teacherId || "", due_at: item.dueAt || null, status: item.status || "", data: item, updated_at: new Date().toISOString() };
}

function uploadBatchRow(item) {
  return { id: item.id, teacher_id: item.teacherId || "", class_id: item.classId || "", subject_id: item.subjectId || "", status: item.status || "", data: item, updated_at: new Date().toISOString() };
}

function uploadErrorRow(item, index) {
  const id = item.id || slug(`${item.batchId || "batch"}-${item.rowNumber || index}-${item.admissionNo || "row"}-${index}`);
  return { id, batch_id: item.batchId || "", row_number: String(item.rowNumber || ""), admission_no: item.admissionNo || "", error_type: item.errorType || "", data: { ...item, id }, updated_at: new Date().toISOString() };
}

function auditRow(item, index) {
  const id = item.id || slug(`${item.timestamp || Date.now()}-${item.action || "audit"}-${index}`);
  return { id, actor: item.user || "", action: item.action || "", created_at: item.timestamp || new Date().toISOString(), data: { ...item, id } };
}

module.exports = {
  DATA_VERSION,
  STUDENT_STATUSES,
  approvePromotion,
  audit,
  calculateResults,
  loadDb,
  readDb,
  addStudent,
  saveDeadline,
  saveDb,
  sendError,
  sendJson,
  storageMode,
  upsertMark,
  validateMarks,
  writeDb
};
