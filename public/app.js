let db = null;
let results = null;
let selectedReportClassId = null;
let selectedReportStudentId = null;
let reportMode = "student";
let latestUploadErrors = [];

const STATUS_OPTIONS = ["Active", "Graduated", "Transferred", "Suspended", "Expelled", "Dropped Out", "Deceased", "Inactive"];

const els = {
  pageTitle: document.getElementById("pageTitle"),
  schoolMeta: document.getElementById("schoolMeta"),
  heroSchool: document.getElementById("heroSchool"),
  metricStudents: document.getElementById("metricStudents"),
  metricSubjects: document.getElementById("metricSubjects"),
  metricCompletion: document.getElementById("metricCompletion"),
  metricAverage: document.getElementById("metricAverage"),
  rankingBody: document.getElementById("rankingBody"),
  studentForm: document.getElementById("studentForm"),
  studentClassSelect: document.getElementById("studentClassSelect"),
  studentStatusSelect: document.getElementById("studentStatusSelect"),
  studentCountLabel: document.getElementById("studentCountLabel"),
  studentRegisterBody: document.getElementById("studentRegisterBody"),
  marksClassSelect: document.getElementById("marksClassSelect"),
  subjectSelect: document.getElementById("subjectSelect"),
  marksBody: document.getElementById("marksBody"),
  saveMarksBtn: document.getElementById("saveMarksBtn"),
  csvInput: document.getElementById("csvInput"),
  downloadTemplateBtn: document.getElementById("downloadTemplateBtn"),
  uploadSummary: document.getElementById("uploadSummary"),
  uploadErrors: document.getElementById("uploadErrors"),
  metricCompleted: document.getElementById("metricCompleted"),
  metricPending: document.getElementById("metricPending"),
  metricLate: document.getElementById("metricLate"),
  metricErrors: document.getElementById("metricErrors"),
  deadlineGrid: document.getElementById("deadlineGrid"),
  auditBody: document.getElementById("auditBody"),
  subjectBars: document.getElementById("subjectBars"),
  reportModeLabel: document.getElementById("reportModeLabel"),
  reportClassSelect: document.getElementById("reportClassSelect"),
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
  renderClassAndSubjectSelects();
  renderDashboard();
  renderStudents();
  renderMarksEntry();
  renderUploadErrors();
  renderMonitoring();
  renderAnalytics();
  renderReportSelect();
  renderReports();
}

function renderSchoolMeta() {
  els.schoolMeta.textContent = `${db.school.academicYear} | ${db.school.term} | ${db.school.exam}`;
  els.heroSchool.textContent = db.school.name;
}

function renderClassAndSubjectSelects() {
  const classOptions = db.classes.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("");
  els.studentClassSelect.innerHTML = classOptions;
  els.marksClassSelect.innerHTML = classOptions;
  els.subjectSelect.innerHTML = db.subjects.map((subject) => `<option value="${subject.id}">${escapeHtml(subject.code)} - ${escapeHtml(subject.name)}</option>`).join("");
  els.studentStatusSelect.innerHTML = STATUS_OPTIONS.map((status) => `<option>${status}</option>`).join("");
}

function renderDashboard() {
  els.metricStudents.textContent = results.counts.activeStudents;
  els.metricSubjects.textContent = results.counts.subjects;
  els.metricCompletion.textContent = `${results.monitoring.completionRate}%`;
  els.metricAverage.textContent = results.classAverage;
  els.rankingBody.innerHTML = results.students.map((student) => `
    <tr>
      <td>${student.position}</td>
      <td><strong>${escapeHtml(student.name)}</strong><br><span>${escapeHtml(student.admissionNo)}</span></td>
      <td>${escapeHtml(student.className)}</td>
      <td>${escapeHtml(student.stream)}</td>
      <td>${student.total}</td>
      <td>${student.average}</td>
      <td>${student.aggregate}</td>
      <td><span class="pill ${promotionClass(student.promotion)}">${student.promotion}</span></td>
    </tr>
  `).join("");
}

function renderStudents() {
  els.studentCountLabel.textContent = `${results.counts.activeStudents} active, ${results.counts.inactiveStudents} historical`;
  els.studentRegisterBody.innerHTML = db.students.map((student) => {
    const classInfo = db.classes.find((item) => item.id === student.classId) || {};
    return `
      <tr>
        <td>${escapeHtml(student.admissionNo)}</td>
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.gender)}</td>
        <td>${escapeHtml(classInfo.name || student.classId)}</td>
        <td><span class="pill ${student.status === "Active" ? "pill-green" : "pill-muted"}">${escapeHtml(student.status)}</span></td>
        <td>${escapeHtml(student.guardian || "-")}</td>
        <td>${escapeHtml(student.contact || "-")}</td>
      </tr>
    `;
  }).join("");
}

function renderMarksEntry() {
  const classId = els.marksClassSelect.value || db.classes[0]?.id;
  const subjectId = els.subjectSelect.value || db.subjects[0]?.id;
  const learners = db.students.filter((student) => student.status === "Active" && student.classId === classId);
  const markMap = new Map(db.marks.filter((mark) => mark.subjectId === subjectId).map((mark) => [mark.studentId, mark]));
  els.marksBody.innerHTML = learners.map((student) => {
    const classInfo = db.classes.find((item) => item.id === student.classId) || {};
    const mark = markMap.get(student.id);
    return `
      <tr>
        <td>${escapeHtml(student.admissionNo)}</td>
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(classInfo.level || "")}</td>
        <td>${escapeHtml(classInfo.stream || "")}</td>
        <td><input class="score-input" type="number" min="0" max="100" data-student-id="${student.id}" value="${mark?.score ?? ""}"></td>
        <td><span class="pill ${mark?.status === "Captured" ? "pill-green" : "pill-orange"}">${mark?.status || "Missing"}</span></td>
      </tr>
    `;
  }).join("");
}

function renderUploadErrors() {
  const errors = latestUploadErrors.length ? latestUploadErrors : results.uploadErrors;
  els.uploadSummary.textContent = errors.length ? `${errors.length} validation issue(s) found` : "No validation errors";
  els.uploadErrors.innerHTML = errors.length
    ? errors.map((error) => `<div class="error-item"><strong>${escapeHtml(error.errorType)}</strong><span>Row ${error.rowNumber || "-"} | ${escapeHtml(error.admissionNo || "-")} | ${escapeHtml(error.errorMessage)}</span></div>`).join("")
    : `<div class="empty-state">CSV rows that fail validation will appear here.</div>`;
}

function renderMonitoring() {
  els.metricCompleted.textContent = results.monitoring.completedUploads;
  els.metricPending.textContent = results.monitoring.pendingUploads;
  els.metricLate.textContent = results.monitoring.lateUploads;
  els.metricErrors.textContent = results.monitoring.validationFailures;
  els.deadlineGrid.innerHTML = results.deadlines.map((deadline) => `
    <article class="deadline-card ${deadline.status}">
      <strong>${escapeHtml(deadline.subjectName)}</strong>
      <span>${escapeHtml(deadline.className)}</span>
      <small>${formatDate(deadline.dueAt)}</small>
      <em>${escapeHtml(deadline.status)}</em>
    </article>
  `).join("");
  els.auditBody.innerHTML = results.audit.map((audit) => `
    <tr><td>${escapeHtml(audit.user)}</td><td>${escapeHtml(audit.action)}</td><td>${formatDate(audit.timestamp)}</td><td>${escapeHtml(audit.newValue)}</td></tr>
  `).join("");
}

function renderAnalytics() {
  const maxAverage = Math.max(...results.subjectStats.map((subject) => subject.average), 100);
  els.subjectBars.innerHTML = results.subjectStats.map((subject) => `
    <div class="bar-row">
      <div><strong>${escapeHtml(subject.subjectName)}</strong><span>${subject.entries} entries | High ${subject.highest} | Low ${subject.lowest}</span></div>
      <div class="bar-track"><span style="width:${Math.max(4, (subject.average / maxAverage) * 100)}%"></span></div>
      <strong>${subject.average}</strong>
    </div>
  `).join("");
}

function renderReportSelect() {
  const classes = reportClassesWithCounts();
  const firstClassWithLearners = classes.find((item) => item.count > 0) || classes[0];
  if (!selectedReportClassId || !classes.some((item) => item.id === selectedReportClassId)) {
    selectedReportClassId = firstClassWithLearners?.id || "";
  }

  els.reportClassSelect.innerHTML = classes.map((item) => `
    <option value="${item.id}" ${item.count ? "" : "disabled"}>
      ${escapeHtml(item.name)} (${item.count} learner${item.count === 1 ? "" : "s"})
    </option>
  `).join("");
  els.reportClassSelect.value = selectedReportClassId;

  const classStudents = selectedReportClassStudents();
  if (!classStudents.some((student) => student.id === selectedReportStudentId)) {
    selectedReportStudentId = classStudents[0]?.id || null;
  }

  els.reportStudentSelect.innerHTML = classStudents.length
    ? classStudents.map((student) => `<option value="${student.id}">${student.classPosition}. ${escapeHtml(student.name)} (${escapeHtml(student.admissionNo)})</option>`).join("")
    : `<option value="">No active learners in this class</option>`;
  if (selectedReportStudentId) els.reportStudentSelect.value = selectedReportStudentId;

  const disabled = classStudents.length === 0;
  els.reportStudentSelect.disabled = disabled;
  els.viewStudentReportBtn.disabled = disabled;
  els.printStudentReportBtn.disabled = disabled;
  els.printClassReportsBtn.disabled = disabled;
}

function renderReports() {
  const classStudents = selectedReportClassStudents();
  const classInfo = db.classes.find((item) => item.id === selectedReportClassId);
  const className = classInfo?.name || "Selected class";
  const students = reportMode === "class"
    ? classStudents
    : classStudents.filter((student) => student.id === selectedReportStudentId);

  els.reportModeLabel.textContent = reportMode === "class"
    ? `${className} reports: one learner per printed packet`
    : `Individual report preview: ${className}`;
  els.reportCards.innerHTML = students.length
    ? students.map(renderReportPacket).join("")
    : `<div class="empty-state">Select a class with active learners to preview and print reports.</div>`;
}

function reportClassesWithCounts() {
  return db.classes.map((classInfo) => ({
    ...classInfo,
    count: results.students.filter((student) => student.classId === classInfo.id).length
  }));
}

function selectedReportClassStudents() {
  return results.students
    .filter((student) => student.classId === selectedReportClassId)
    .sort((a, b) => a.classPosition - b.classPosition || a.name.localeCompare(b.name));
}

function renderReportPacket(student) {
  return `
    <article class="report-packet">
      ${renderReportPageOne(student)}
      ${renderReportPageTwo(student)}
      ${renderReportPageThree(student)}
    </article>
  `;
}

function renderReportPageOne(student) {
  return `
    <section class="report-page page-one">
      <div class="watermark">MJA</div>
      <header class="report-header">
        <div class="logo-box">MJA</div>
        <div>
          <h2>${escapeHtml(results.school.name)}</h2>
          <p>${escapeHtml(results.school.motto)}</p>
          <small>${escapeHtml(results.school.address)} | ${escapeHtml(results.school.phone)} | ${escapeHtml(results.school.email)}</small>
        </div>
        <div class="qr-box">QR<br>${escapeHtml(student.verificationCode.slice(-6))}</div>
      </header>
      <div class="report-title">Learner Academic Report</div>
      <section class="student-strip">
        <div class="photo-box">Photo</div>
        <div><span>Admission No.</span><strong>${escapeHtml(student.admissionNo)}</strong></div>
        <div><span>Name</span><strong>${escapeHtml(student.name)}</strong></div>
        <div><span>Class</span><strong>${escapeHtml(student.className)} ${escapeHtml(student.stream)}</strong></div>
        <div><span>Attendance</span><strong>${student.attendance}%</strong></div>
        <div><span>Status</span><strong>${escapeHtml(student.status)}</strong></div>
      </section>
      <table class="report-table">
        <thead><tr><th>Subject</th><th>BOT</th><th>Mid</th><th>End</th><th>Final</th><th>Grade</th><th>Agg.</th><th>Comment</th></tr></thead>
        <tbody>${student.subjects.map((subject) => `<tr><td>${escapeHtml(subject.subjectName)}</td><td>${valueOrDash(subject.bot)}</td><td>${valueOrDash(subject.mid)}</td><td>${valueOrDash(subject.end)}</td><td>${valueOrDash(subject.score)}</td><td>${subject.grade}</td><td>${valueOrDash(subject.aggregate)}</td><td>${escapeHtml(subject.comment)}</td></tr>`).join("")}</tbody>
      </table>
      <section class="kpi-strip">
        <div><span>Total Marks</span><strong>${student.total}</strong></div>
        <div><span>Average</span><strong>${student.average}</strong></div>
        <div><span>Grade</span><strong>${student.overallGrade}</strong></div>
        <div><span>Aggregate</span><strong>${student.aggregate}</strong></div>
        <div><span>Stream Pos.</span><strong>${student.streamPosition}</strong></div>
        <div><span>Class Pos.</span><strong>${student.classPosition}</strong></div>
      </section>
      <div class="promotion-banner ${promotionClass(student.promotion)}">${student.promotion}</div>
      ${reportFooter(student)}
    </section>
  `;
}

function renderReportPageTwo(student) {
  return `
    <section class="report-page">
      <div class="report-subhead"><h2>Analytics & Competency Profile</h2><span>${escapeHtml(student.name)}</span></div>
      <div class="analytics-grid">
        <div class="chart-card"><h3>Subject Performance</h3>${student.subjects.slice(0, 8).map((subject) => `<div class="mini-bar"><span>${escapeHtml(subject.code)}</span><b style="width:${subject.score || 8}%"></b><em>${valueOrDash(subject.score)}</em></div>`).join("")}</div>
        <div class="chart-card"><h3>Term Trend</h3><div class="trend-line"><span style="height:45%"></span><span style="height:62%"></span><span style="height:${Math.max(10, student.average)}%"></span></div><p>Beginning, mid, and end term trend indicator.</p></div>
        <div class="chart-card"><h3>Attendance Analytics</h3><div class="donut" style="--value:${student.attendance}">${student.attendance}%</div></div>
        <div class="chart-card"><h3>Competency Ratings</h3>${Object.entries(student.competencies).map(([label, value]) => `<div class="rating-row"><span>${escapeHtml(label)}</span><strong>${"●".repeat(value)}${"○".repeat(5 - value)}</strong></div>`).join("")}</div>
      </div>
      ${reportFooter(student)}
    </section>
  `;
}

function renderReportPageThree(student) {
  return `
    <section class="report-page">
      <div class="report-subhead"><h2>Comments, Activities & Verification</h2><span>${escapeHtml(student.verificationCode)}</span></div>
      <div class="comment-grid">
        <div><h3>Class Teacher Comment</h3><p>${escapeHtml(db.comments.teacher)}</p></div>
        <div><h3>Head Teacher Comment</h3><p>${escapeHtml(db.comments.headteacher)}</p></div>
        <div><h3>Co-Curricular Activities</h3><p>${escapeHtml(db.activities.join(", "))}</p></div>
        <div><h3>Student Conduct</h3><p>${escapeHtml(student.conduct)}</p></div>
      </div>
      <section class="signature-grid">
        <div>Class Teacher Signature</div>
        <div>Head Teacher Signature</div>
        <div>Parent Signature</div>
        <div>School Stamp</div>
      </section>
      <div class="acknowledgement">This report can be verified online using the QR Code. Parent acknowledgement confirms the report has been received and discussed with the learner.</div>
      ${reportFooter(student)}
    </section>
  `;
}

function reportFooter(student) {
  return `<footer class="report-footer"><span>Generated By: Shule Results Management System</span><span>Generated Date: ${new Date().toLocaleDateString()}</span><span>Verification Code: ${escapeHtml(student.verificationCode)}</span></footer>`;
}

async function saveMarks() {
  const subjectId = els.subjectSelect.value;
  const marks = [...document.querySelectorAll(".score-input")]
    .filter((input) => input.value !== "")
    .map((input) => ({ studentId: input.dataset.studentId, subjectId, score: Number(input.value), status: "Captured" }));
  await api("/api/marks", { method: "POST", body: JSON.stringify({ marks }) });
  toast(`Saved ${marks.length} mark entries`);
  await loadData();
}

function downloadCsvTemplate() {
  const classId = els.marksClassSelect.value;
  const subject = db.subjects.find((item) => item.id === els.subjectSelect.value);
  const classInfo = db.classes.find((item) => item.id === classId);
  const learners = db.students.filter((student) => student.status === "Active" && student.classId === classId);
  const lines = ["Admission Number,Student Name,Class,Stream,Subject,Mark,Remarks"];
  for (const student of learners) lines.push(`${csvCell(student.admissionNo)},${csvCell(student.name)},${classInfo.level},${classInfo.stream},${csvCell(subject.name)},,`);
  downloadText(`${subject.code}_${classInfo.name}_marks_template.csv`, lines.join("\n"));
}

async function importCsv(file) {
  const text = await file.text();
  const rows = parseCsv(text);
  const errors = [];
  const classId = els.marksClassSelect.value;
  const subjectId = els.subjectSelect.value;
  const classInfo = db.classes.find((item) => item.id === classId);
  const subject = db.subjects.find((item) => item.id === subjectId);
  const seen = new Set();
  const marks = [];
  rows.slice(1).forEach((row, index) => {
    const admissionNo = String(row[0] || "").trim();
    const markValue = String(row[5] || "").trim();
    const student = db.students.find((item) => item.admissionNo === admissionNo);
    const rowNumber = index + 2;
    if (!student) return errors.push(errorRow(rowNumber, admissionNo, "Missing Student", "Admission number does not exist"));
    if (student.classId !== classId) return errors.push(errorRow(rowNumber, admissionNo, "Wrong Class", `Learner is not in ${classInfo.name}`));
    if (seen.has(admissionNo)) return errors.push(errorRow(rowNumber, admissionNo, "Duplicate Mark", "This learner appears twice in the file"));
    if (markValue === "") return errors.push(errorRow(rowNumber, admissionNo, "Missing Mark", "Mark is required"));
    const score = Number(markValue);
    if (!Number.isFinite(score)) return errors.push(errorRow(rowNumber, admissionNo, "Invalid Mark", "Mark must be numeric"));
    if (score > 100) return errors.push(errorRow(rowNumber, admissionNo, "Mark Above 100", "Mark cannot exceed 100"));
    if (score < 0) return errors.push(errorRow(rowNumber, admissionNo, "Mark Below 0", "Mark cannot be below 0"));
    seen.add(admissionNo);
    marks.push({ studentId: student.id, subjectId, score, status: "Captured" });
  });
  latestUploadErrors = errors;
  renderUploadErrors();
  if (errors.length) {
    toast(`${errors.length} upload error(s) found`);
    return;
  }
  await api("/api/marks", { method: "POST", body: JSON.stringify({ marks, subjectName: subject.name }) });
  toast(`Imported ${marks.length} marks`);
  els.csvInput.value = "";
  await loadData();
}

function errorRow(rowNumber, admissionNo, errorType, errorMessage) {
  return { rowNumber, admissionNo, errorType, errorMessage, timestamp: new Date().toISOString() };
}

function viewStudentReport() {
  selectedReportStudentId = els.reportStudentSelect.value;
  reportMode = "student";
  renderReports();
}

function printStudentReport() {
  if (!selectedReportClassStudents().length) return toast("Select a class with learners first");
  viewStudentReport();
  document.body.classList.remove("print-class");
  document.body.classList.add("print-student");
  window.print();
}

function printClassReports() {
  if (!selectedReportClassStudents().length) return toast("Select a class with learners first");
  reportMode = "class";
  renderReports();
  document.body.classList.remove("print-student");
  document.body.classList.add("print-class");
  window.print();
}

function parseCsv(text) {
  return text.trim().split(/\r?\n/).filter(Boolean).map((line) => {
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

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replaceAll(" ", "_");
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function valueOrDash(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function promotionClass(value) {
  if (value === "PROMOTED") return "pill-green";
  if (value === "REPEAT") return "pill-red";
  return "pill-orange";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value ?? "")
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

els.studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(els.studentForm).entries());
  await api("/api/students", { method: "POST", body: JSON.stringify(body) });
  els.studentForm.reset();
  toast("Student added");
  await loadData();
});

els.marksClassSelect.addEventListener("change", renderMarksEntry);
els.subjectSelect.addEventListener("change", renderMarksEntry);
els.saveMarksBtn.addEventListener("click", saveMarks);
els.downloadTemplateBtn.addEventListener("click", downloadCsvTemplate);
els.csvInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) importCsv(file).catch((error) => toast(error.message));
});
document.getElementById("refreshBtn").addEventListener("click", loadData);
document.getElementById("printBtn").addEventListener("click", () => {
  document.querySelector('[data-view="reports"]').click();
  printClassReports();
});
els.reportStudentSelect.addEventListener("change", viewStudentReport);
els.reportClassSelect.addEventListener("change", () => {
  selectedReportClassId = els.reportClassSelect.value;
  selectedReportStudentId = null;
  reportMode = "student";
  renderReportSelect();
  renderReports();
});
els.viewStudentReportBtn.addEventListener("click", viewStudentReport);
els.printStudentReportBtn.addEventListener("click", printStudentReport);
els.printClassReportsBtn.addEventListener("click", printClassReports);
window.addEventListener("afterprint", () => {
  document.body.classList.remove("print-class", "print-student");
  reportMode = "student";
  renderReports();
});

loadData().catch((error) => toast(error.message));
