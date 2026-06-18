const fs = require("fs");
const path = require("path");

const DATA_VERSION = 3;
const LOCAL_DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = process.env.SHULE_DB_PATH || (process.env.VERCEL ? path.join("/tmp", "shule-mvp2-db.json") : path.join(LOCAL_DATA_DIR, "shule-mvp2-db.json"));
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = readSupabaseKey();
const SUPABASE_STORAGE_BUCKET = String(process.env.SUPABASE_STORAGE_BUCKET || "shule-private").trim();
const ALLOW_JSON_FALLBACK = process.env.SHULE_ALLOW_JSON_FALLBACK === "true" ||
  (!process.env.VERCEL && process.env.NODE_ENV !== "production");
let activeStorageMode = supabaseConfigured() ? "supabase" : "json";
let lastStorageError = "";
let lastStorageFetchAt = "";
let lastTableCounts = {};

const STUDENT_STATUSES = ["Active", "Graduated", "Transferred", "Suspended", "Expelled", "Dropped Out", "Deceased", "Inactive"];
const ROLES = ["Super Admin", "School Admin", "Head Teacher", "DOS", "Class Teacher", "Subject Teacher", "Bursar", "Parent", "Viewer"];

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
      tenantCode: "mja",
      portalUrl: "https://shule-beta.vercel.app",
      verificationPrefix: "MJA",
      primaryColor: "#540f35",
      secondaryColor: "#7a164b",
      accentColor: "#fcb900",
      academicYear: "2026",
      term: "Term II",
      exam: "End of Term",
      address: "Salaama Munyonyo Road, Plot 42 and 43, Kampala",
      phone: "+256 700 000 000",
      email: "admin@mja.ac.ug",
      logoUrl: "",
      watermarkText: "MJA",
      subscriptionPlan: "Professional",
      subscriptionStatus: "Trial",
      trialEndsAt: "2026-09-30",
      subscriptionExpiresAt: ""
    },
    academicYears: [
      { id: "2026", name: "2026", startDate: "2026-02-02", endDate: "2026-12-04", active: true },
      { id: "2025", name: "2025", startDate: "2025-02-03", endDate: "2025-12-05", active: false }
    ],
    terms: [
      { id: "term-1", name: "Term I", academicYearId: "2026", active: false },
      { id: "term-2", name: "Term II", academicYearId: "2026", active: true },
      { id: "term-3", name: "Term III", academicYearId: "2026", active: false }
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
      subjectTeacher: "The learner participates well and should continue revising consistently.",
      teacher: "Shows steady effort and should keep practicing weaker subject areas.",
      dos: "Academic progress is satisfactory. Targeted support is recommended in weaker subjects.",
      headteacher: "A promising learner. Parent support and consistent revision are encouraged."
    },
    activities: ["Debate", "Football", "Music", "Scouts"],
    movements: [],
    reportArchive: [],
    studentDocuments: [],
    nextTerm: {
      openingDate: "2026-09-14",
      closingDate: "2026-12-04",
      feesBalance: "Contact the bursar for the current statement.",
      requirements: "Exercise books, mathematical set, and full school uniform.",
      specialNotes: "Report on opening day by 8:00 AM."
    },
    audit: [
      audit("Director of Studies", "Generated demo reports", "-", "MJA Term II reports"),
      audit("School Admin", "Seeded MVP2 setup", "-", "tblStudent-compatible student structure")
    ],
    promotionHistory: [],
    assessmentWorkflows: []
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
    ["MJA-1206", "KAYEMBA CALVIN", "", "", "P6", "Green", "", "", ""],
    ["MJA-1207", "Tusiime Charles Bradwell", "Male", "2013-05-17", "P6", "Blue", "Mr. Tusiime", "+256700120700", ""]
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
    alternativeContact: "",
    photo: photoUrl === "Placeholder" ? "" : photoUrl || "",
    classId: `${levelId}-${streamId}`,
    status: "Active",
    admissionDate: "2026-02-02",
    notes: "Imported structure follows Drive tblStudents.xlsx",
    attendance: 70 + ((index * 7) % 26),
    attendanceDays: {
      present: Math.round((70 + ((index * 7) % 26)) * 0.6),
      absent: Math.round((100 - (70 + ((index * 7) % 26))) * 0.6),
      total: 60
    },
    activities: index % 2 ? ["Music", "Scouts"] : ["Debate", "Football"],
    reportComments: {
      classTeacher: index % 2 ? "Works well with others and is becoming more confident in class." : "Has shown steady effort and should maintain a consistent revision routine.",
      dos: index % 3 ? "Academic progress is satisfactory; continue strengthening the lower-scoring subjects." : "A strong term overall. The learner should keep extending their independent study habits.",
      headTeacher: index % 2 ? "Good progress. Continued partnership between home and school is encouraged." : "A commendable effort this term. Keep aiming higher."
    },
    conduct: index % 4 === 0 ? "Excellent" : "Good",
    competencies: {
      Communication: 3 + (index % 3),
      Leadership: 2 + (index % 4),
      Creativity: 3 + (index % 2),
      Discipline: 3 + (index % 3),
      Teamwork: 2 + (index % 4),
      Responsibility: 3 + (index % 3),
      Respect: 3 + (index % 3)
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
        term: "Term II",
        examType: "End of Term",
        teacherId: teacherForSubject(subject.id),
        bot: missing ? null : Math.max(0, score - 7),
        mid: missing ? null : Math.max(0, score - 3),
        end: missing ? null : score,
        score: missing ? null : score,
        status: missing ? "Missing" : "Captured",
        remarks: missing ? "" : subjectRemark(score, subject.name, student.name)
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
        term: "Term II",
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
  return { id, teacherId, classId, subjectId, academicYear: "2026", term: "Term II", examType: "End of Term", status, rows, validRows, errorRows, uploadedAt };
}

function teacherForSubject(subjectId) {
  if (subjectId === "math") return "t-math";
  if (subjectId === "sci") return "t-sci";
  if (subjectId === "sst") return "t-sst";
  return "t-eng";
}

function subjectRemark(score, subjectName, studentName) {
  const firstName = String(studentName || "The learner").split(/\s+/)[0];
  if (score >= 85) return `${firstName} demonstrates excellent understanding in ${subjectName}.`;
  if (score >= 70) return `${firstName} has a good command of ${subjectName} and should keep practising.`;
  if (score >= 50) return `${firstName} is progressing in ${subjectName}; more revision will improve confidence.`;
  return `${firstName} needs focused support and regular practice in ${subjectName}.`;
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
  const contextMarks = currentContextMarks(db);
  const assessedSubjectsByClass = new Map();
  for (const mark of contextMarks) {
    if (!assessedSubjectsByClass.has(mark.classId)) assessedSubjectsByClass.set(mark.classId, new Set());
    assessedSubjectsByClass.get(mark.classId).add(mark.subjectId);
  }
  const marksByStudent = new Map();
  for (const mark of db.marks) {
    if (!marksByStudent.has(mark.studentId)) marksByStudent.set(mark.studentId, new Map());
    marksByStudent.get(mark.studentId).set(`${mark.subjectId}:${mark.academicYear}:${mark.term}:${mark.examType}`, mark);
  }

  const students = activeStudents.map((student) => {
    const classInfo = db.classes.find((item) => item.id === student.classId) || {};
    const studentMarks = marksByStudent.get(student.id) || new Map();
    const classRules = promotionRulesForClass(db, student.classId);
    const applicableSubjectIds = new Set([
      ...(assessedSubjectsByClass.get(student.classId) || []),
      ...(classRules.mandatorySubjectIds || [])
    ]);
    const subjects = db.subjects.filter((subject) => applicableSubjectIds.has(subject.id)).map((subject) => {
      const mark = studentMarks.get(`${subject.id}:${db.school.academicYear}:${db.school.term}:${db.school.exam}`);
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
        comment: status === "Captured"
          ? mark?.remarks && !["Captured", "Missing"].includes(mark.remarks) ? mark.remarks : subjectRemark(score, subject.name, student.name)
          : status,
        teacherName: db.teachers.find((teacher) => teacher.id === mark?.teacherId)?.name || "-",
        subjectPosition: null
      };
    });
    const captured = subjects.filter((subject) => subject.status === "Captured");
    const missing = subjects.filter((subject) => subject.status !== "Captured");
    const total = captured.reduce((sum, subject) => sum + Number(subject.score || 0), 0);
    const average = captured.length ? total / captured.length : 0;
    const aggregate = captured.reduce((sum, subject) => sum + Number(subject.aggregate || 0), 0);
    const failedSubjects = subjects.filter((subject) => subject.grade === "F9").length;
    const promotion = promotionDecision({
      average,
      failedSubjects,
      missingSubjects: missing.length,
      capturedSubjects: captured.length
    }, classRules);
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
      verificationCode: `${verificationPrefix(db.school)}-${db.school.academicYear}-${String(student.admissionNo).replaceAll("/", "").replaceAll("-", "")}`
    };
  });

  const ranked = assignSubjectRanks(assignRanks(students));
  const subjectStats = subjectPerformance(db, activeStudents);
  const classSubjectStats = classSubjectPerformance(db, activeStudents);
  const performanceBands = learnerPerformanceBands(ranked);
  const studentTrends = buildStudentTrends(db);
  for (const student of ranked) student.trend = studentTrends[student.id] || [];

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
    classSubjectStats,
    performanceBands,
    students: ranked,
    deadlines: enrichDeadlines(db),
    uploadErrors: db.uploadErrors,
    uploadBatches: enrichUploadBatches(db),
    promotionPreview: promotionPreview(db, ranked),
    audit: db.audit,
    movements: db.movements,
    nextTerm: db.nextTerm,
    executive: executiveAnalytics(db, ranked, monitoring)
  };
}

function executiveAnalytics(db, students, monitoring) {
  const averages = (items) => round(items.length ? items.reduce((sum, item) => sum + item.average, 0) / items.length : 0);
  const summarized = (keyFn) => [...groupBy(students, keyFn)].map(([name, rows]) => ({
    name,
    learners: rows.length,
    average: averages(rows),
    promoted: rows.filter((row) => row.promotion === "PROMOTED").length
  }));
  const subjectStats = subjectPerformance(db, db.students.filter((student) => student.status === "Active"))
    .filter((subject) => subject.entries > 0)
    .sort((a, b) => b.average - a.average || a.subjectName.localeCompare(b.subjectName));
  const bands = learnerPerformanceBands(students);
  const classRows = summarized((student) => student.className).sort((a, b) => b.average - a.average);
  const streamRows = summarized((student) => `${student.className} ${student.stream}`).sort((a, b) => b.average - a.average);
  const activeStudents = db.students.filter((student) => student.status === "Active");
  const boys = activeStudents.filter((student) => /^m(ale)?$/i.test(String(student.gender || ""))).length;
  const girls = activeStudents.filter((student) => /^f(emale)?$/i.test(String(student.gender || ""))).length;
  const minimumPassMark = passMark(db);
  const passed = students.filter((student) => student.average >= minimumPassMark).length;
  return {
    totalLearners: db.students.length,
    activeLearners: students.length,
    boys,
    girls,
    teachers: db.teachers.filter((teacher) => teacher.active !== false).length,
    classes: new Set(db.classes.map((item) => item.level)).size,
    streams: db.streams.filter((stream) => stream.active !== false).length,
    subjects: db.subjects.filter((subject) => subject.active !== false).length,
    schoolAverage: averages(students),
    passRate: students.length ? Math.round((passed / students.length) * 100) : 0,
    failRate: students.length ? Math.round(((students.length - passed) / students.length) * 100) : 0,
    promotionRate: students.length ? Math.round((students.filter((student) => student.promotion === "PROMOTED").length / students.length) * 100) : 0,
    uploadCompletion: monitoring.completionRate,
    subjectsSubmitted: db.subjects.filter((subject) => db.marks.some((mark) => mark.subjectId === subject.id && mark.status === "Captured")).length,
    topSubject: subjectStats[0] || null,
    lowestSubject: subjectStats[subjectStats.length - 1] || null,
    topClass: classRows[0] || null,
    topStream: streamRows[0] || null,
    recentUploads: enrichUploadBatches(db)
      .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))
      .slice(0, 5),
    recentActivity: [...(db.audit || [])]
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 8),
    atRiskLearners: bands.find((band) => band.id === "at-risk")?.learners || 0,
    performanceBands: bands,
    classComparison: classRows,
    genderAnalysis: summarized((student) => student.gender || "Not recorded"),
    streamAnalysis: summarized((student) => student.stream || "Not recorded")
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
  if (!summary.capturedSubjects) return "MANUAL REVIEW";
  if (rules.requireCompleteMarks && summary.missingSubjects) return "MANUAL REVIEW";
  if (summary.average >= rules.minAverage && summary.failedSubjects <= rules.maxFailedSubjects) return "PROMOTED";
  return "REPEAT";
}

function promotionRulesForClass(db, classId) {
  const base = db.promotionRules || {};
  const override = base.perClass?.[classId] || {};
  return {
    ...base,
    ...override,
    mandatorySubjectIds: Array.isArray(override.mandatorySubjectIds)
      ? override.mandatorySubjectIds
      : Array.isArray(base.mandatorySubjectIds) ? base.mandatorySubjectIds : []
  };
}

function promotionPreview(db, rankedStudents) {
  const processedStudentIds = new Set((db.promotionHistory || [])
    .filter((history) => history.academicYear === db.school.academicYear)
    .flatMap((history) => history.rows || [])
    .filter((row) => row.decision !== "MANUAL REVIEW")
    .map((row) => row.studentId));
  return rankedStudents.filter((student) => !processedStudentIds.has(student.id)).map((student) => ({
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
  db.movements = Array.isArray(db.movements) ? db.movements : [];
  db.promotionHistory = Array.isArray(db.promotionHistory) ? db.promotionHistory : [];
  db.audit = Array.isArray(db.audit) ? db.audit : [];
  const results = calculateResults(db);
  const historyId = `promotion-${Date.now()}`;
  const overrides = new Map((body.overrides || []).map((item) => [item.studentId, item]));
  const approved = [];
  const unresolved = [];
  for (const row of results.promotionPreview) {
    const student = db.students.find((item) => item.id === row.studentId);
    if (!student) continue;
    const override = overrides.get(row.studentId) || {};
    const decision = ["PROMOTED", "REPEAT", "MANUAL REVIEW"].includes(override.decision)
      ? override.decision
      : row.decision;
    if (decision === "MANUAL REVIEW") {
      unresolved.push({ studentId: row.studentId, admissionNo: row.admissionNo, name: row.name });
      continue;
    }
    const before = student.classId;
    const fromClass = db.classes.find((item) => item.id === before);
    const targetClassIdValue = decision === "PROMOTED"
      ? override.targetClassId || row.targetClassId
      : before;
    if (decision === "PROMOTED" && targetClassIdValue === "graduated") {
      student.status = "Graduated";
    } else if (decision === "PROMOTED") {
      const target = db.classes.find((item) => item.id === targetClassIdValue);
      if (!target) {
        const error = new Error(`Invalid promotion target for ${student.name}`);
        error.statusCode = 422;
        throw error;
      }
      student.classId = target.id;
      student.classLevel = target.level;
      student.stream = target.stream;
    }
    if (decision === "PROMOTED" || decision === "REPEAT") {
      const target = db.classes.find((item) => item.id === targetClassIdValue);
      db.movements.unshift({
        id: `movement-${Date.now()}-${student.id}`,
        studentId: student.id,
        admissionNo: student.admissionNo,
        movementType: decision === "REPEAT" ? "Repeat" : targetClassIdValue === "graduated" ? "Graduation" : "Promotion",
        movementDate: new Date().toISOString().slice(0, 10),
        fromClassId: before,
        fromClass: fromClass?.level || student.classLevel,
        fromStream: fromClass?.stream || student.stream,
        toClassId: target?.id || "",
        toClass: decision === "REPEAT" ? fromClass?.level || student.classLevel : target?.level || "Graduated",
        toStream: decision === "REPEAT" ? fromClass?.stream || student.stream : target?.stream || "",
        approvedBy: body.approvedBy || "Head Teacher",
        promotionHistoryId: historyId,
        remarks: override.notes || `${decision === "REPEAT" ? "Approved to repeat" : "Approved for"} ${db.promotionRules.nextAcademicYear}`
      });
    }
    approved.push({
      studentId: student.id,
      admissionNo: student.admissionNo,
      before,
      after: student.classId,
      decision,
      notes: override.notes || ""
    });
  }
  const history = {
    id: historyId,
    approvedBy: body.approvedBy || "Head Teacher",
    approvedAt: new Date().toISOString(),
    academicYear: db.school.academicYear,
    nextAcademicYear: db.promotionRules.nextAcademicYear,
    rows: approved,
    unresolved
  };
  db.promotionRules.status = unresolved.length ? "Partially Approved" : "Approved";
  db.promotionHistory.push(history);
  db.audit.push(audit(history.approvedBy, "Approved promotion", "-", `${approved.length} learners processed; ${unresolved.length} pending review`));
  return history;
}

function rollbackPromotion(db, body = {}) {
  db.movements = Array.isArray(db.movements) ? db.movements : [];
  db.promotionHistory = Array.isArray(db.promotionHistory) ? db.promotionHistory : [];
  db.audit = Array.isArray(db.audit) ? db.audit : [];
  const historyId = String(body.historyId || db.promotionHistory.at(-1)?.id || "");
  const history = db.promotionHistory.find((item) => item.id === historyId);
  if (!history) throw new Error("No promotion approval is available to roll back");
  if (history.rolledBackAt) throw new Error("This promotion approval has already been rolled back");
  for (const row of history.rows || []) {
    const student = db.students.find((item) => item.id === row.studentId);
    if (!student) continue;
    const previousClass = db.classes.find((item) => item.id === row.before);
    if (previousClass) {
      student.classId = previousClass.id;
      student.classLevel = previousClass.level;
      student.stream = previousClass.stream;
      student.status = "Active";
    }
  }
  db.movements = db.movements.filter((movement) => movement.promotionHistoryId !== history.id);
  history.rolledBackAt = new Date().toISOString();
  history.rolledBackBy = body.rolledBackBy || "School Admin";
  history.rollbackReason = body.reason || "Promotion approval rolled back";
  db.promotionRules.status = "Draft";
  db.audit.push(audit(history.rolledBackBy, "Rolled back promotion", history.id, history.rollbackReason));
  return history;
}

function verificationPrefix(school = {}) {
  return String(school.verificationPrefix || school.shortName || "SHULE")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12) || "SHULE";
}

function currentContextMarks(db) {
  return db.marks.filter((mark) =>
    mark.academicYear === db.school.academicYear &&
    mark.term === db.school.term &&
    mark.examType === db.school.exam
  );
}

function passMark(db) {
  const passing = db.gradingScale
    .filter((row) => String(row.grade).toUpperCase() !== "F9" && Number(row.aggregate) < 9)
    .map((row) => Number(row.min))
    .filter(Number.isFinite);
  return passing.length ? Math.min(...passing) : 40;
}

function performanceSummary(subject, marks, expectedLearners, minimumPassMark) {
  const captured = marks.filter((mark) => mark.subjectId === subject.id && mark.status === "Captured");
  const scores = captured.map((mark) => Number(mark.score)).filter(Number.isFinite);
  const passed = scores.filter((score) => score >= minimumPassMark).length;
  return {
    subjectId: subject.id,
    subjectName: subject.name,
    subjectCode: subject.code,
    entries: scores.length,
    average: round(scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0),
    highest: scores.length ? Math.max(...scores) : 0,
    lowest: scores.length ? Math.min(...scores) : 0,
    passRate: scores.length ? Math.round((passed / scores.length) * 100) : 0,
    failed: scores.length - passed,
    missing: Math.max(0, expectedLearners - new Set(captured.map((mark) => mark.studentId)).size)
  };
}

function subjectPerformance(db, activeStudents) {
  const marks = currentContextMarks(db);
  const minimumPassMark = passMark(db);
  return db.subjects.map((subject) => performanceSummary(subject, marks, activeStudents.length, minimumPassMark));
}

function classSubjectPerformance(db, activeStudents) {
  const marks = currentContextMarks(db);
  const minimumPassMark = passMark(db);
  return db.classes.map((classInfo) => {
    const learners = activeStudents.filter((student) => student.classId === classInfo.id);
    const studentIds = new Set(learners.map((student) => student.id));
    const classMarks = marks.filter((mark) => studentIds.has(mark.studentId));
    return {
      classId: classInfo.id,
      className: classInfo.name,
      level: classInfo.level,
      stream: classInfo.stream,
      learners: learners.length,
      subjects: db.subjects.map((subject) => performanceSummary(subject, classMarks, learners.length, minimumPassMark))
    };
  });
}

function learnerPerformanceBands(students) {
  const bands = [
    { id: "excellent", name: "Excellent", min: 80, max: 100 },
    { id: "on-track", name: "On Track", min: 60, max: 79.999 },
    { id: "support", name: "Needs Support", min: 40, max: 59.999 },
    { id: "at-risk", name: "At Risk", min: 0, max: 39.999 }
  ];
  return bands.map((band) => ({
    ...band,
    learners: students.filter((student) => student.average >= band.min && student.average <= band.max).length
  }));
}

function buildStudentTrends(db) {
  const termOrder = new Map(db.terms.map((item, index) => [item.name, index]));
  const examOrder = new Map(db.examTypes.map((item, index) => [item.name, index]));
  const byStudent = new Map();
  for (const mark of db.marks.filter((item) => item.status === "Captured")) {
    if (!byStudent.has(mark.studentId)) byStudent.set(mark.studentId, new Map());
    const contexts = byStudent.get(mark.studentId);
    const key = `${mark.academicYear}|${mark.term}|${mark.examType}`;
    if (!contexts.has(key)) {
      contexts.set(key, {
        academicYear: mark.academicYear,
        term: mark.term,
        examType: mark.examType,
        scores: []
      });
    }
    contexts.get(key).scores.push(Number(mark.score));
  }
  return Object.fromEntries([...byStudent].map(([studentId, contexts]) => {
    const rows = [...contexts.values()]
      .map((item) => ({
        academicYear: item.academicYear,
        term: item.term,
        examType: item.examType,
        label: `${item.term} ${item.examType}`,
        average: round(item.scores.reduce((sum, score) => sum + score, 0) / item.scores.length),
        subjects: item.scores.length
      }))
      .sort((a, b) =>
        Number(a.academicYear || 0) - Number(b.academicYear || 0) ||
        (termOrder.get(a.term) ?? 999) - (termOrder.get(b.term) ?? 999) ||
        (examOrder.get(a.examType) ?? 999) - (examOrder.get(b.examType) ?? 999)
      );
    return [studentId, rows];
  }));
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
  for (const list of groupBy(students, (student) => `${student.className}-${student.stream}-${student.gender}`).values()) {
    [...list].sort((a, b) => b.average - a.average || a.name.localeCompare(b.name)).forEach((student, index) => {
      student.genderPosition = index + 1;
    });
  }
  return overall;
}

function assignSubjectRanks(students) {
  for (const list of groupBy(students, (student) => `${student.className}-${student.stream}`).values()) {
    const subjectIds = new Set(list.flatMap((student) => student.subjects.map((subject) => subject.subjectId)));
    for (const subjectId of subjectIds) {
      list
        .map((student) => ({ student, subject: student.subjects.find((subject) => subject.subjectId === subjectId) }))
        .filter((item) => item.subject?.score !== null)
        .sort((a, b) => b.subject.score - a.subject.score || a.student.name.localeCompare(b.student.name))
        .forEach((item, index) => { item.subject.subjectPosition = index + 1; });
    }
  }
  return students;
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
  const workflow = assessmentWorkflowFor(db, body);
  if (["Approved", "Locked"].includes(workflow.status)) {
    errors.push(errorRow("-", "-", "Assessment Locked", `${workflow.status} marks cannot be edited. Ask an administrator to reopen this assessment.`));
    return errors;
  }
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
  const workflow = assessmentWorkflowFor(db, payload);
  if (["Approved", "Locked"].includes(workflow.status)) {
    throw new Error(`${workflow.status} marks cannot be edited`);
  }
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
    remarks: payload.remarks ?? existing?.remarks ?? ""
  };
  if (existing) Object.assign(existing, row);
  else db.marks.push(row);
  touchAssessmentWorkflow(db, payload, "Draft", payload.updatedBy || "Teacher");
}

function findExistingMark(db, payload) {
  const student = db.students.find((item) => item.id === payload.studentId || item.admissionNo === payload.admissionNo);
  if (!student) return null;
  return db.marks.find((mark) =>
    mark.studentId === student.id &&
    mark.subjectId === payload.subjectId &&
    mark.academicYear === payload.academicYear &&
    mark.term === payload.term &&
    mark.examType === payload.examType
  ) || null;
}

function isDuplicateMark(db, payload) {
  const existing = findExistingMark(db, payload);
  if (!existing) return false;
  return Number(existing.score) === Number(payload.score) &&
    String(existing.status || "Captured") === String(payload.status || "Captured") &&
    String(existing.remarks || "") === String(payload.remarks || "");
}

function assessmentWorkflowKey(context) {
  return [
    context.academicYear,
    context.term,
    context.examType,
    context.classId,
    context.subjectId
  ].map((value) => String(value || "").trim()).join("|");
}

function assessmentWorkflowFor(db, context) {
  db.assessmentWorkflows = Array.isArray(db.assessmentWorkflows) ? db.assessmentWorkflows : [];
  const key = assessmentWorkflowKey(context);
  return db.assessmentWorkflows.find((item) => item.key === key) || {
    key,
    academicYear: context.academicYear,
    term: context.term,
    examType: context.examType,
    classId: context.classId,
    subjectId: context.subjectId,
    teacherId: context.teacherId || "",
    status: "Draft",
    history: []
  };
}

function touchAssessmentWorkflow(db, context, status, actor, note = "") {
  db.assessmentWorkflows = Array.isArray(db.assessmentWorkflows) ? db.assessmentWorkflows : [];
  const key = assessmentWorkflowKey(context);
  let workflow = db.assessmentWorkflows.find((item) => item.key === key);
  if (!workflow) {
    workflow = {
      key,
      academicYear: context.academicYear,
      term: context.term,
      examType: context.examType,
      classId: context.classId,
      subjectId: context.subjectId,
      teacherId: context.teacherId || "",
      status: "Draft",
      history: []
    };
    db.assessmentWorkflows.push(workflow);
  }
  const previousStatus = workflow.status;
  workflow.teacherId = context.teacherId || workflow.teacherId || "";
  workflow.status = status || workflow.status;
  workflow.updatedAt = new Date().toISOString();
  workflow.updatedBy = actor || "System";
  workflow.history = Array.isArray(workflow.history) ? workflow.history : [];
  if (!workflow.history.length || previousStatus !== workflow.status || note) {
    workflow.history.push({ status: workflow.status, actor: workflow.updatedBy, note, timestamp: workflow.updatedAt });
  }
  return workflow;
}

function transitionAssessmentWorkflow(db, body, actor = {}) {
  const workflow = assessmentWorkflowFor(db, body);
  const action = String(body.workflowAction || "").toLowerCase();
  const transitions = {
    submit: { from: ["Draft"], to: "Submitted", roles: ["Super Admin", "School Admin", "DOS", "Class Teacher", "Subject Teacher"] },
    approve: { from: ["Submitted"], to: "Approved", roles: ["Super Admin", "School Admin", "DOS"] },
    lock: { from: ["Approved"], to: "Locked", roles: ["Super Admin", "School Admin", "Head Teacher"] },
    reopen: { from: ["Submitted", "Approved", "Locked"], to: "Draft", roles: ["Super Admin", "School Admin"] }
  };
  const rule = transitions[action];
  if (!rule) throw new Error("Invalid assessment workflow action");
  if (!rule.roles.includes(actor.role)) {
    const error = new Error("Your role cannot perform this assessment action");
    error.statusCode = 403;
    throw error;
  }
  if (!rule.from.includes(workflow.status)) {
    throw new Error(`Assessment cannot move from ${workflow.status} using ${action}`);
  }
  if (action === "submit") {
    const activeStudents = db.students.filter((student) => student.status === "Active" && student.classId === body.classId);
    const recorded = new Set(db.marks.filter((mark) =>
      mark.classId === body.classId &&
      mark.subjectId === body.subjectId &&
      mark.academicYear === body.academicYear &&
      mark.term === body.term &&
      mark.examType === body.examType &&
      ["Captured", "Absent", "Exempted"].includes(mark.status)
    ).map((mark) => mark.studentId));
    const missing = activeStudents.filter((student) => !recorded.has(student.id));
    if (missing.length) {
      const error = new Error(`Cannot submit: ${missing.length} active learner(s) have no mark or absence status`);
      error.statusCode = 422;
      throw error;
    }
  }
  const previous = workflow.status;
  const updated = touchAssessmentWorkflow(db, body, rule.to, actor.name || actor.email || actor.role, body.note || "");
  db.audit.push(audit(updated.updatedBy, `${rule.to} assessment`, previous, updated.key));
  return updated;
}

function buildStudentRow(db, body, existing = null) {
  const classId = body.classId || `${String(body.classLevel || "P6").toLowerCase()}-${String(body.stream || "East").toLowerCase()}`;
  return {
    id: existing?.id || slug(body.studentId || body.admissionNo || `student-${Date.now()}`),
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
    alternativeContact: body.alternativeContact || existing?.alternativeContact || "",
    photo: body.photo || "",
    classId,
    status: body.status || "Active",
    admissionDate: body.admissionDate || new Date().toISOString().slice(0, 10),
    notes: body.notes || "",
    attendance: Number(body.attendance || 0),
    attendanceDays: body.attendanceDays || existing?.attendanceDays || { present: 0, absent: 0, total: 0 },
    activities: body.activities || existing?.activities || [],
    conduct: body.conduct || "Good",
    competencies: existing?.competencies || { Communication: 3, Leadership: 3, Creativity: 3, Discipline: 3, Teamwork: 3, Responsibility: 3, Respect: 3 },
    reportComments: body.reportComments || existing?.reportComments || { classTeacher: "", dos: "", headTeacher: "" }
  };
}

function validateStudentRow(db, studentRow, existing = null) {
  if (!studentRow.admissionNo || !studentRow.name) throw new Error("Student ID/admission number and full name are required");
  if (!STUDENT_STATUSES.includes(studentRow.status)) throw new Error("Invalid student status");
  if (!db.classes.some((item) => item.id === studentRow.classId)) throw new Error(`Class and stream do not exist: ${studentRow.classLevel} ${studentRow.stream}`);
  if (!existing && db.students.some((student) => student.admissionNo.toLowerCase() === studentRow.admissionNo.toLowerCase())) throw new Error("Admission number already exists");
}

function addStudent(db, body) {
  const studentRow = buildStudentRow(db, body);
  validateStudentRow(db, studentRow);
  db.students.push(studentRow);
  db.audit.push(audit("School Admin", "Created student", "-", studentRow.admissionNo));
  return studentRow;
}

function importStudents(db, body, options = {}) {
  const commit = options.commit !== false;
  const rows = Array.isArray(body.students) ? body.students : [];
  if (!rows.length) throw new Error("No student rows were supplied");
  if (rows.length > 1000) throw new Error("A class-list upload cannot exceed 1,000 students");

  const errors = [];
  const prepared = [];
  const skippedDuplicates = [];
  const seen = new Set();

  rows.forEach((input, index) => {
    const rowNumber = Number(input.rowNumber || index + 2);
    const admissionNo = String(input.admissionNo || input.studentId || "").trim();
    const key = admissionNo.toLowerCase();
    if (!admissionNo) {
      errors.push(errorRow(rowNumber, "", "Missing Admission Number", "Admission number is required"));
      return;
    }
    if (seen.has(key)) {
      errors.push(errorRow(rowNumber, admissionNo, "Duplicate Student", "Admission number appears more than once in the file"));
      return;
    }
    seen.add(key);

    const existing = db.students.find((student) => student.admissionNo.toLowerCase() === key);
    try {
      if (body.mixedClasses && (!String(input.classLevel || "").trim() || !String(input.stream || "").trim())) {
        throw new Error("Class and stream are required on every row for a multiple-class upload");
      }
      const supplied = Object.fromEntries(Object.entries(input).filter(([field, value]) =>
        field === "rowNumber" || (value !== null && value !== undefined && String(value).trim() !== "")
      ));
      const studentRow = buildStudentRow(db, {
        ...existing,
        ...supplied,
        classLevel: supplied.classLevel || body.classLevel || existing?.classLevel,
        stream: supplied.stream || body.stream || existing?.stream,
        classId: supplied.classId || undefined,
        status: supplied.status || existing?.status || "Active",
        attendance: supplied.attendance ?? existing?.attendance ?? 0,
        photo: supplied.photo || existing?.photo || ""
      }, existing);
      validateStudentRow(db, studentRow, existing);
      if (existing && isDuplicateStudent(existing, studentRow)) {
        skippedDuplicates.push({ rowNumber, admissionNo: studentRow.admissionNo, name: studentRow.name });
        return;
      }
      prepared.push({ existing, studentRow, rowNumber });
    } catch (error) {
      errors.push(errorRow(rowNumber, admissionNo, "Invalid Student", error.message));
    }
  });

  if (errors.length) return { ok: false, errors, created: 0, updated: 0 };

  const created = prepared.filter((item) => !item.existing).length;
  const updated = prepared.length - created;
  const skipped = skippedDuplicates.length;
  const classBreakdown = [...prepared.reduce((groups, { studentRow }) => {
    const label = `${studentRow.classLevel} ${studentRow.stream}`.trim();
    groups.set(label, (groups.get(label) || 0) + 1);
    return groups;
  }, new Map())].map(([className, count]) => ({ className, count }));

  if (!commit) {
    return {
      ok: true,
      errors: [],
      created,
      updated,
      skipped,
      duplicateWarning: duplicateUploadWarning(skipped, rows.length),
      total: prepared.length,
      classBreakdown,
      preview: [
        ...prepared.slice(0, 25).map(({ existing, studentRow, rowNumber }) => ({
        rowNumber,
        admissionNo: studentRow.admissionNo,
        name: studentRow.name,
        classLevel: studentRow.classLevel,
        stream: studentRow.stream,
        action: existing ? "Update" : "Create"
        })),
        ...skippedDuplicates.slice(0, Math.max(0, 25 - prepared.length)).map((item) => ({
          rowNumber: item.rowNumber,
          admissionNo: item.admissionNo,
          name: item.name,
          classLevel: "",
          stream: "",
          action: "Skip duplicate"
        }))
      ]
    };
  }

  for (const { existing, studentRow } of prepared) {
    if (existing) {
      Object.assign(existing, studentRow);
    } else {
      db.students.push(studentRow);
    }
  }
  db.audit.push(audit("School Admin", "Imported student class list", "-", `${created} created, ${updated} updated, ${skipped} duplicate(s) skipped`));
  return { ok: true, errors: [], created, updated, skipped, duplicateWarning: duplicateUploadWarning(skipped, rows.length), total: prepared.length, classBreakdown };
}

function isDuplicateStudent(existing, incoming) {
  const fields = [
    "studentId",
    "admissionNo",
    "name",
    "gender",
    "dateOfBirth",
    "classLevel",
    "stream",
    "house",
    "guardian",
    "contact",
    "status",
    "admissionDate",
    "notes"
  ];
  return fields.every((field) => String(existing[field] || "").trim() === String(incoming[field] || "").trim()) &&
    Number(existing.attendance || 0) === Number(incoming.attendance || 0);
}

function duplicateUploadWarning(skipped, totalRows) {
  if (!skipped) return "";
  const percent = totalRows ? Math.round((skipped / totalRows) * 100) : 0;
  return percent >= 50
    ? `${skipped} duplicate record(s) were already in the system and were skipped. More than half of this file already exists.`
    : `${skipped} duplicate record(s) were already in the system and were skipped.`;
}

function ensureTeacher(db, body) {
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) throw new Error("Teacher email is required");
  let teacherRow = db.teachers.find((item) => String(item.email || "").trim().toLowerCase() === email);
  if (!teacherRow) {
    teacherRow = {
      id: body.id || `teacher-${slug(email)}`,
      name: String(body.name || email).trim(),
      role: body.role || "Subject Teacher",
      email,
      active: true
    };
    db.teachers.push(teacherRow);
    db.audit.push(audit("Super Admin", "Created teacher profile", "-", teacherRow.email));
  } else {
    teacherRow.name = String(body.name || teacherRow.name).trim();
    teacherRow.role = body.role || teacherRow.role;
    teacherRow.active = true;
  }
  return teacherRow;
}

function saveTeacherAssignment(db, body) {
  const teacherId = String(body.teacherId || "");
  const classId = String(body.classId || "");
  const subjectId = String(body.subjectId || "");
  if (!db.teachers.some((item) => item.id === teacherId)) throw new Error("Select a valid teacher");
  if (!db.classes.some((item) => item.id === classId)) throw new Error("Select a valid class and stream");
  if (!db.subjects.some((item) => item.id === subjectId)) throw new Error("Select a valid subject");
  const existing = db.teacherAssignments.find((item) =>
    item.teacherId === teacherId && item.classId === classId && item.subjectId === subjectId
  );
  if (existing) {
    existing.active = true;
    return existing;
  }
  const assignmentRow = assignment(teacherId, classId, subjectId);
  db.teacherAssignments.push(assignmentRow);
  db.audit.push(audit("School Admin", "Assigned teacher", "-", `${teacherId} / ${classId} / ${subjectId}`));
  return assignmentRow;
}

function updateStudentPhoto(db, body) {
  const student = db.students.find((item) => item.id === body.studentId || item.admissionNo === body.admissionNo);
  if (!student) throw new Error("Student not found");
  const photo = String(body.photo || "");
  if (!photo) throw new Error("Select a photo to upload");
  if (photo.length > 1_500_000) throw new Error("Photo is too large after compression");
  if (!photo.startsWith("data:image/") && !/^https?:\/\//i.test(photo)) throw new Error("Photo must be an uploaded image or a valid URL");
  student.photo = photo;
  db.audit.push(audit("School Admin", "Updated student photo", "-", student.admissionNo));
  return student;
}

async function secureStudentPhoto(db, body) {
  const student = db.students.find((item) => item.id === body.studentId || item.admissionNo === body.admissionNo);
  if (!student) throw new Error("Student not found");
  const photo = String(body.photo || "");
  if (!photo) throw new Error("Select a photo to upload");
  if (isStorageRef(photo) || /^https?:\/\//i.test(photo)) {
    return updateStudentPhoto(db, body);
  }
  if (!photo.startsWith("data:image/")) throw new Error("Photo must be an image");
  if (!supabaseConfigured()) {
    if (!ALLOW_JSON_FALLBACK) throw new Error("Private photo storage requires Supabase configuration");
    return updateStudentPhoto(db, body);
  }
  const stored = await storePrivateDataUrl(photo, `students/${student.id}/photo-${Date.now()}`);
  student.photo = stored.ref;
  db.studentDocuments = Array.isArray(db.studentDocuments) ? db.studentDocuments : [];
  db.studentDocuments.unshift({
    id: `doc-${Date.now()}-${student.id}`,
    studentId: student.id,
    documentType: "Student Photo",
    fileUrl: stored.ref,
    fileName: stored.fileName,
    uploadedBy: body.updatedBy || "School Admin",
    createdAt: new Date().toISOString()
  });
  db.audit.push(audit(body.updatedBy || "School Admin", "Updated private student photo", "-", student.admissionNo));
  return student;
}

function updateStudentDetails(db, body) {
  const student = db.students.find((item) => item.id === body.studentId || item.admissionNo === body.admissionNo);
  if (!student) throw new Error("Student not found");
  const editable = ["guardian", "contact", "alternativeContact", "notes", "conduct", "status"];
  for (const field of editable) {
    if (body[field] !== undefined) student[field] = body[field];
  }
  if (body.attendanceDays) {
    const present = Math.max(0, Number(body.attendanceDays.present || 0));
    const absent = Math.max(0, Number(body.attendanceDays.absent || 0));
    const total = Math.max(present + absent, Number(body.attendanceDays.total || 0));
    student.attendanceDays = { present, absent, total };
    student.attendance = total ? Math.round((present / total) * 100) : 0;
  }
  if (Array.isArray(body.activities)) student.activities = body.activities.filter(Boolean);
  if (body.reportComments) student.reportComments = { ...student.reportComments, ...body.reportComments };
  db.audit.push(audit("School Admin", "Updated student profile", "-", student.admissionNo));
  return student;
}

function addMovement(db, body) {
  const student = db.students.find((item) => item.id === body.studentId || item.admissionNo === body.admissionNo);
  if (!student) throw new Error("Student not found");
  const fromClass = db.classes.find((item) => item.id === student.classId);
  const toClass = body.toClassId ? db.classes.find((item) => item.id === body.toClassId) : null;
  if (body.toClassId && !toClass) throw new Error("Select a valid destination class and stream");
  const movement = {
    id: `movement-${Date.now()}`,
    studentId: student.id,
    admissionNo: student.admissionNo,
    movementType: body.movementType || "Class Change",
    movementDate: body.movementDate || new Date().toISOString().slice(0, 10),
    fromClassId: student.classId,
    fromClass: fromClass?.level || student.classLevel,
    fromStream: fromClass?.stream || student.stream,
    toClassId: toClass?.id || "",
    toClass: toClass?.level || "",
    toStream: toClass?.stream || "",
    approvedBy: body.approvedBy || "School Admin",
    remarks: body.remarks || ""
  };
  if (toClass) {
    student.classId = toClass.id;
    student.classLevel = toClass.level;
    student.stream = toClass.stream;
  }
  if (body.status && STUDENT_STATUSES.includes(body.status)) student.status = body.status;
  db.movements.unshift(movement);
  db.audit.push(audit(movement.approvedBy, `Recorded ${movement.movementType}`, `${movement.fromClass} ${movement.fromStream}`, `${movement.toClass} ${movement.toStream}`.trim()));
  return movement;
}

function updateSettings(db, body) {
  if (body.nextTerm) db.nextTerm = { ...db.nextTerm, ...body.nextTerm };
  if (body.comments) db.comments = { ...db.comments, ...body.comments };
  if (body.promotionRules) {
    db.promotionRules = {
      ...db.promotionRules,
      ...body.promotionRules,
      perClass: {
        ...(db.promotionRules?.perClass || {}),
        ...(body.promotionRules.perClass || {})
      }
    };
  }
  db.audit.push(audit("School Admin", "Updated report settings", "-", "Comments and next-term information"));
  return { comments: db.comments, nextTerm: db.nextTerm, promotionRules: db.promotionRules };
}

function verifiedReport(db, code) {
  const normalizedCode = String(code || "").trim();
  const archived = latestArchivedReport(db, { verificationCode: normalizedCode });
  if (archived) {
    return {
      school: archived.data.school,
      student: archived.data.student,
      nextTerm: archived.data.nextTerm,
      verifiedAt: new Date().toISOString(),
      archivedAt: archived.issuedAt,
      archiveId: archived.id
    };
  }
  const student = calculateResults(db).students.find((item) => item.verificationCode === normalizedCode);
  if (!student) throw new Error("Verification code not found");
  return buildReportPayload(db, student, new Date().toISOString());
}

function buildReportPayload(db, student, issuedAt) {
  const publicStudent = {
    id: student.id,
    admissionNo: student.admissionNo,
    studentId: student.studentId,
    name: student.name,
    gender: student.gender,
    photo: publicAssetRef(student.photo),
    className: student.className,
    stream: student.stream,
    status: student.status,
    attendance: student.attendance,
    attendanceDays: student.attendanceDays,
    conduct: student.conduct,
    activities: student.activities,
    competencies: student.competencies,
    reportComments: student.reportComments,
    subjects: student.subjects,
    total: student.total,
    average: student.average,
    aggregate: student.aggregate,
    overallGrade: student.overallGrade,
    position: student.position,
    classPosition: student.classPosition,
    streamPosition: student.streamPosition,
    genderPosition: student.genderPosition,
    promotion: student.promotion,
    verificationCode: student.verificationCode,
    reportIssueDate: issuedAt
  };
  return {
    school: {
      name: db.school.name,
      shortName: db.school.shortName,
      motto: db.school.motto,
      logoUrl: db.school.logoUrl,
      academicYear: db.school.academicYear,
      term: db.school.term,
      exam: db.school.exam
    },
    student: publicStudent,
    nextTerm: db.nextTerm,
    verifiedAt: new Date().toISOString()
  };
}

function archiveReports(db, body, session = {}) {
  const results = calculateResults(db);
  const requestedIds = new Set(Array.isArray(body.studentIds) ? body.studentIds : []);
  let students = results.students;
  if (body.classId) students = students.filter((student) => student.classId === body.classId);
  if (requestedIds.size) students = students.filter((student) => requestedIds.has(student.id));
  if (!students.length) throw new Error("No report cards matched the selected archive request");
  db.reportArchive = Array.isArray(db.reportArchive) ? db.reportArchive : [];
  const issuedAt = new Date().toISOString();
  const rows = students.map((student, index) => {
    const payload = buildReportPayload(db, student, issuedAt);
    const row = {
      id: `report-${Date.now()}-${index}-${student.id}`,
      studentId: student.id,
      admissionNo: student.admissionNo,
      studentName: student.name,
      classId: student.classId,
      className: `${student.className} ${student.stream}`.trim(),
      academicYear: db.school.academicYear,
      term: db.school.term,
      examType: db.school.exam,
      verificationCode: student.verificationCode,
      issuedAt,
      issuedBy: session.name || body.issuedBy || "School Admin",
      average: student.average,
      aggregate: student.aggregate,
      position: student.classPosition,
      data: payload
    };
    db.reportArchive.unshift(row);
    return row;
  });
  db.audit.push(audit(session.name || "School Admin", "Archived report card", "-", `${rows.length} report(s)`));
  return { ok: true, archived: rows.length, reports: rows };
}

function listReportArchive(db, query = {}) {
  const rows = Array.isArray(db.reportArchive) ? db.reportArchive : [];
  return paginateRows(rows, query, ["studentName", "admissionNo", "className", "verificationCode", "academicYear", "term", "examType"]);
}

function latestArchivedReport(db, filters = {}) {
  return (db.reportArchive || [])
    .filter((row) => !filters.verificationCode || row.verificationCode === filters.verificationCode)
    .sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0))[0] || null;
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

function paginateRows(items, query = {}, searchableFields = []) {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(200, Math.max(10, Number(query.pageSize || query.limit || 50)));
  const search = String(query.search || "").trim().toLowerCase();
  const sortBy = String(query.sortBy || query.sort || "").trim();
  const sortDir = String(query.sortDir || query.direction || "asc").toLowerCase() === "desc" ? -1 : 1;
  let rows = Array.isArray(items) ? [...items] : [];
  if (query.classId) rows = rows.filter((item) => item.classId === query.classId);
  if (query.studentId) rows = rows.filter((item) => item.studentId === query.studentId || item.id === query.studentId);
  if (query.status) rows = rows.filter((item) => String(item.status || "").toLowerCase() === String(query.status).toLowerCase());
  if (query.term) rows = rows.filter((item) => String(item.term || "").toLowerCase() === String(query.term).toLowerCase());
  if (query.academicYear) rows = rows.filter((item) => String(item.academicYear || "").toLowerCase() === String(query.academicYear).toLowerCase());
  if (search) {
    rows = rows.filter((item) => searchableFields.some((field) =>
      String(field.split(".").reduce((value, key) => value?.[key], item) || "").toLowerCase().includes(search)
    ));
  }
  if (sortBy) {
    rows.sort((left, right) => String(left?.[sortBy] || "").localeCompare(String(right?.[sortBy] || ""), undefined, { numeric: true }) * sortDir);
  }
  const total = rows.length;
  const start = (page - 1) * pageSize;
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    rows: rows.slice(start, start + pageSize)
  };
}

function listStudents(db, query = {}) {
  return paginateRows(db.students || [], query, ["name", "studentId", "admissionNo", "guardian", "contact", "classLevel", "stream", "status"]);
}

function listMarks(db, query = {}) {
  return paginateRows(db.marks || [], query, ["studentId", "subjectId", "classId", "academicYear", "term", "examType", "status", "remarks"]);
}

function listAudit(db, query = {}) {
  return paginateRows(db.audit || [], query, ["user", "action", "previousValue", "newValue"]);
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
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function loadDb() {
  if (!supabaseConfigured() && !ALLOW_JSON_FALLBACK) {
    activeStorageMode = "failed";
    lastStorageError = "Supabase is required in production but is not configured";
    throw new Error(lastStorageError);
  }
  if (supabaseConfigured()) {
    try {
      const db = await readSupabaseDb();
      activeStorageMode = "supabase";
      lastStorageError = "";
      lastStorageFetchAt = new Date().toISOString();
      return normalizeDb(db);
    } catch (error) {
      lastStorageError = sanitizeStorageError(error.message);
      if (!ALLOW_JSON_FALLBACK) {
        activeStorageMode = "failed";
        console.error(`Supabase read failed. ${lastStorageError}`);
        throw error;
      }
      activeStorageMode = "json";
      console.error(`Supabase read failed; using explicitly enabled JSON fallback. ${lastStorageError}`);
    }
  }
  return normalizeDb(readDb());
}

async function saveDb(data) {
  normalizeDb(data);
  if (supabaseConfigured()) {
    try {
      const db = await writeSupabaseDb(data);
      activeStorageMode = "supabase";
      lastStorageError = "";
      return db;
    } catch (error) {
      lastStorageError = sanitizeStorageError(error.message);
      if (!ALLOW_JSON_FALLBACK) {
        activeStorageMode = "failed";
        console.error(`Supabase write failed. ${lastStorageError}`);
        throw error;
      }
      activeStorageMode = "json";
      console.error(`Supabase write failed; using explicitly enabled JSON fallback. ${lastStorageError}`);
    }
  }
  writeDb(data);
  return data;
}

function storageMode() {
  return activeStorageMode;
}

function storageStatus() {
  return {
    configured: supabaseConfigured(),
    mode: activeStorageMode,
    supabaseUrlConfigured: Boolean(SUPABASE_URL),
    keyConfigured: Boolean(SUPABASE_KEY),
    keyType: supabaseKeyType(SUPABASE_KEY),
    tablesReachable: activeStorageMode === "supabase" && !lastStorageError,
    checkedTables: lastTableCounts,
    lastFetchAt: lastStorageFetchAt,
    lastError: lastStorageError
  };
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
  ["reportArchive", "shule_report_archive", reportArchiveRow],
  ["studentDocuments", "shule_student_documents", studentDocumentRow],
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
    if (!ALLOW_JSON_FALLBACK) {
      throw new Error(`Database version ${version || "missing"} is not compatible with application version ${DATA_VERSION}. Run the release migration.`);
    }
    const seeded = seedData();
    await writeSupabaseDb(seeded);
    lastTableCounts = coreTableCounts(seeded);
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
  db.movements = metaRows[0]?.data?.movements || fallback.movements;
  db.nextTerm = metaRows[0]?.data?.nextTerm || fallback.nextTerm;
  db.assessmentWorkflows = metaRows[0]?.data?.assessmentWorkflows || [];

  for (const [prop, table] of COLLECTIONS) {
    const rows = await supabaseGetTable(table, "select=data");
    db[prop] = rows.map((row) => row.data);
  }
  lastTableCounts = coreTableCounts(db);
  if (needsDemoSeed(db)) {
    if (!ALLOW_JSON_FALLBACK) {
      throw new Error("Required Supabase setup tables are empty. Seed or import the school before opening production.");
    }
    const seeded = seedData();
    seeded.audit.push(audit("System", "Reseeded Supabase demo data", "-", "Core Shule tables were empty"));
    await writeSupabaseDb(seeded);
    lastTableCounts = coreTableCounts(seeded);
    return seeded;
  }
  return db;
}

async function writeSupabaseDb(db) {
  await replaceTable("shule_app_settings", "key", [
    { key: "version", data: { version: DATA_VERSION }, updated_at: new Date().toISOString() },
    { key: "meta", data: {
      comments: db.comments || {},
      activities: db.activities || [],
      movements: db.movements || [],
      nextTerm: db.nextTerm || {},
      assessmentWorkflows: db.assessmentWorkflows || []
    }, updated_at: new Date().toISOString() }
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

async function supabaseGetTable(table, query) {
  try {
    return await supabaseGet(table, query);
  } catch (error) {
    console.error(`Supabase table fetch failed for ${table}: ${sanitizeStorageError(error.message)}`);
    throw error;
  }
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

async function supabaseStorageRequest(pathname, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/${pathname}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {})
    },
    body: options.body
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase Storage ${response.status}: ${text || response.statusText}`);
  return text ? JSON.parse(text) : {};
}

async function storePrivateDataUrl(dataUrl, basePath) {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image payload");
  const mimeType = match[1];
  const extension = mimeType.split("/")[1]?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const fileName = `${basePath}.${extension}`;
  const body = Buffer.from(match[2], "base64");
  await supabaseStorageRequest(`object/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${fileName}`, {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "3600",
      "x-upsert": "true"
    },
    body
  });
  return { ref: `storage:${SUPABASE_STORAGE_BUCKET}/${fileName}`, fileName };
}

async function signedStorageUrl(ref, expiresIn = 600) {
  if (!isStorageRef(ref)) throw new Error("Invalid private file reference");
  const { bucket, objectPath } = parseStorageRef(ref);
  const payload = await supabaseStorageRequest(`object/sign/${encodeURIComponent(bucket)}/${objectPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn })
  });
  return payload.signedURL?.startsWith("http")
    ? payload.signedURL
    : `${SUPABASE_URL}/storage/v1${payload.signedURL}`;
}

function isStorageRef(value) {
  return String(value || "").startsWith("storage:");
}

function parseStorageRef(ref) {
  const raw = String(ref || "").replace(/^storage:/, "");
  const slash = raw.indexOf("/");
  if (slash < 1) throw new Error("Invalid private file reference");
  return { bucket: raw.slice(0, slash), objectPath: raw.slice(slash + 1) };
}

function publicAssetRef(value) {
  if (!value) return "";
  return isStorageRef(value) ? `/api/files?ref=${encodeURIComponent(value)}` : value;
}

function readSupabaseKey() {
  const directKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
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

function supabaseKeyType(key) {
  if (!key) return "missing";
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "publishable";
  if (key.startsWith("eyJ")) return "legacy-jwt";
  return "unknown";
}

function sanitizeStorageError(message) {
  return String(message || "Unknown storage error")
    .replace(/eyJ[A-Za-z0-9._-]+/g, "[redacted-jwt]")
    .replace(/sb_(secret|publishable)_[A-Za-z0-9._-]+/g, "sb_$1_[redacted]");
}

function normalizeDb(db) {
  const defaults = seedData();
  db.school = { ...defaults.school, ...(db.school || {}) };
  db.comments = { ...defaults.comments, ...(db.comments || {}) };
  db.activities = Array.isArray(db.activities) ? db.activities : defaults.activities;
  db.movements = Array.isArray(db.movements) ? db.movements : [];
  db.nextTerm = { ...defaults.nextTerm, ...(db.nextTerm || {}) };
  db.assessmentWorkflows = Array.isArray(db.assessmentWorkflows) ? db.assessmentWorkflows : [];
  db.audit = Array.isArray(db.audit) ? db.audit : [];
  db.promotionHistory = Array.isArray(db.promotionHistory) ? db.promotionHistory : [];
  db.reportArchive = Array.isArray(db.reportArchive) ? db.reportArchive : [];
  db.studentDocuments = Array.isArray(db.studentDocuments) ? db.studentDocuments : [];
  db.students = (db.students || []).map((student, index) => {
    const attendance = Math.max(0, Math.min(100, Number(student.attendance || 0)));
    const generatedComments = {
      classTeacher: index % 2 ? "Works well with others and is becoming more confident in class." : "Has shown steady effort and should maintain a consistent revision routine.",
      dos: index % 3 ? "Academic progress is satisfactory; continue strengthening the lower-scoring subjects." : "A strong term overall. The learner should keep extending their independent study habits.",
      headTeacher: index % 2 ? "Good progress. Continued partnership between home and school is encouraged." : "A commendable effort this term. Keep aiming higher."
    };
    return {
      ...student,
      alternativeContact: student.alternativeContact || "",
      attendanceDays: student.attendanceDays || {
        present: Math.round(attendance * 0.6),
        absent: Math.round((100 - attendance) * 0.6),
        total: 60
      },
      activities: Array.isArray(student.activities) ? student.activities : [],
      reportComments: {
        ...generatedComments,
        ...(student.reportComments || {})
      },
      competencies: { Respect: 3, ...(student.competencies || {}) }
    };
  });
  return db;
}

function needsDemoSeed(db) {
  return !db.students?.length ||
    !db.subjects?.length ||
    !db.classes?.length ||
    !db.streams?.length ||
    !db.teachers?.length ||
    !db.gradingScale?.length;
}

function coreTableCounts(db) {
  return {
    schools: db.school ? 1 : 0,
    academicYears: db.academicYears?.length || 0,
    terms: db.terms?.length || 0,
    classes: db.classes?.length || 0,
    streams: db.streams?.length || 0,
    students: db.students?.length || 0,
    subjects: db.subjects?.length || 0,
    teachers: db.teachers?.length || 0,
    teacherAssignments: db.teacherAssignments?.length || 0,
    gradingScales: db.gradingScale?.length || 0,
    assessments: db.examTypes?.length || 0,
    marks: db.marks?.length || 0
  };
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

function reportArchiveRow(item, index) {
  const id = item.id || `report-${index}`;
  return {
    id,
    student_id: item.studentId || "",
    academic_year: item.academicYear || "",
    term: item.term || "",
    exam_type: item.examType || "",
    verification_code: item.verificationCode || "",
    issued_at: item.issuedAt || new Date().toISOString(),
    issued_by: item.issuedBy || "",
    data: { ...item, id }
  };
}

function studentDocumentRow(item, index) {
  const id = item.id || `document-${index}`;
  return {
    id,
    student_id: item.studentId || "",
    document_type: item.documentType || "Document",
    file_url: item.fileUrl || "",
    file_name: item.fileName || "",
    uploaded_by: item.uploadedBy || "",
    data: { ...item, id },
    created_at: item.createdAt || new Date().toISOString()
  };
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
  assessmentWorkflowFor,
  addMovement,
  audit,
  calculateResults,
  loadDb,
  readDb,
  addStudent,
  ensureTeacher,
  importStudents,
  archiveReports,
  saveDeadline,
  saveTeacherAssignment,
  saveDb,
  sendError,
  sendJson,
  storageMode,
  storageStatus,
  listAudit,
  listMarks,
  listReportArchive,
  listStudents,
  isDuplicateMark,
  publicAssetRef,
  secureStudentPhoto,
  signedStorageUrl,
  transitionAssessmentWorkflow,
  updateSettings,
  updateStudentDetails,
  updateStudentPhoto,
  upsertMark,
  validateMarks,
  verifiedReport,
  rollbackPromotion,
  writeDb
};
