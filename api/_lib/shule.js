const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.SHULE_DB_PATH || path.join("/tmp", "shule-db.json");

function seedData() {
  return {
    school: {
      name: "Shule Demo School",
      academicYear: "2026",
      term: "Term 1",
      exam: "End of Term"
    },
    classes: [
      { id: "p1", name: "Primary 1", stream: "Blue" }
    ],
    subjects: [
      { id: "eng", code: "ENG", name: "English", maxScore: 100 },
      { id: "math", code: "MATH", name: "Mathematics", maxScore: 100 },
      { id: "sci", code: "SCI", name: "Science", maxScore: 100 },
      { id: "sst", code: "SST", name: "Social Studies", maxScore: 100 }
    ],
    teachers: [
      { id: "t1", name: "Teacher A", subjectIds: ["eng", "math"] },
      { id: "t2", name: "Teacher B", subjectIds: ["sci", "sst"] }
    ],
    students: [
      { id: "s001", admissionNo: "001", name: "Amina Kato", classId: "p1", gender: "F" },
      { id: "s002", admissionNo: "002", name: "Brian Okello", classId: "p1", gender: "M" },
      { id: "s003", admissionNo: "003", name: "Claire Nambi", classId: "p1", gender: "F" },
      { id: "s004", admissionNo: "004", name: "Daniel Ssebuggwawo", classId: "p1", gender: "M" }
    ],
    marks: [
      { studentId: "s001", subjectId: "eng", score: 82 },
      { studentId: "s001", subjectId: "math", score: 76 },
      { studentId: "s001", subjectId: "sci", score: 71 },
      { studentId: "s001", subjectId: "sst", score: 88 },
      { studentId: "s002", subjectId: "eng", score: 68 },
      { studentId: "s002", subjectId: "math", score: 91 },
      { studentId: "s002", subjectId: "sci", score: 64 },
      { studentId: "s002", subjectId: "sst", score: 75 },
      { studentId: "s003", subjectId: "eng", score: 90 },
      { studentId: "s003", subjectId: "math", score: 84 },
      { studentId: "s003", subjectId: "sci", score: 86 },
      { studentId: "s003", subjectId: "sst", score: 79 },
      { studentId: "s004", subjectId: "eng", score: 55 },
      { studentId: "s004", subjectId: "math", score: 61 },
      { studentId: "s004", subjectId: "sci", score: 58 },
      { studentId: "s004", subjectId: "sst", score: 62 }
    ],
    gradingScale: [
      { grade: "D1", min: 80, remark: "Excellent" },
      { grade: "D2", min: 75, remark: "Very good" },
      { grade: "C3", min: 70, remark: "Good" },
      { grade: "C4", min: 65, remark: "Fairly good" },
      { grade: "C5", min: 60, remark: "Credit" },
      { grade: "C6", min: 55, remark: "Credit" },
      { grade: "P7", min: 45, remark: "Pass" },
      { grade: "P8", min: 35, remark: "Weak pass" },
      { grade: "F9", min: 0, remark: "Fail" }
    ],
    audit: []
  };
}

function ensureDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
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
  const ordered = [...scale].sort((a, b) => b.min - a.min);
  return ordered.find((row) => Number(score) >= Number(row.min)) || ordered[ordered.length - 1];
}

function calculateResults(db) {
  const marksByStudent = new Map();
  for (const mark of db.marks) {
    if (!marksByStudent.has(mark.studentId)) marksByStudent.set(mark.studentId, new Map());
    marksByStudent.get(mark.studentId).set(mark.subjectId, Number(mark.score));
  }

  const subjectStats = db.subjects.map((subject) => {
    const scores = db.marks
      .filter((mark) => mark.subjectId === subject.id)
      .map((mark) => Number(mark.score));
    const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      entries: scores.length,
      average: round(average),
      highest: scores.length ? Math.max(...scores) : 0,
      lowest: scores.length ? Math.min(...scores) : 0
    };
  });

  const students = db.students.map((student) => {
    const studentMarks = marksByStudent.get(student.id) || new Map();
    const subjectResults = db.subjects.map((subject) => {
      const score = studentMarks.has(subject.id) ? Number(studentMarks.get(subject.id)) : null;
      const grade = score === null ? { grade: "-", remark: "Missing" } : gradeFor(score, db.gradingScale);
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        score,
        grade: grade.grade,
        remark: grade.remark
      };
    });
    const completed = subjectResults.filter((item) => item.score !== null);
    const total = completed.reduce((sum, item) => sum + item.score, 0);
    const average = completed.length ? total / completed.length : 0;
    const overallGrade = completed.length ? gradeFor(average, db.gradingScale).grade : "-";
    return {
      ...student,
      subjects: subjectResults,
      total,
      average: round(average),
      overallGrade,
      missingSubjects: subjectResults.filter((item) => item.score === null).length
    };
  });

  const ranked = [...students]
    .sort((a, b) => b.total - a.total || b.average - a.average || a.name.localeCompare(b.name))
    .map((student, index) => ({ ...student, position: index + 1 }));

  const classAverage = ranked.length
    ? ranked.reduce((sum, student) => sum + student.average, 0) / ranked.length
    : 0;

  return {
    school: db.school,
    counts: {
      students: db.students.length,
      subjects: db.subjects.length,
      teachers: db.teachers.length,
      marks: db.marks.length
    },
    classAverage: round(classAverage),
    subjectStats,
    students: ranked
  };
}

function round(value) {
  return Math.round(Number(value) * 10) / 10;
}

function upsertMark(db, studentId, subjectId, score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
    throw new Error("Score must be between 0 and 100");
  }
  const existing = db.marks.find((mark) => mark.studentId === studentId && mark.subjectId === subjectId);
  if (existing) {
    existing.score = numericScore;
  } else {
    db.marks.push({ studentId, subjectId, score: numericScore });
  }
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

module.exports = {
  calculateResults,
  readDb,
  sendError,
  sendJson,
  upsertMark,
  writeDb
};
