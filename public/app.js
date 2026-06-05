let db = null;
let results = null;
let selectedReportClassId = null;
let selectedReportStudentId = null;
let reportMode = "student";
let latestUploadErrors = [];
let connectionStatus = { configured: false, mode: "checking", lastError: "" };

const STATUS_OPTIONS = ["Active", "Graduated", "Transferred", "Suspended", "Expelled", "Dropped Out", "Deceased", "Inactive"];

const els = {
  pageTitle: document.getElementById("pageTitle"),
  schoolMeta: document.getElementById("schoolMeta"),
  heroSchool: document.getElementById("heroSchool"),
  metricStudents: document.getElementById("metricStudents"),
  metricSubjects: document.getElementById("metricSubjects"),
  metricCompletion: document.getElementById("metricCompletion"),
  metricAverage: document.getElementById("metricAverage"),
  connectionPanel: document.getElementById("connectionPanel"),
  connectionStatusLabel: document.getElementById("connectionStatusLabel"),
  connectionStatusDetail: document.getElementById("connectionStatusDetail"),
  rankingBody: document.getElementById("rankingBody"),
  schoolProfileForm: document.getElementById("schoolProfileForm"),
  studentForm: document.getElementById("studentForm"),
  studentClassLevelSelect: document.getElementById("studentClassLevelSelect"),
  studentStreamSelect: document.getElementById("studentStreamSelect"),
  studentStatusSelect: document.getElementById("studentStatusSelect"),
  studentCountLabel: document.getElementById("studentCountLabel"),
  studentRegisterBody: document.getElementById("studentRegisterBody"),
  marksAcademicYearSelect: document.getElementById("marksAcademicYearSelect"),
  marksTermSelect: document.getElementById("marksTermSelect"),
  marksExamTypeSelect: document.getElementById("marksExamTypeSelect"),
  marksClassLevelSelect: document.getElementById("marksClassLevelSelect"),
  marksStreamSelect: document.getElementById("marksStreamSelect"),
  marksTeacherSelect: document.getElementById("marksTeacherSelect"),
  subjectSelect: document.getElementById("subjectSelect"),
  marksBody: document.getElementById("marksBody"),
  saveMarksBtn: document.getElementById("saveMarksBtn"),
  csvInput: document.getElementById("csvInput"),
  downloadTemplateBtn: document.getElementById("downloadTemplateBtn"),
  downloadErrorsBtn: document.getElementById("downloadErrorsBtn"),
  uploadSummary: document.getElementById("uploadSummary"),
  uploadErrors: document.getElementById("uploadErrors"),
  metricExpected: document.getElementById("metricExpected"),
  metricCompleted: document.getElementById("metricCompleted"),
  metricPending: document.getElementById("metricPending"),
  metricLate: document.getElementById("metricLate"),
  metricErrors: document.getElementById("metricErrors"),
  metricTeachersUploaded: document.getElementById("metricTeachersUploaded"),
  metricTeachersPending: document.getElementById("metricTeachersPending"),
  deadlineGrid: document.getElementById("deadlineGrid"),
  deadlineForm: document.getElementById("deadlineForm"),
  uploadMonitorBody: document.getElementById("uploadMonitorBody"),
  auditBody: document.getElementById("auditBody"),
  subjectBars: document.getElementById("subjectBars"),
  promotionRuleMetric: document.getElementById("promotionRuleMetric"),
  promotionPromoteMetric: document.getElementById("promotionPromoteMetric"),
  promotionReviewMetric: document.getElementById("promotionReviewMetric"),
  promotionRepeatMetric: document.getElementById("promotionRepeatMetric"),
  promotionBody: document.getElementById("promotionBody"),
  approvePromotionBtn: document.getElementById("approvePromotionBtn"),
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
  if (!response.ok) {
    const error = new Error(payload.error || "Request failed");
    error.payload = payload;
    console.error("API request failed", path, payload);
    throw error;
  }
  return payload;
}

async function loadData() {
  try {
    db = await api("/api/bootstrap");
    results = await api("/api/results");
    connectionStatus = await api("/api/storage-status");
    renderAll();
  } catch (error) {
    console.error("Shule data load failed", error);
    connectionStatus = { configured: false, mode: "failed", lastError: error.message || "Unable to load school data" };
    renderConnectionStatus();
    toast(`Connection failed: ${connectionStatus.lastError}`);
  }
}

function renderAll() {
  renderSchoolMeta();
  renderSetup();
  renderSelects();
  renderDashboard();
  renderStudents();
  renderMarksEntry();
  renderUploadErrors();
  renderMonitoring();
  renderPromotion();
  renderAnalytics();
  renderReportSelect();
  renderReports();
}

function renderSchoolMeta() {
  els.schoolMeta.textContent = `${db.school.academicYear} | ${db.school.term} | ${db.school.exam}`;
  els.heroSchool.textContent = db.school.name;
  setValue("schoolNameInput", db.school.name);
  setValue("schoolShortNameInput", db.school.shortName);
  setValue("schoolMottoInput", db.school.motto);
  setValue("schoolPhoneInput", db.school.phone);
  setValue("schoolEmailInput", db.school.email);
  setValue("schoolAddressInput", db.school.address);
  setValue("schoolLogoInput", db.school.logoUrl);
  setValue("schoolWatermarkInput", db.school.watermarkText);
}

function renderSetup() {
  renderCompact("academicYear", db.academicYears, (item) => `${item.name} ${item.active ? "Active" : "Closed"}`);
  renderCompact("term", db.terms, (item) => `${item.name} ${item.active ? "Active" : ""}`);
  renderCompact("examType", db.examTypes, (item) => `${item.name} (${item.weight}%)`);
  renderCompact("class", db.classes, (item) => item.name);
  renderCompact("stream", db.streams, (item) => item.name);
  renderCompact("subject", db.subjects, (item) => `${item.code} - ${item.name}`);
  renderCompact("teacher", db.teachers, (item) => `${item.name} - ${item.role}`);
  renderCompact("assignment", db.teacherAssignments, (item) => {
    const teacher = teacherById(item.teacherId);
    const classInfo = classById(item.classId);
    const subject = subjectById(item.subjectId);
    return `${teacher?.name || item.teacherId} / ${classInfo?.name || item.classId} / ${subject?.code || item.subjectId}`;
  });
  renderCompact("grading", db.gradingScale, (item) => `${item.grade}: ${item.min}-${item.max} agg ${item.aggregate}`);
  renderCompact("role", db.roles, (item) => item.name);
}

function renderCompact(prefix, items, labelFn) {
  const count = document.getElementById(`${prefix}Count`);
  const list = document.getElementById(`${prefix}List`);
  if (count) count.textContent = `${items.length} record(s)`;
  if (list) list.innerHTML = items.map((item) => `<div><strong>${escapeHtml(labelFn(item))}</strong></div>`).join("");
}

function renderSelects() {
  const years = db.academicYears.map((item) => `<option value="${item.name}">${escapeHtml(item.name)}</option>`).join("");
  const terms = db.terms.map((item) => `<option value="${item.name}">${escapeHtml(item.name)}</option>`).join("");
  const exams = db.examTypes.map((item) => `<option value="${item.name}">${escapeHtml(item.name)}</option>`).join("");
  const levels = db.classLevels.map((item) => `<option value="${item.name}">${escapeHtml(item.name)}</option>`).join("");
  const streams = db.streams.map((item) => `<option value="${item.name}">${escapeHtml(item.name)}</option>`).join("");
  const subjects = db.subjects.map((subject) => `<option value="${subject.id}">${escapeHtml(subject.code)} - ${escapeHtml(subject.name)}</option>`).join("");
  const teachers = db.teachers.map((teacher) => `<option value="${teacher.id}">${escapeHtml(teacher.name)} (${escapeHtml(teacher.role)})</option>`).join("");

  setOptions(els.studentClassLevelSelect, levels, "P6");
  setOptions(els.studentStreamSelect, streams, "East");
  els.studentStatusSelect.innerHTML = STATUS_OPTIONS.map((status) => `<option>${status}</option>`).join("");

  setOptions(els.marksAcademicYearSelect, years, db.school.academicYear);
  setOptions(els.marksTermSelect, terms, db.school.term);
  setOptions(els.marksExamTypeSelect, exams, db.school.exam);
  setOptions(els.marksClassLevelSelect, levels, "P6");
  setOptions(els.marksStreamSelect, streams, "East");
  setOptions(els.subjectSelect, subjects, "eng");
  setOptions(els.marksTeacherSelect, teachers, assignedTeacherId(currentMarksClassId(), els.subjectSelect.value) || db.teachers[0]?.id);

  for (const id of ["deadlineAcademicYearSelect", "deadlineTermSelect", "deadlineExamTypeSelect", "deadlineClassLevelSelect", "deadlineStreamSelect", "deadlineSubjectSelect", "deadlineTeacherSelect"]) {
    const element = document.getElementById(id);
    if (!element) continue;
    if (id.includes("AcademicYear")) setOptions(element, years, db.school.academicYear);
    if (id.includes("Term")) setOptions(element, terms, db.school.term);
    if (id.includes("ExamType")) setOptions(element, exams, db.school.exam);
    if (id.includes("ClassLevel")) setOptions(element, levels, "P6");
    if (id.includes("Stream")) setOptions(element, streams, "East");
    if (id.includes("Subject")) setOptions(element, subjects, "eng");
    if (id.includes("Teacher")) setOptions(element, teachers, assignedTeacherId("p6-east", "eng") || db.teachers[0]?.id);
  }
}

function setOptions(element, html, selectedValue) {
  if (!element) return;
  const previous = element.value;
  element.innerHTML = html;
  element.value = previous || selectedValue || element.options[0]?.value || "";
}

function renderDashboard() {
  renderConnectionStatus();
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

function renderConnectionStatus() {
  if (!els.connectionPanel) return;
  const connected = connectionStatus.mode === "supabase";
  const localMode = connectionStatus.mode === "json" && !connectionStatus.configured;
  els.connectionStatusLabel.textContent = connected ? "Connected" : localMode ? "Local JSON" : "Failed";
  els.connectionStatusDetail.textContent = connected
    ? "Supabase storage is active"
    : connectionStatus.lastError || "Supabase is not currently serving data";
  els.connectionPanel.classList.toggle("status-connected", connected);
  els.connectionPanel.classList.toggle("status-failed", !connected && !localMode);
  els.connectionPanel.classList.toggle("status-pending", !connected && localMode);
}

function renderStudents() {
  els.studentCountLabel.textContent = `${results.counts.activeStudents} active, ${results.counts.inactiveStudents} historical`;
  els.studentRegisterBody.innerHTML = db.students.map((student) => {
    const classInfo = classById(student.classId) || {};
    return `
      <tr>
        <td>${escapeHtml(student.studentId || student.admissionNo)}</td>
        <td>${escapeHtml(student.name)}<br><span>${escapeHtml(student.admissionNo)}</span></td>
        <td>${escapeHtml(student.gender)}</td>
        <td>${escapeHtml(classInfo.level || student.classLevel || "")}</td>
        <td>${escapeHtml(classInfo.stream || student.stream || "")}</td>
        <td>${escapeHtml(student.house || "-")}</td>
        <td><span class="pill ${student.status === "Active" ? "pill-green" : "pill-muted"}">${escapeHtml(student.status)}</span></td>
        <td>${escapeHtml(student.guardian || "-")}</td>
        <td>${escapeHtml(student.contact || "-")}</td>
      </tr>
    `;
  }).join("");
}

function renderMarksEntry() {
  const classId = currentMarksClassId();
  const subjectId = els.subjectSelect.value || db.subjects[0]?.id;
  const teacherId = assignedTeacherId(classId, subjectId) || els.marksTeacherSelect.value;
  if (teacherId) els.marksTeacherSelect.value = teacherId;
  const learners = db.students.filter((student) => student.status === "Active" && student.classId === classId);
  const markMap = new Map(db.marks
    .filter((mark) => mark.subjectId === subjectId && mark.classId === classId && mark.academicYear === els.marksAcademicYearSelect.value && mark.term === els.marksTermSelect.value && mark.examType === els.marksExamTypeSelect.value)
    .map((mark) => [mark.studentId, mark]));

  els.marksBody.innerHTML = learners.length ? learners.map((student) => {
    const mark = markMap.get(student.id);
    return `
      <tr>
        <td>${escapeHtml(student.admissionNo)}</td>
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.classLevel || classById(student.classId)?.level || "")}</td>
        <td>${escapeHtml(student.stream || classById(student.classId)?.stream || "")}</td>
        <td><input class="score-input" type="number" min="0" max="100" data-student-id="${student.id}" data-admission-no="${escapeHtml(student.admissionNo)}" value="${mark?.score ?? ""}"></td>
        <td><span class="pill ${mark?.status === "Captured" ? "pill-green" : "pill-orange"}">${mark?.status || "Missing"}</span></td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="6">No active learners for this class and stream.</td></tr>`;
}

function renderUploadErrors() {
  const errors = latestUploadErrors.length ? latestUploadErrors : results.uploadErrors;
  els.uploadSummary.textContent = errors.length ? `${errors.length} validation issue(s) found` : "No validation errors";
  els.uploadErrors.innerHTML = errors.length
    ? errors.map((error) => `<div class="error-item"><strong>${escapeHtml(error.errorType)}</strong><span>Row ${error.rowNumber || "-"} | ${escapeHtml(error.admissionNo || "-")} | ${escapeHtml(error.errorMessage)}</span></div>`).join("")
    : `<div class="empty-state">CSV rows that fail validation will appear here.</div>`;
}

function renderMonitoring() {
  els.metricExpected.textContent = results.monitoring.expectedUploads;
  els.metricCompleted.textContent = results.monitoring.completedUploads;
  els.metricPending.textContent = results.monitoring.pendingUploads;
  els.metricLate.textContent = results.monitoring.overdueUploads;
  els.metricErrors.textContent = results.monitoring.validationFailures;
  els.metricTeachersUploaded.textContent = results.monitoring.teachersUploaded;
  els.metricTeachersPending.textContent = results.monitoring.teachersPending;
  els.deadlineGrid.innerHTML = results.deadlines.map((deadline) => `
    <article class="deadline-card ${deadline.status}">
      <strong>${escapeHtml(deadline.subjectName)}</strong>
      <span>${escapeHtml(deadline.className)} | ${escapeHtml(deadline.teacherName || "")}</span>
      <small>${formatDate(deadline.dueAt)}</small>
      <em>${escapeHtml(deadline.status)}</em>
    </article>
  `).join("");
  els.uploadMonitorBody.innerHTML = results.deadlines.map((deadline) => {
    const batch = results.uploadBatches.find((item) => item.classId === deadline.classId && item.subjectId === deadline.subjectId && item.teacherId === deadline.teacherId);
    return `
      <tr>
        <td>${escapeHtml(deadline.teacherName || "-")}</td>
        <td>${escapeHtml(deadline.className)}</td>
        <td>${escapeHtml(deadline.subjectName)}</td>
        <td><span class="pill ${deadline.status === "complete" ? "pill-green" : deadline.status === "late" ? "pill-red" : "pill-orange"}">${escapeHtml(deadline.status)}</span></td>
        <td>${batch ? formatDate(batch.uploadedAt) : "-"}</td>
        <td>${batch?.validRows ?? "-"}</td>
        <td>${batch?.errorRows ?? "-"}</td>
      </tr>
    `;
  }).join("");
  els.auditBody.innerHTML = results.audit.map((auditRow) => `
    <tr><td>${escapeHtml(auditRow.user || "-")}</td><td>${escapeHtml(auditRow.action)}</td><td>${formatDate(auditRow.timestamp)}</td><td>${escapeHtml(auditRow.newValue || "-")}</td></tr>
  `).join("");
}

function renderPromotion() {
  const preview = results.promotionPreview || [];
  const rule = db.promotionRules;
  els.promotionRuleMetric.textContent = `${rule.minAverage}% / ${rule.maxFailedSubjects} fails`;
  els.promotionPromoteMetric.textContent = preview.filter((item) => item.decision === "PROMOTED").length;
  els.promotionReviewMetric.textContent = preview.filter((item) => item.decision === "MANUAL REVIEW").length;
  els.promotionRepeatMetric.textContent = preview.filter((item) => item.decision === "REPEAT").length;
  els.promotionBody.innerHTML = preview.map((item) => `
    <tr>
      <td>${escapeHtml(item.admissionNo)}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.currentClass)}</td>
      <td>${item.average}</td>
      <td>${item.failedSubjects}</td>
      <td>${item.missingSubjects}</td>
      <td><span class="pill ${promotionClass(item.decision)}">${escapeHtml(item.decision)}</span></td>
      <td>${escapeHtml(item.targetClassId === "graduated" ? "Graduate" : classById(item.targetClassId)?.name || item.targetClassId)}</td>
    </tr>
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
    <option value="${item.id}" ${item.count ? "" : "disabled"}>${escapeHtml(item.name)} (${item.count} learner${item.count === 1 ? "" : "s"})</option>
  `).join("");
  els.reportClassSelect.value = selectedReportClassId;

  const classStudents = selectedReportClassStudents();
  if (!classStudents.some((student) => student.id === selectedReportStudentId)) selectedReportStudentId = classStudents[0]?.id || null;
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
  const classInfo = classById(selectedReportClassId);
  const className = classInfo?.name || "Selected class";
  const students = reportMode === "class" ? classStudents : classStudents.filter((student) => student.id === selectedReportStudentId);
  els.reportModeLabel.textContent = reportMode === "class" ? `${className} reports: one learner per printed packet` : `Individual report preview: ${className}`;
  els.reportCards.innerHTML = students.length ? students.map(renderReportPacket).join("") : `<div class="empty-state">Select a class with active learners to preview and print reports.</div>`;
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
      <div class="watermark">${escapeHtml(db.school.watermarkText || "MJA")}</div>
      <header class="report-header">
        <div class="logo-box">${db.school.logoUrl ? `<img src="${escapeHtml(db.school.logoUrl)}" alt="Logo">` : "MJA"}</div>
        <div>
          <h2>${escapeHtml(results.school.name)}</h2>
          <p>${escapeHtml(results.school.motto)}</p>
          <small>${escapeHtml(results.school.address)} | ${escapeHtml(results.school.phone)} | ${escapeHtml(results.school.email)}</small>
        </div>
        <div class="qr-box">QR<br>${escapeHtml(student.verificationCode.slice(-6))}</div>
      </header>
      <div class="report-title">Learner Academic Report</div>
      <section class="student-strip">
        <div class="photo-box">${student.photo ? `<img src="${escapeHtml(student.photo)}" alt="Student photo">` : "Photo"}</div>
        <div><span>Student ID</span><strong>${escapeHtml(student.studentId || student.admissionNo)}</strong></div>
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
        <div class="chart-card"><h3>Competency Ratings</h3>${Object.entries(student.competencies || {}).map(([label, value]) => `<div class="rating-row"><span>${escapeHtml(label)}</span><strong>${value}/5</strong></div>`).join("")}</div>
      </div>
      ${reportFooter(student)}
    </section>
  `;
}

function renderReportPageThree(student) {
  return `
    <section class="report-page">
      <div class="report-subhead"><h2>Comments, Matrix & Verification</h2><span>${escapeHtml(student.verificationCode)}</span></div>
      <div class="comment-grid">
        <div><h3>Class Teacher Comment</h3><p>${escapeHtml(db.comments.teacher)}</p></div>
        <div><h3>Head Teacher Comment</h3><p>${escapeHtml(db.comments.headteacher)}</p></div>
        <div><h3>Co-Curricular Activities</h3><p>${escapeHtml(db.activities.join(", "))}</p></div>
        <div><h3>Student Conduct</h3><p>${escapeHtml(student.conduct)}</p></div>
      </div>
      <h3 class="matrix-heading">Grading Matrix</h3>
      <table class="report-table grading-matrix">
        <thead><tr><th>Grade</th><th>Range</th><th>Aggregate</th><th>Comment</th></tr></thead>
        <tbody>${db.gradingScale.map((row) => `<tr><td>${row.grade}</td><td>${row.min}-${row.max}</td><td>${row.aggregate}</td><td>${escapeHtml(row.comment)}</td></tr>`).join("")}</tbody>
      </table>
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

async function saveSchoolProfile(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(els.schoolProfileForm).entries());
  await api("/api/school", { method: "POST", body: JSON.stringify(body) });
  toast("School profile saved");
  await loadData();
}

async function saveStudent(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(els.studentForm).entries());
  body.admissionNo = body.admissionNo || body.studentId;
  body.classId = classIdFrom(body.classLevel, body.stream);
  await api("/api/students", { method: "POST", body: JSON.stringify(body) });
  els.studentForm.reset();
  toast("Student added");
  await loadData();
}

async function saveMarks() {
  const context = marksContext();
  const marks = [...document.querySelectorAll(".score-input")]
    .filter((input) => input.value !== "")
    .map((input, index) => ({ rowNumber: index + 2, studentId: input.dataset.studentId, admissionNo: input.dataset.admissionNo, score: Number(input.value) }));
  try {
    await api("/api/marks", { method: "POST", body: JSON.stringify({ ...context, marks }) });
    latestUploadErrors = [];
    toast(`Saved ${marks.length} mark entries`);
    await loadData();
  } catch (error) {
    latestUploadErrors = error.payload?.errors || [];
    renderUploadErrors();
    toast(`${latestUploadErrors.length || 1} validation issue(s) found`);
  }
}

function downloadCsvTemplate() {
  const context = marksContext();
  const subject = subjectById(context.subjectId);
  const classInfo = classById(context.classId);
  const learners = db.students.filter((student) => student.status === "Active" && student.classId === context.classId);
  const lines = ["Academic Year,Term,Exam Type,Class,Stream,Subject,Admission Number,Student Name,Mark,Remarks"];
  for (const student of learners) {
    lines.push([context.academicYear, context.term, context.examType, classInfo.level, classInfo.stream, subject.name, student.admissionNo, student.name, "", ""].map(csvCell).join(","));
  }
  downloadText(`${context.academicYear}_${context.term}_${context.examType}_${classInfo.name}_${subject.code}_template.csv`, lines.join("\n"));
}

async function importCsv(file) {
  const context = marksContext();
  const text = await file.text();
  const rows = parseCsv(text);
  const errors = [];
  const marks = [];
  const seen = new Set();
  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const classText = String(row[3] || "").trim();
    const streamText = String(row[4] || "").trim();
    const admissionNo = String(row[6] || "").trim();
    const markValue = String(row[8] || "").trim();
    const student = db.students.find((item) => item.admissionNo === admissionNo);
    if (!student) return errors.push(errorRow(rowNumber, admissionNo, "Missing Student", "Admission number does not exist"));
    if (student.classId !== context.classId || classText !== els.marksClassLevelSelect.value || streamText !== els.marksStreamSelect.value) return errors.push(errorRow(rowNumber, admissionNo, "Wrong Class/Stream", "Learner is not in the selected class and stream"));
    if (seen.has(admissionNo)) return errors.push(errorRow(rowNumber, admissionNo, "Duplicate Mark", "Learner appears twice in the file"));
    if (markValue === "") return errors.push(errorRow(rowNumber, admissionNo, "Missing Mark", "Mark is required"));
    const score = Number(markValue);
    if (!Number.isFinite(score) || score < 0 || score > 100) return errors.push(errorRow(rowNumber, admissionNo, "Mark Range", "Mark must be between 0 and 100"));
    seen.add(admissionNo);
    marks.push({ rowNumber, studentId: student.id, admissionNo, score });
  });
  if (!isTeacherAssigned(context.teacherId, context.classId, context.subjectId)) {
    errors.push(errorRow("-", "-", "Teacher Assignment", "Teacher is not assigned to this class, stream and subject"));
  }
  latestUploadErrors = errors;
  renderUploadErrors();
  if (errors.length) return toast(`${errors.length} upload error(s) found`);
  try {
    await api("/api/marks", { method: "POST", body: JSON.stringify({ ...context, marks }) });
    latestUploadErrors = [];
    els.csvInput.value = "";
    toast(`Imported ${marks.length} marks`);
    await loadData();
  } catch (error) {
    latestUploadErrors = error.payload?.errors || [];
    renderUploadErrors();
    toast(`${latestUploadErrors.length || 1} server validation issue(s) found`);
  }
}

function downloadErrorReport() {
  const errors = latestUploadErrors.length ? latestUploadErrors : results.uploadErrors;
  const lines = ["Row,Admission Number,Error Type,Error Message,Timestamp"];
  for (const error of errors) lines.push([error.rowNumber || "", error.admissionNo || "", error.errorType, error.errorMessage, error.timestamp || ""].map(csvCell).join(","));
  downloadText("marks_upload_error_report.csv", lines.join("\n"));
}

async function saveDeadline(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(els.deadlineForm).entries());
  body.classId = classIdFrom(body.classLevel, body.stream);
  await api("/api/deadlines", { method: "POST", body: JSON.stringify(body) });
  toast("Deadline saved");
  await loadData();
}

async function approvePromotion() {
  await api("/api/promotions", { method: "POST", body: JSON.stringify({ approvedBy: "Head Teacher" }) });
  toast("Promotion approved and history saved");
  await loadData();
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

function marksContext() {
  return {
    academicYear: els.marksAcademicYearSelect.value,
    term: els.marksTermSelect.value,
    examType: els.marksExamTypeSelect.value,
    classId: currentMarksClassId(),
    subjectId: els.subjectSelect.value,
    teacherId: els.marksTeacherSelect.value
  };
}

function currentMarksClassId() {
  return classIdFrom(els.marksClassLevelSelect.value || "P6", els.marksStreamSelect.value || "East");
}

function classIdFrom(level, stream) {
  return `${String(level).toLowerCase()}-${String(stream).toLowerCase()}`;
}

function assignedTeacherId(classId, subjectId) {
  return db?.teacherAssignments?.find((item) => item.classId === classId && item.subjectId === subjectId && item.active !== false)?.teacherId || "";
}

function isTeacherAssigned(teacherId, classId, subjectId) {
  return db.teacherAssignments.some((item) => item.teacherId === teacherId && item.classId === classId && item.subjectId === subjectId && item.active !== false);
}

function reportClassesWithCounts() {
  return db.classes.map((classInfo) => ({ ...classInfo, count: results.students.filter((student) => student.classId === classInfo.id).length }));
}

function selectedReportClassStudents() {
  return results.students
    .filter((student) => student.classId === selectedReportClassId)
    .sort((a, b) => a.classPosition - b.classPosition || a.name.localeCompare(b.name));
}

function classById(id) {
  return db.classes.find((item) => item.id === id);
}

function subjectById(id) {
  return db.subjects.find((item) => item.id === id);
}

function teacherById(id) {
  return db.teachers.find((item) => item.id === id);
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value || "";
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
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function valueOrDash(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function promotionClass(value) {
  if (value === "PROMOTED" || value === "complete") return "pill-green";
  if (value === "REPEAT" || value === "late") return "pill-red";
  return "pill-orange";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function errorRow(rowNumber, admissionNo, errorType, errorMessage) {
  return { rowNumber, admissionNo, errorType, errorMessage, timestamp: new Date().toISOString() };
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

els.schoolProfileForm.addEventListener("submit", saveSchoolProfile);
els.studentForm.addEventListener("submit", saveStudent);
[
  els.marksAcademicYearSelect,
  els.marksTermSelect,
  els.marksExamTypeSelect,
  els.marksClassLevelSelect,
  els.marksStreamSelect,
  els.subjectSelect
].forEach((element) => element.addEventListener("change", renderMarksEntry));
els.saveMarksBtn.addEventListener("click", saveMarks);
els.downloadTemplateBtn.addEventListener("click", downloadCsvTemplate);
els.downloadErrorsBtn.addEventListener("click", downloadErrorReport);
els.csvInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) importCsv(file).catch((error) => toast(error.message));
});
els.deadlineForm.addEventListener("submit", saveDeadline);
els.approvePromotionBtn.addEventListener("click", approvePromotion);
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
