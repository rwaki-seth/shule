let db = null;
let results = null;
let selectedReportStudentId = null;
let reportMode = "student";

const els = {
  pageTitle: document.getElementById("pageTitle"),
  schoolMeta: document.getElementById("schoolMeta"),
  metricStudents: document.getElementById("metricStudents"),
  metricSubjects: document.getElementById("metricSubjects"),
  metricMarks: document.getElementById("metricMarks"),
  metricAverage: document.getElementById("metricAverage"),
  rankingBody: document.getElementById("rankingBody"),
  subjectStatsBody: document.getElementById("subjectStatsBody"),
  schoolForm: document.getElementById("schoolForm"),
  studentForm: document.getElementById("studentForm"),
  studentList: document.getElementById("studentList"),
  subjectSelect: document.getElementById("subjectSelect"),
  marksBody: document.getElementById("marksBody"),
  saveMarksBtn: document.getElementById("saveMarksBtn"),
  csvInput: document.getElementById("csvInput"),
  downloadTemplateBtn: document.getElementById("downloadTemplateBtn"),
  reportModeLabel: document.getElementById("reportModeLabel"),
  reportStudentSelect: document.getElementById("reportStudentSelect"),
  viewStudentReportBtn: document.getElementById("viewStudentReportBtn"),
  printStudentReportBtn: document.getElementById("printStudentReportBtn"),
  printClassReportsBtn: document.getElementById("printClassReportsBtn"),
  reportCards: document.getElementById("reportCards"),
  toast: document.getElementById("toast")
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

async function loadData() {
  db = await api("/api/bootstrap");
  results = await api("/api/results");
  renderAll();
}

function renderAll() {
  renderSchoolMeta();
  renderDashboard();
  renderSetup();
  renderSubjectSelect();
  renderMarksEntry();
  renderReportSelect();
  renderReports();
}

function renderSchoolMeta() {
  els.schoolMeta.textContent = `${db.school.name} | ${db.school.academicYear} | ${db.school.term} | ${db.school.exam}`;
  for (const [key, value] of Object.entries(db.school)) {
    const input = els.schoolForm.elements[key];
    if (input) input.value = value || "";
  }
}

function renderDashboard() {
  els.metricStudents.textContent = results.counts.students;
  els.metricSubjects.textContent = results.counts.subjects;
  els.metricMarks.textContent = results.counts.marks;
  els.metricAverage.textContent = results.classAverage;

  els.rankingBody.innerHTML = results.students.map((student) => `
    <tr>
      <td>${student.position}</td>
      <td>${escapeHtml(student.name)}</td>
      <td>${escapeHtml(student.admissionNo)}</td>
      <td>${student.total}</td>
      <td>${student.average}</td>
      <td>${student.overallGrade}</td>
      <td>${student.missingSubjects}</td>
    </tr>
  `).join("");

  els.subjectStatsBody.innerHTML = results.subjectStats.map((subject) => `
    <tr>
      <td>${escapeHtml(subject.subjectName)}</td>
      <td>${subject.entries}</td>
      <td>${subject.average}</td>
      <td>${subject.highest}</td>
      <td>${subject.lowest}</td>
    </tr>
  `).join("");
}

function renderSetup() {
  els.studentList.innerHTML = db.students.map((student) => `
    <span class="chip">${escapeHtml(student.admissionNo)} - ${escapeHtml(student.name)}</span>
  `).join("");
}

function renderSubjectSelect() {
  const current = els.subjectSelect.value || db.subjects[0]?.id;
  els.subjectSelect.innerHTML = db.subjects.map((subject) => `
    <option value="${subject.id}">${escapeHtml(subject.code)} - ${escapeHtml(subject.name)}</option>
  `).join("");
  if (current) els.subjectSelect.value = current;
}

function renderMarksEntry() {
  const subjectId = els.subjectSelect.value || db.subjects[0]?.id;
  const markMap = new Map(db.marks
    .filter((mark) => mark.subjectId === subjectId)
    .map((mark) => [mark.studentId, mark.score]));

  els.marksBody.innerHTML = db.students.map((student) => {
    const value = markMap.has(student.id) ? markMap.get(student.id) : "";
    const status = value === "" ? "Missing" : "Captured";
    const statusClass = value === "" ? "status-missing" : "status-ok";
    return `
      <tr>
        <td>${escapeHtml(student.admissionNo)}</td>
        <td>${escapeHtml(student.name)}</td>
        <td><input class="score-input" type="number" min="0" max="100" data-student-id="${student.id}" value="${value}"></td>
        <td class="${statusClass}">${status}</td>
      </tr>
    `;
  }).join("");
}

function renderReportSelect() {
  if (!selectedReportStudentId && results.students.length) {
    selectedReportStudentId = results.students[0].id;
  }
  els.reportStudentSelect.innerHTML = results.students.map((student) => `
    <option value="${student.id}">${student.position}. ${escapeHtml(student.name)} (${escapeHtml(student.admissionNo)})</option>
  `).join("");
  if (selectedReportStudentId) els.reportStudentSelect.value = selectedReportStudentId;
}

function renderReports() {
  const students = reportMode === "class"
    ? results.students
    : results.students.filter((student) => student.id === selectedReportStudentId);
  els.reportModeLabel.textContent = reportMode === "class"
    ? "Class reports: one student per printed page"
    : "Individual report preview";
  els.reportCards.classList.toggle("single-report", reportMode !== "class");
  els.reportCards.innerHTML = students.map((student) => `
    <article class="report-card">
      <div class="report-head">
        <h2>${escapeHtml(results.school.name)}</h2>
        <p>${escapeHtml(results.school.academicYear)} | ${escapeHtml(results.school.term)} | ${escapeHtml(results.school.exam)}</p>
      </div>
      <h3>${escapeHtml(student.name)}</h3>
      <div class="report-meta">
        <span>Adm No: ${escapeHtml(student.admissionNo)}</span>
        <span>Position: ${student.position}</span>
        <span>Total: ${student.total}</span>
        <span>Average: ${student.average}</span>
      </div>
      <table>
        <thead>
          <tr><th>Subject</th><th>Score</th><th>Grade</th><th>Remark</th></tr>
        </thead>
        <tbody>
          ${student.subjects.map((subject) => `
            <tr>
              <td>${escapeHtml(subject.subjectName)}</td>
              <td>${subject.score === null ? "-" : subject.score}</td>
              <td>${subject.grade}</td>
              <td>${escapeHtml(subject.remark)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </article>
  `).join("");
}

function showReportsView() {
  document.querySelector('[data-view="reports"]').click();
}

function viewStudentReport() {
  selectedReportStudentId = els.reportStudentSelect.value;
  reportMode = "student";
  renderReports();
}

function printStudentReport() {
  viewStudentReport();
  document.body.classList.remove("print-class");
  document.body.classList.add("print-student");
  window.print();
}

function printClassReports() {
  reportMode = "class";
  renderReports();
  document.body.classList.remove("print-student");
  document.body.classList.add("print-class");
  window.print();
}

async function saveMarks() {
  const subjectId = els.subjectSelect.value;
  const marks = [...document.querySelectorAll(".score-input")]
    .filter((input) => input.value !== "")
    .map((input) => ({
      studentId: input.dataset.studentId,
      subjectId,
      score: Number(input.value)
    }));
  await api("/api/marks", { method: "POST", body: JSON.stringify({ marks }) });
  toast(`Saved ${marks.length} mark entries`);
  await loadData();
}

function downloadCsvTemplate() {
  const subject = db.subjects.find((item) => item.id === els.subjectSelect.value);
  const lines = ["admissionNo,name,score"];
  for (const student of db.students) {
    lines.push(`${csvCell(student.admissionNo)},${csvCell(student.name)},`);
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${subject.code}_marks_template.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importCsv(file) {
  const text = await file.text();
  const rows = parseCsv(text);
  const subjectId = els.subjectSelect.value;
  const byAdmission = new Map(db.students.map((student) => [student.admissionNo, student]));
  const marks = rows.slice(1).map((row) => {
    const student = byAdmission.get(String(row[0] || "").trim());
    if (!student) return null;
    return { studentId: student.id, subjectId, score: Number(row[2]) };
  }).filter((mark) => mark && Number.isFinite(mark.score));

  if (!marks.length) {
    toast("No valid marks found in CSV");
    return;
  }
  await api("/api/marks", { method: "POST", body: JSON.stringify({ marks }) });
  toast(`Imported ${marks.length} marks`);
  els.csvInput.value = "";
  await loadData();
}

function parseCsv(text) {
  return text.trim().split(/\r?\n/).map((line) => {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  });
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-button").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.view).classList.add("active");
    els.pageTitle.textContent = button.textContent;
  });
});

els.schoolForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(els.schoolForm).entries());
  await api("/api/school", { method: "POST", body: JSON.stringify(body) });
  toast("School profile saved");
  await loadData();
});

els.studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(els.studentForm).entries());
  body.classId = db.classes[0]?.id || "p1";
  await api("/api/students", { method: "POST", body: JSON.stringify(body) });
  els.studentForm.reset();
  toast("Student added");
  await loadData();
});

els.subjectSelect.addEventListener("change", renderMarksEntry);
els.saveMarksBtn.addEventListener("click", saveMarks);
els.downloadTemplateBtn.addEventListener("click", downloadCsvTemplate);
els.csvInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) importCsv(file).catch((error) => toast(error.message));
});
document.getElementById("refreshBtn").addEventListener("click", loadData);
document.getElementById("printBtn").addEventListener("click", () => {
  showReportsView();
  printClassReports();
});
els.reportStudentSelect.addEventListener("change", viewStudentReport);
els.viewStudentReportBtn.addEventListener("click", viewStudentReport);
els.printStudentReportBtn.addEventListener("click", printStudentReport);
els.printClassReportsBtn.addEventListener("click", printClassReports);
window.addEventListener("afterprint", () => {
  document.body.classList.remove("print-class", "print-student");
  reportMode = "student";
  renderReports();
});

loadData().catch((error) => toast(error.message));
