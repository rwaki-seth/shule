let db = null;
let results = null;
let selectedReportClassId = null;
let selectedReportStudentId = null;
let selectedProfileStudentId = null;
let reportMode = "student";
let latestUploadErrors = [];
let latestStudentImportErrors = [];
let connectionStatus = { configured: false, mode: "checking", lastError: "" };
let currentUser = null;
let staffUsers = [];

const STATUS_OPTIONS = ["Active", "Graduated", "Transferred", "Suspended", "Expelled", "Dropped Out", "Deceased", "Inactive"];

const els = {
  accessPortal: document.getElementById("accessPortal"),
  staffSidebar: document.getElementById("staffSidebar"),
  staffShell: document.getElementById("staffShell"),
  staffMobileNav: document.getElementById("staffMobileNav"),
  loginForm: document.getElementById("loginForm"),
  bootstrapForm: document.getElementById("bootstrapForm"),
  showBootstrapBtn: document.getElementById("showBootstrapBtn"),
  loginMessage: document.getElementById("loginMessage"),
  publicVerificationForm: document.getElementById("publicVerificationForm"),
  publicVerificationCode: document.getElementById("publicVerificationCode"),
  publicVerificationContent: document.getElementById("publicVerificationContent"),
  currentUserRole: document.getElementById("currentUserRole"),
  logoutBtn: document.getElementById("logoutBtn"),
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
  connectionUrlStatus: document.getElementById("connectionUrlStatus"),
  connectionTablesStatus: document.getElementById("connectionTablesStatus"),
  connectionRecordCount: document.getElementById("connectionRecordCount"),
  connectionFetchTime: document.getElementById("connectionFetchTime"),
  rankingBody: document.getElementById("rankingBody"),
  schoolProfileForm: document.getElementById("schoolProfileForm"),
  reportSettingsForm: document.getElementById("reportSettingsForm"),
  studentForm: document.getElementById("studentForm"),
  studentClassLevelSelect: document.getElementById("studentClassLevelSelect"),
  studentStreamSelect: document.getElementById("studentStreamSelect"),
  studentStatusSelect: document.getElementById("studentStatusSelect"),
  importClassLevelSelect: document.getElementById("importClassLevelSelect"),
  importStreamSelect: document.getElementById("importStreamSelect"),
  studentCsvInput: document.getElementById("studentCsvInput"),
  downloadStudentTemplateBtn: document.getElementById("downloadStudentTemplateBtn"),
  downloadStudentErrorsBtn: document.getElementById("downloadStudentErrorsBtn"),
  studentImportSummary: document.getElementById("studentImportSummary"),
  studentImportErrors: document.getElementById("studentImportErrors"),
  newStudentPhotoInput: document.getElementById("newStudentPhotoInput"),
  studentCountLabel: document.getElementById("studentCountLabel"),
  studentRegisterBody: document.getElementById("studentRegisterBody"),
  studentProfileContent: document.getElementById("studentProfileContent"),
  backToStudentsBtn: document.getElementById("backToStudentsBtn"),
  studentProfileReportBtn: document.getElementById("studentProfileReportBtn"),
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
  execTotal: document.getElementById("execTotal"),
  execActive: document.getElementById("execActive"),
  execAverage: document.getElementById("execAverage"),
  execPromotion: document.getElementById("execPromotion"),
  execUploads: document.getElementById("execUploads"),
  execSubjects: document.getElementById("execSubjects"),
  classComparisonBars: document.getElementById("classComparisonBars"),
  genderAnalysis: document.getElementById("genderAnalysis"),
  streamAnalysis: document.getElementById("streamAnalysis"),
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
  mobileReportDownloadBtn: document.getElementById("mobileReportDownloadBtn"),
  mobileMoreSheet: document.getElementById("mobileMoreSheet"),
  mobileSheetBackdrop: document.getElementById("mobileSheetBackdrop"),
  moreNavButton: document.getElementById("moreNavButton"),
  closeMoreSheet: document.getElementById("closeMoreSheet"),
  reportCards: document.getElementById("reportCards"),
  verificationForm: document.getElementById("verificationForm"),
  verificationCodeInput: document.getElementById("verificationCodeInput"),
  verificationContent: document.getElementById("verificationContent"),
  userForm: document.getElementById("userForm"),
  userList: document.getElementById("userList"),
  userCountLabel: document.getElementById("userCountLabel"),
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
    if (response.status === 401 && !path.startsWith("/api/auth/")) showPublicPortal();
    throw error;
  }
  return payload;
}

async function loadData() {
  const refreshButton = document.getElementById("refreshBtn");
  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.textContent = "Refreshing...";
  }
  try {
    db = await api("/api/bootstrap");
    results = await api("/api/results");
    connectionStatus = await api("/api/storage-status");
    renderAll();
    applyUrlRoute();
    if (currentUser?.role === "Super Admin") await loadUsers();
  } catch (error) {
    console.error("Shule data load failed", error);
    connectionStatus = { configured: false, mode: "failed", lastError: error.message || "Unable to load school data" };
    renderConnectionStatus();
    toast(`Connection failed: ${connectionStatus.lastError}`);
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent = "Refresh";
    }
  }
}

async function initializeApp() {
  try {
    const session = await api("/api/auth/session");
    if (session.authenticated) {
      currentUser = session.user;
      showStaffApp();
      await loadData();
      return;
    }
  } catch (error) {
    console.error("Session check failed", error);
  }
  showPublicPortal();
}

function showStaffApp() {
  els.accessPortal.hidden = true;
  els.staffSidebar.hidden = false;
  els.staffShell.hidden = false;
  els.staffMobileNav.hidden = false;
  els.currentUserRole.textContent = `${currentUser.name} | ${currentUser.role}`;
  applyRoleAccess();
}

function showPublicPortal() {
  currentUser = null;
  els.accessPortal.hidden = false;
  els.staffSidebar.hidden = true;
  els.staffShell.hidden = true;
  els.staffMobileNav.hidden = true;
  const match = window.location.hash.match(/^#verify\/(.+)$/);
  if (match) {
    els.publicVerificationCode.value = decodeURIComponent(match[1]);
    verifyPublicReport().catch(() => {});
  }
}

function applyRoleAccess() {
  const allowed = new Set(currentUser?.views || []);
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.hidden = !allowed.has(button.dataset.view);
  });
  document.querySelectorAll(".view").forEach((view) => {
    if (!allowed.has(view.id) && view.id !== "studentProfile") view.classList.remove("active");
  });
  const firstView = allowed.has("dashboard") ? "dashboard" : [...allowed][0];
  const active = document.querySelector(".view.active");
  if (!active || (!allowed.has(active.id) && active.id !== "studentProfile")) navigateTo(firstView, null);
}

function renderAll() {
  renderSchoolMeta();
  renderSetup();
  renderSelects();
  renderDashboard();
  renderStudents();
  renderStudentImportErrors();
  renderStudentProfile();
  renderMarksEntry();
  renderUploadErrors();
  renderMonitoring();
  renderPromotion();
  renderAnalytics();
  renderReportSelect();
  renderReports();
  decorateMobileTables();
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
  const reportForm = els.reportSettingsForm;
  if (reportForm) {
    for (const [name, value] of Object.entries({ ...db.comments, ...db.nextTerm })) {
      if (reportForm.elements[name]) reportForm.elements[name].value = value || "";
    }
  }
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
  setOptions(els.importClassLevelSelect, levels, "P6");
  setOptions(els.importStreamSelect, streams, "East");
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
  els.connectionUrlStatus.textContent = connectionStatus.supabaseUrlConfigured ? "Yes" : "No";
  els.connectionTablesStatus.textContent = connectionStatus.tablesReachable ? "Yes" : "No";
  els.connectionRecordCount.textContent = connectionStatus.checkedTables
    ? Object.values(connectionStatus.checkedTables).reduce((sum, count) => sum + Number(count || 0), 0)
    : 0;
  els.connectionFetchTime.textContent = connectionStatus.lastFetchAt ? formatDate(connectionStatus.lastFetchAt) : "-";
  els.connectionStatusDetail.textContent = connected
    ? "None"
    : connectionStatus.lastError || "Supabase is not currently serving data";
  els.connectionPanel.classList.toggle("status-connected", connected);
  els.connectionPanel.classList.toggle("status-failed", !connected && !localMode);
  els.connectionPanel.classList.toggle("status-pending", !connected && localMode);
}

function decorateMobileTables() {
  document.querySelectorAll(".table-wrap table:not(.report-table)").forEach((table) => {
    const labels = [...table.querySelectorAll("thead th")].map((cell) => cell.textContent.trim());
    table.querySelectorAll("tbody tr").forEach((row) => {
      [...row.children].forEach((cell, index) => {
        if (cell.tagName === "TD") cell.dataset.label = labels[index] || "";
      });
    });
  });
}

function navigateTo(viewName, label) {
  if (currentUser && viewName !== "studentProfile" && !currentUser.views.includes(viewName)) {
    toast("Your role does not permit access to this module");
    return;
  }
  if (viewName !== "studentProfile" && window.location.hash.startsWith("#student/")) {
    window.history.replaceState(null, "", `#${viewName}`);
  }
  document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
  document.getElementById(viewName)?.classList.add("active");
  const navigationView = viewName === "studentProfile" ? "students" : viewName;
  document.querySelectorAll(".nav-button, .mobile-nav-button, .mobile-more-button").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === navigationView);
  });
  const secondaryView = ["setup", "monitoring", "promotion", "analytics", "accessControl"].includes(viewName);
  els.moreNavButton?.classList.toggle("active", secondaryView);
  els.pageTitle.textContent = label || document.querySelector(`[data-view="${viewName}"]`)?.textContent.trim() || viewName;
  closeMobileMoreSheet();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openMobileMoreSheet() {
  els.mobileMoreSheet?.classList.add("open");
  els.mobileSheetBackdrop?.classList.add("open");
  els.mobileMoreSheet?.setAttribute("aria-hidden", "false");
}

function closeMobileMoreSheet() {
  els.mobileMoreSheet?.classList.remove("open");
  els.mobileSheetBackdrop?.classList.remove("open");
  els.mobileMoreSheet?.setAttribute("aria-hidden", "true");
}

function renderStudents() {
  els.studentCountLabel.textContent = `${results.counts.activeStudents} active, ${results.counts.inactiveStudents} historical`;
  els.studentRegisterBody.innerHTML = db.students.map((student) => {
    const classInfo = classById(student.classId) || {};
    return `
      <tr class="student-register-row" data-student-id="${escapeHtml(student.id)}">
        <td>${escapeHtml(student.studentId || student.admissionNo)}</td>
        <td><strong>${escapeHtml(student.name)}</strong><br><span>${escapeHtml(student.admissionNo)}</span></td>
        <td>${escapeHtml(student.gender)}</td>
        <td>${escapeHtml(classInfo.level || student.classLevel || "")}</td>
        <td>${escapeHtml(classInfo.stream || student.stream || "")}</td>
        <td>${escapeHtml(student.house || "-")}</td>
        <td><span class="pill ${student.status === "Active" ? "pill-green" : "pill-muted"}">${escapeHtml(student.status)}</span></td>
        <td>${escapeHtml(student.guardian || "-")}</td>
        <td>${escapeHtml(student.contact || "-")}</td>
        <td><button type="button" class="secondary student-view-button" data-student-id="${escapeHtml(student.id)}">View</button></td>
      </tr>
    `;
  }).join("");
  decorateMobileTables();
}

function renderStudentProfile() {
  if (!els.studentProfileContent) return;
  const student = db?.students?.find((item) => item.id === selectedProfileStudentId);
  if (!student) {
    els.studentProfileContent.innerHTML = `<section class="panel empty-state">Choose a student from the register to view their profile.</section>`;
    return;
  }
  const classInfo = classById(student.classId) || {};
  const academic = results?.students?.find((item) => item.id === student.id);
  const initials = student.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const detailRows = [
    ["Student ID", student.studentId || student.admissionNo],
    ["Admission Number", student.admissionNo],
    ["Full Name", student.name],
    ["Gender", student.gender || "-"],
    ["Date of Birth", student.dateOfBirth || "-"],
    ["Class", classInfo.level || student.classLevel || "-"],
    ["Stream", classInfo.stream || student.stream || "-"],
    ["House", student.house || "-"],
    ["Status", student.status || "-"],
    ["Admission Date", student.admissionDate || "-"],
    ["Parent / Guardian", student.guardian || "-"],
    ["Parent Contact", student.contact || "-"],
    ["Alternative Contact", student.alternativeContact || "-"],
    ["Attendance", `${Number(student.attendance || 0)}%`],
    ["Conduct", student.conduct || "-"]
  ];
  const movements = (db.movements || []).filter((item) => item.studentId === student.id);
  const attendance = student.attendanceDays || { present: 0, absent: 0, total: 0 };
  const classOptions = db.classes.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("");
  els.studentProfileContent.innerHTML = `
    <section class="student-profile-hero">
      <div class="student-profile-photo">
        ${student.photo ? `<img src="${escapeHtml(student.photo)}" alt="${escapeHtml(student.name)}">` : `<span>${escapeHtml(initials || "ST")}</span>`}
      </div>
      <div class="student-profile-identity">
        <span class="eyebrow">${escapeHtml(student.admissionNo)}</span>
        <h2>${escapeHtml(student.name)}</h2>
        <p>${escapeHtml(classInfo.name || `${student.classLevel} ${student.stream}`)} · ${escapeHtml(student.status)}</p>
        <label class="profile-photo-upload">Replace Student Photo
          <input id="profilePhotoInput" type="file" accept="image/*">
        </label>
      </div>
      <div class="student-profile-academic">
        <div><span>Average</span><strong>${academic?.average ?? "-"}</strong></div>
        <div><span>Class Position</span><strong>${academic?.classPosition ?? "-"}</strong></div>
        <div><span>Attendance</span><strong>${Number(student.attendance || 0)}%</strong></div>
      </div>
    </section>
    <section class="profile-detail-band">
      <h3>Student Details</h3>
      <div class="student-detail-grid">
        ${detailRows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
      </div>
    </section>
    <section class="profile-notes-band">
      <div><h3>Administrative Notes</h3><p>${escapeHtml(student.notes || "No notes recorded.")}</p></div>
      <div><h3>Competencies</h3><div class="competency-list">${Object.entries(student.competencies || {}).map(([label, value]) => `<span>${escapeHtml(label)} <strong>${escapeHtml(value)}/5</strong></span>`).join("")}</div></div>
    </section>
    <section class="profile-workspace-grid">
      <form id="studentDetailsForm" class="profile-form panel">
        <div class="panel-heading"><h3>Attendance & Contacts</h3><span>Maintain the learner's current record</span></div>
        <label>Parent / Guardian <input name="guardian" value="${escapeHtml(student.guardian || "")}"></label>
        <label>Primary Contact <input name="contact" value="${escapeHtml(student.contact || "")}"></label>
        <label>Alternative Contact <input name="alternativeContact" value="${escapeHtml(student.alternativeContact || "")}"></label>
        <label>Days Present <input name="present" type="number" min="0" value="${attendance.present || 0}"></label>
        <label>Days Absent <input name="absent" type="number" min="0" value="${attendance.absent || 0}"></label>
        <label>Total School Days <input name="total" type="number" min="0" value="${attendance.total || 0}"></label>
        <label>Activities <input name="activities" value="${escapeHtml((student.activities || []).join(", "))}" placeholder="Debate, Football"></label>
        <label>Notes <textarea name="notes">${escapeHtml(student.notes || "")}</textarea></label>
        <label>Class Teacher Comment <textarea name="classTeacherComment">${escapeHtml(student.reportComments?.classTeacher || "")}</textarea></label>
        <label>DOS Comment <textarea name="dosComment">${escapeHtml(student.reportComments?.dos || "")}</textarea></label>
        <label>Head Teacher Comment <textarea name="headTeacherComment">${escapeHtml(student.reportComments?.headTeacher || "")}</textarea></label>
        <button type="submit">Save Student Details</button>
      </form>
      <form id="studentMovementForm" class="profile-form panel">
        <div class="panel-heading"><h3>Record Movement</h3><span>Class, stream, transfer, or status change</span></div>
        <label>Movement Type <select name="movementType"><option>Class Change</option><option>Stream Change</option><option>Transfer</option><option>Repeat</option><option>Promotion</option><option>Status Change</option></select></label>
        <label>Destination Class & Stream <select name="toClassId"><option value="">No class change</option>${classOptions}</select></label>
        <label>New Status <select name="status"><option value="">Keep current status</option>${STATUS_OPTIONS.map((status) => `<option>${status}</option>`).join("")}</select></label>
        <label>Movement Date <input name="movementDate" type="date" value="${new Date().toISOString().slice(0, 10)}"></label>
        <label>Approved By <input name="approvedBy" value="School Admin"></label>
        <label>Remarks <textarea name="remarks"></textarea></label>
        <button type="submit">Record Movement</button>
      </form>
    </section>
    <section class="profile-detail-band">
      <div class="panel-heading"><h3>Learner Journey</h3><span>${movements.length} movement record(s)</span></div>
      <div class="journey-timeline">
        ${movements.length ? movements.map((movement) => `<article><time>${escapeHtml(movement.movementDate)}</time><div><strong>${escapeHtml(movement.movementType)}</strong><span>${escapeHtml(`${movement.fromClass || "-"} ${movement.fromStream || ""} to ${movement.toClass || "-"} ${movement.toStream || ""}`)}</span><small>${escapeHtml(movement.approvedBy)}${movement.remarks ? ` | ${escapeHtml(movement.remarks)}` : ""}</small></div></article>`).join("") : `<div class="empty-state">No movement history has been recorded yet.</div>`}
      </div>
    </section>
  `;
  document.getElementById("profilePhotoInput")?.addEventListener("change", updateProfilePhoto);
  document.getElementById("studentDetailsForm")?.addEventListener("submit", saveStudentDetails);
  document.getElementById("studentMovementForm")?.addEventListener("submit", saveStudentMovement);
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
        <td><textarea class="remark-input" data-student-id="${student.id}" placeholder="Individual subject remark">${escapeHtml(mark?.remarks || "")}</textarea></td>
        <td><span class="pill ${mark?.status === "Captured" ? "pill-green" : "pill-orange"}">${mark?.status || "Missing"}</span></td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="7">No active learners for this class and stream.</td></tr>`;
  decorateMobileTables();
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
  const executive = results.executive || {};
  els.execTotal.textContent = executive.totalLearners || 0;
  els.execActive.textContent = executive.activeLearners || 0;
  els.execAverage.textContent = executive.schoolAverage || 0;
  els.execPromotion.textContent = `${executive.promotionRate || 0}%`;
  els.execUploads.textContent = `${executive.uploadCompletion || 0}%`;
  els.execSubjects.textContent = `${executive.subjectsSubmitted || 0}/${results.counts.subjects}`;
  els.classComparisonBars.innerHTML = renderSummaryBars(executive.classComparison || []);
  els.genderAnalysis.innerHTML = renderSummaryList(executive.genderAnalysis || []);
  els.streamAnalysis.innerHTML = renderSummaryList(executive.streamAnalysis || []);
  const maxAverage = Math.max(...results.subjectStats.map((subject) => subject.average), 100);
  els.subjectBars.innerHTML = results.subjectStats.map((subject) => `
    <div class="bar-row">
      <div><strong>${escapeHtml(subject.subjectName)}</strong><span>${subject.entries} entries | High ${subject.highest} | Low ${subject.lowest}</span></div>
      <div class="bar-track"><span style="width:${Math.max(4, (subject.average / maxAverage) * 100)}%"></span></div>
      <strong>${subject.average}</strong>
    </div>
  `).join("");
}

function renderSummaryBars(items) {
  return items.map((item) => `
    <div class="bar-row">
      <div><strong>${escapeHtml(item.name)}</strong><span>${item.learners} learners | ${item.promoted} promoted</span></div>
      <div class="bar-track"><span style="width:${Math.max(4, item.average)}%"></span></div>
      <strong>${item.average}</strong>
    </div>
  `).join("");
}

function renderSummaryList(items) {
  return items.map((item) => `
    <article><div><strong>${escapeHtml(item.name)}</strong><span>${item.learners} learners</span></div><div><strong>${item.average}</strong><span>average</span></div><div><strong>${item.promoted}</strong><span>promoted</span></div></article>
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
        <div class="qr-box"><img src="/api/qr?code=${encodeURIComponent(student.verificationCode)}" alt="Report verification QR code"><small>${escapeHtml(student.verificationCode.slice(-6))}</small></div>
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
      <div class="report-table-scroll">
        <table class="report-table">
          <thead><tr><th>Subject</th><th>BOT</th><th>Mid</th><th>End</th><th>Final</th><th>Grade</th><th>Agg.</th><th>Rank</th><th>Teacher</th><th>Comment</th></tr></thead>
          <tbody>${student.subjects.map((subject) => `<tr><td>${escapeHtml(subject.subjectName)}</td><td>${valueOrDash(subject.bot)}</td><td>${valueOrDash(subject.mid)}</td><td>${valueOrDash(subject.end)}</td><td>${valueOrDash(subject.score)}</td><td>${subject.grade}</td><td>${valueOrDash(subject.aggregate)}</td><td>${valueOrDash(subject.subjectPosition)}</td><td>${escapeHtml(subject.teacherName)}</td><td>${escapeHtml(subject.comment)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
      <section class="kpi-strip">
        <div><span>Total Marks</span><strong>${student.total}</strong></div>
        <div><span>Average</span><strong>${student.average}</strong></div>
        <div><span>Grade</span><strong>${student.overallGrade}</strong></div>
        <div><span>Aggregate</span><strong>${student.aggregate}</strong></div>
        <div><span>Stream Pos.</span><strong>${student.streamPosition}</strong></div>
        <div><span>Class Pos.</span><strong>${student.classPosition}</strong></div>
        <div><span>Gender Pos.</span><strong>${student.genderPosition || "-"}</strong></div>
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
        <div class="chart-card"><h3>Attendance Analytics</h3><div class="donut" style="--value:${student.attendance}">${student.attendance}%</div><div class="attendance-facts"><span>${student.attendanceDays?.present || 0} present</span><span>${student.attendanceDays?.absent || 0} absent</span><span>${student.attendanceDays?.total || 0} days</span></div></div>
        <div class="chart-card"><h3>Competency Ratings</h3>${Object.entries(student.competencies || {}).map(([label, value]) => `<div class="rating-row"><span>${escapeHtml(label)}</span><strong class="rating-stars">${"&#9733;".repeat(Number(value || 0))}${"&#9734;".repeat(Math.max(0, 5 - Number(value || 0)))}</strong></div>`).join("")}</div>
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
        <div><h3>Class Teacher Comment</h3><p>${escapeHtml(student.reportComments?.classTeacher || "No comment recorded.")}</p></div>
        <div><h3>Director of Studies Comment</h3><p>${escapeHtml(student.reportComments?.dos || "No comment recorded.")}</p></div>
        <div><h3>Head Teacher Comment</h3><p>${escapeHtml(student.reportComments?.headTeacher || "No comment recorded.")}</p></div>
        <div><h3>Co-Curricular Activities</h3><p>${escapeHtml((student.activities?.length ? student.activities : db.activities).join(", "))}</p></div>
        <div><h3>Student Conduct</h3><p>${escapeHtml(student.conduct)}</p></div>
      </div>
      <section class="next-term-grid">
        <div><span>Next Term Opens</span><strong>${escapeHtml(db.nextTerm.openingDate || "-")}</strong></div>
        <div><span>Next Term Closes</span><strong>${escapeHtml(db.nextTerm.closingDate || "-")}</strong></div>
        <div><span>Fees / Account Note</span><strong>${escapeHtml(db.nextTerm.feesBalance || "-")}</strong></div>
        <div><span>Requirements</span><strong>${escapeHtml(db.nextTerm.requirements || "-")}</strong></div>
        <div><span>Special Notes</span><strong>${escapeHtml(db.nextTerm.specialNotes || "-")}</strong></div>
      </section>
      <h3 class="matrix-heading">Grading Matrix</h3>
      <div class="report-table-scroll">
        <table class="report-table grading-matrix">
          <thead><tr><th>Grade</th><th>Range</th><th>Aggregate</th><th>Comment</th></tr></thead>
          <tbody>${db.gradingScale.map((row) => `<tr><td>${row.grade}</td><td>${row.min}-${row.max}</td><td>${row.aggregate}</td><td>${escapeHtml(row.comment)}</td></tr>`).join("")}</tbody>
        </table>
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

async function saveSchoolProfile(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(els.schoolProfileForm).entries());
  await api("/api/school", { method: "POST", body: JSON.stringify(body) });
  toast("School profile saved");
  await loadData();
}

async function saveReportSettings(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  await api("/api/settings", {
    method: "POST",
    body: JSON.stringify({
      nextTerm: {
        openingDate: values.openingDate,
        closingDate: values.closingDate,
        feesBalance: values.feesBalance,
        requirements: values.requirements,
        specialNotes: values.specialNotes
      }
    })
  });
  toast("Report settings saved");
  await loadData();
}

async function saveStudent(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(els.studentForm).entries());
  body.admissionNo = body.admissionNo || body.studentId;
  body.classId = classIdFrom(body.classLevel, body.stream);
  const photoFile = els.newStudentPhotoInput.files[0];
  if (photoFile) body.photo = await compressImage(photoFile);
  await api("/api/students", { method: "POST", body: JSON.stringify(body) });
  els.studentForm.reset();
  toast("Student added");
  await loadData();
}

function downloadStudentTemplate() {
  const level = els.importClassLevelSelect.value || "P6";
  const stream = els.importStreamSelect.value || "East";
  const headers = ["Admission Number", "Student ID", "Full Name", "Gender", "Date of Birth", "Class", "Stream", "House", "Parent/Guardian", "Parent Contact", "Status", "Admission Date", "Attendance", "Notes"];
  const example = ["MJA-NEW-001", "MJA-NEW-001", "Student Full Name", "F", "2014-01-31", level, stream, "Blue", "Parent Name", "+256700000000", "Active", new Date().toISOString().slice(0, 10), "90", ""];
  downloadText(`${level}_${stream}_student_class_list.csv`, [headers, example].map((row) => row.map(csvCell).join(",")).join("\n"));
}

async function importStudentCsv(file) {
  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("The student CSV has no data rows");
  const headers = rows[0].map(normalizeCsvHeader);
  const index = Object.fromEntries(headers.map((header, position) => [header, position]));
  const admissionHeaders = ["admissionnumber", "admissionno", "admno"];
  const nameHeaders = ["fullname", "studentname", "name"];
  if (!admissionHeaders.some((header) => index[header] !== undefined) || !nameHeaders.some((header) => index[header] !== undefined)) {
    throw new Error("CSV must contain Admission Number and Full Name columns");
  }

  const students = rows.slice(1).map((row, rowIndex) => ({
    rowNumber: rowIndex + 2,
    admissionNo: csvValueAny(row, index, admissionHeaders),
    studentId: csvValueAny(row, index, ["studentid", "id"]) || csvValueAny(row, index, admissionHeaders),
    name: csvValueAny(row, index, nameHeaders),
    gender: csvValueAny(row, index, ["gender", "sex"]),
    dateOfBirth: csvValueAny(row, index, ["dateofbirth", "dob"]),
    classLevel: csvValueAny(row, index, ["class", "classlevel"]) || els.importClassLevelSelect.value,
    stream: csvValueAny(row, index, ["stream"]) || els.importStreamSelect.value,
    house: csvValueAny(row, index, ["house"]),
    guardian: csvValueAny(row, index, ["parentguardian", "guardian", "parentname"]),
    contact: csvValueAny(row, index, ["parentcontact", "contact", "phone", "phonenumber"]),
    status: csvValueAny(row, index, ["status"]) || "Active",
    admissionDate: csvValueAny(row, index, ["admissiondate", "dateofadmission"]),
    attendance: csvValueAny(row, index, ["attendance", "attendancepercent"]),
    notes: csvValueAny(row, index, ["notes", "remarks"])
  })).filter((student) => [
    student.admissionNo,
    student.studentId,
    student.name,
    student.gender,
    student.dateOfBirth,
    student.guardian,
    student.contact
  ].some((value) => String(value || "").trim()));

  try {
    const result = await api("/api/students", {
      method: "POST",
      body: JSON.stringify({
        action: "import",
        classLevel: els.importClassLevelSelect.value,
        stream: els.importStreamSelect.value,
        students
      })
    });
    latestStudentImportErrors = [];
    renderStudentImportErrors();
    els.studentCsvInput.value = "";
    els.studentImportSummary.textContent = `${result.created} students added, ${result.updated} existing records updated`;
    toast(`Imported ${result.total} student record(s)`);
    await loadData();
  } catch (error) {
    latestStudentImportErrors = error.payload?.errors || [errorRow("-", "-", "Import Failed", error.message)];
    renderStudentImportErrors();
    toast(`${latestStudentImportErrors.length} student import issue(s) found`);
  }
}

function renderStudentImportErrors() {
  const errors = latestStudentImportErrors;
  els.downloadStudentErrorsBtn.hidden = !errors.length;
  if (errors.length) els.studentImportSummary.textContent = `${errors.length} issue(s) must be corrected before import`;
  els.studentImportErrors.innerHTML = errors.map((error) => `
    <div class="error-item">
      <strong>${escapeHtml(error.errorType)}</strong>
      <span>Row ${escapeHtml(error.rowNumber || "-")} | ${escapeHtml(error.admissionNo || "-")} | ${escapeHtml(error.errorMessage)}</span>
    </div>
  `).join("");
}

function downloadStudentErrorReport() {
  const lines = ["Row,Admission Number,Error Type,Error Message"];
  for (const error of latestStudentImportErrors) lines.push([error.rowNumber || "", error.admissionNo || "", error.errorType, error.errorMessage].map(csvCell).join(","));
  downloadText("student_class_list_error_report.csv", lines.join("\n"));
}

function openStudentProfile(studentId) {
  selectedProfileStudentId = studentId;
  renderStudentProfile();
  window.history.replaceState(null, "", `#student/${encodeURIComponent(studentId)}`);
  navigateTo("studentProfile", "Student Profile");
}

async function updateProfilePhoto(event) {
  const file = event.target.files[0];
  if (!file || !selectedProfileStudentId) return;
  try {
    const photo = await compressImage(file);
    await api("/api/students", {
      method: "POST",
      body: JSON.stringify({ action: "updatePhoto", studentId: selectedProfileStudentId, photo })
    });
    toast("Student photo updated");
    await loadData();
  } catch (error) {
    toast(error.message || "Photo upload failed");
  }
}

async function saveStudentDetails(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  await api("/api/students", {
    method: "POST",
    body: JSON.stringify({
      action: "updateDetails",
      studentId: selectedProfileStudentId,
      guardian: values.guardian,
      contact: values.contact,
      alternativeContact: values.alternativeContact,
      notes: values.notes,
      activities: String(values.activities || "").split(",").map((item) => item.trim()).filter(Boolean),
      reportComments: {
        classTeacher: values.classTeacherComment,
        dos: values.dosComment,
        headTeacher: values.headTeacherComment
      },
      attendanceDays: {
        present: Number(values.present || 0),
        absent: Number(values.absent || 0),
        total: Number(values.total || 0)
      }
    })
  });
  toast("Student details updated");
  await loadData();
}

async function saveStudentMovement(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  body.studentId = selectedProfileStudentId;
  await api("/api/movements", { method: "POST", body: JSON.stringify(body) });
  toast("Student movement recorded");
  await loadData();
}

function openProfileAcademicReport() {
  const student = db.students.find((item) => item.id === selectedProfileStudentId);
  if (!student) return;
  selectedReportClassId = student.classId;
  selectedReportStudentId = student.id;
  reportMode = "student";
  renderReportSelect();
  renderReports();
  navigateTo("reports", "Reports");
}

function applyUrlRoute() {
  const studentMatch = window.location.hash.match(/^#student\/(.+)$/);
  if (studentMatch) {
    const studentId = decodeURIComponent(studentMatch[1]);
    if (db.students.some((item) => item.id === studentId)) openStudentProfile(studentId);
    return;
  }
}

async function verifyReport(event) {
  event?.preventDefault();
  const code = els.verificationCodeInput.value.trim();
  return runVerification(code, els.verificationContent);
}

async function verifyPublicReport(event) {
  event?.preventDefault();
  const code = els.publicVerificationCode.value.trim();
  return runVerification(code, els.publicVerificationContent);
}

async function runVerification(code, container) {
  if (!code) return;
  container.innerHTML = `<div class="empty-state">Checking the report...</div>`;
  try {
    const verified = await api(`/api/verify?code=${encodeURIComponent(code)}`);
    const student = verified.student;
    window.history.replaceState(null, "", `#verify/${encodeURIComponent(code)}`);
    container.innerHTML = `
      <section class="verified-banner"><strong>Verified Official Report</strong><span>Checked ${formatDate(verified.verifiedAt)}</span></section>
      <section class="verified-student-card">
        <div class="student-profile-photo">${student.photo ? `<img src="${escapeHtml(student.photo)}" alt="${escapeHtml(student.name)}">` : `<span>${escapeHtml(student.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join(""))}</span>`}</div>
        <div><span>${escapeHtml(student.admissionNo)}</span><h2>${escapeHtml(student.name)}</h2><p>${escapeHtml(student.className)} ${escapeHtml(student.stream)} | ${escapeHtml(verified.school.term)} ${escapeHtml(verified.school.academicYear)}</p></div>
        <div class="verified-score"><span>Average</span><strong>${student.average}</strong><small>${escapeHtml(student.overallGrade)}</small></div>
      </section>
      <section class="verified-summary-grid">
        <div><span>Class Position</span><strong>${student.classPosition}</strong></div>
        <div><span>Stream Position</span><strong>${student.streamPosition}</strong></div>
        <div><span>Aggregate</span><strong>${student.aggregate}</strong></div>
        <div><span>Promotion</span><strong>${escapeHtml(student.promotion)}</strong></div>
      </section>
      <section class="panel">
        <div class="panel-heading"><h2>Subject Results</h2><span>${escapeHtml(verified.school.name)}</span></div>
        <div class="verified-subject-list">${student.subjects.map((subject) => `<article><div><strong>${escapeHtml(subject.subjectName)}</strong><span>${escapeHtml(subject.teacherName)}</span></div><strong>${valueOrDash(subject.score)}</strong><span>${escapeHtml(subject.grade)}</span></article>`).join("")}</div>
      </section>
    `;
  } catch (error) {
    container.innerHTML = `<div class="verification-failed"><strong>Verification Failed</strong><span>${escapeHtml(error.message)}</span></div>`;
    throw error;
  }
}

async function signIn(event) {
  event.preventDefault();
  els.loginMessage.textContent = "Signing in...";
  try {
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const session = await api("/api/auth/login", { method: "POST", body: JSON.stringify(body) });
    currentUser = session.user;
    els.loginMessage.textContent = "";
    showStaffApp();
    await loadData();
  } catch (error) {
    els.loginMessage.textContent = error.message;
  }
}

async function createFirstAdmin(event) {
  event.preventDefault();
  els.loginMessage.textContent = "Creating the Super Admin account...";
  try {
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const session = await api("/api/auth/bootstrap", { method: "POST", body: JSON.stringify(body) });
    currentUser = session.user;
    els.loginMessage.textContent = "";
    showStaffApp();
    await loadData();
  } catch (error) {
    els.loginMessage.textContent = error.message;
  }
}

async function signOut() {
  await api("/api/auth/logout", { method: "POST", body: "{}" });
  db = null;
  results = null;
  showPublicPortal();
}

async function loadUsers() {
  if (currentUser?.role !== "Super Admin") return;
  staffUsers = await api("/api/users");
  renderUsers();
}

function renderUsers() {
  els.userCountLabel.textContent = `${staffUsers.length} user(s)`;
  els.userList.innerHTML = staffUsers.map((user) => `
    <article>
      <div><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(user.email)}</span></div>
      <div class="user-role-control">
        <select data-user-role="${escapeHtml(user.id)}">${["Super Admin", "School Admin", "Head Teacher", "DOS", "Class Teacher", "Subject Teacher", "Viewer"].map((role) => `<option ${role === user.role ? "selected" : ""}>${role}</option>`).join("")}</select>
        <button type="button" class="secondary save-user-role" data-user-id="${escapeHtml(user.id)}">Save Role</button>
      </div>
    </article>
  `).join("") || `<div class="empty-state">No staff accounts found.</div>`;
}

async function createStaffUser(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  await api("/api/users", { method: "POST", body: JSON.stringify(body) });
  event.currentTarget.reset();
  toast("Staff account created");
  await loadUsers();
}

async function saveUserRole(userId) {
  const role = document.querySelector(`[data-user-role="${userId}"]`)?.value;
  await api("/api/users", {
    method: "POST",
    body: JSON.stringify({ action: "updateRole", userId, role })
  });
  toast("User role updated");
  await loadUsers();
}

function compressImage(file) {
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("Select a valid image file"));
  if (file.size > 12_000_000) return Promise.reject(new Error("The original photo must be smaller than 12 MB"));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read the selected photo"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The selected photo could not be opened"));
      image.onload = () => {
        const maxSize = 720;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function saveMarks() {
  const context = marksContext();
  const marks = [...document.querySelectorAll(".score-input")]
    .filter((input) => input.value !== "")
    .map((input, index) => ({
      rowNumber: index + 2,
      studentId: input.dataset.studentId,
      admissionNo: input.dataset.admissionNo,
      score: Number(input.value),
      remarks: document.querySelector(`.remark-input[data-student-id="${input.dataset.studentId}"]`)?.value.trim() || ""
    }));
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
    marks.push({ rowNumber, studentId: student.id, admissionNo, score, remarks: String(row[9] || "").trim() });
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

function normalizeCsvHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function csvValue(row, index, header) {
  const position = index[header];
  return position === undefined ? "" : String(row[position] || "").trim();
}

function csvValueAny(row, index, headers) {
  for (const header of headers) {
    const value = csvValue(row, index, header);
    if (value !== "") return value;
  }
  return "";
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

document.querySelectorAll(".nav-button, .mobile-nav-button[data-view], .mobile-more-button").forEach((button) => {
  button.addEventListener("click", () => {
    navigateTo(button.dataset.view, button.textContent.trim());
  });
});
els.moreNavButton.addEventListener("click", openMobileMoreSheet);
els.closeMoreSheet.addEventListener("click", closeMobileMoreSheet);
els.mobileSheetBackdrop.addEventListener("click", closeMobileMoreSheet);
els.loginForm?.addEventListener("submit", signIn);
els.bootstrapForm?.addEventListener("submit", createFirstAdmin);
els.showBootstrapBtn?.addEventListener("click", () => {
  els.bootstrapForm.hidden = !els.bootstrapForm.hidden;
});
els.publicVerificationForm?.addEventListener("submit", (event) => verifyPublicReport(event).catch(() => {}));
els.logoutBtn?.addEventListener("click", signOut);
els.userForm?.addEventListener("submit", createStaffUser);
els.userList?.addEventListener("click", (event) => {
  const button = event.target.closest(".save-user-role");
  if (button) saveUserRole(button.dataset.userId).catch((error) => toast(error.message));
});

els.schoolProfileForm.addEventListener("submit", saveSchoolProfile);
els.reportSettingsForm?.addEventListener("submit", saveReportSettings);
els.studentForm.addEventListener("submit", saveStudent);
els.downloadStudentTemplateBtn.addEventListener("click", downloadStudentTemplate);
els.downloadStudentErrorsBtn.addEventListener("click", downloadStudentErrorReport);
els.studentCsvInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) importStudentCsv(file).catch((error) => toast(error.message));
});
els.studentRegisterBody.addEventListener("click", (event) => {
  const row = event.target.closest("[data-student-id]");
  if (row) openStudentProfile(row.dataset.studentId);
});
els.backToStudentsBtn.addEventListener("click", () => {
  window.history.replaceState(null, "", "#students");
  navigateTo("students", "Students");
});
els.studentProfileReportBtn.addEventListener("click", openProfileAcademicReport);
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
document.getElementById("refreshBtn").addEventListener("click", async () => {
  await loadData();
  toast(`Data refreshed at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
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
els.mobileReportDownloadBtn.addEventListener("click", printStudentReport);
els.verificationForm?.addEventListener("submit", verifyReport);
window.addEventListener("afterprint", () => {
  document.body.classList.remove("print-class", "print-student");
  reportMode = "student";
  renderReports();
});

initializeApp().catch((error) => {
  showPublicPortal();
  els.loginMessage.textContent = error.message;
});
