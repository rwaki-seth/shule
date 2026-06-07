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
let pendingStudentImport = null;
let pendingMarksImport = null;
let selectedAnalyticsClass = "";
let selectedAnalyticsStream = "All";

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
  studentImportModeSelect: document.getElementById("studentImportModeSelect"),
  studentCsvInput: document.getElementById("studentCsvInput"),
  downloadStudentTemplateBtn: document.getElementById("downloadStudentTemplateBtn"),
  downloadStudentErrorsBtn: document.getElementById("downloadStudentErrorsBtn"),
  uploadStudentCsvBtn: document.getElementById("uploadStudentCsvBtn"),
  cancelStudentImportBtn: document.getElementById("cancelStudentImportBtn"),
  studentImportSummary: document.getElementById("studentImportSummary"),
  studentImportErrors: document.getElementById("studentImportErrors"),
  studentImportPreview: document.getElementById("studentImportPreview"),
  studentImportPanel: document.getElementById("studentImportPanel"),
  studentCreatePanel: document.getElementById("studentCreatePanel"),
  newStudentPhotoInput: document.getElementById("newStudentPhotoInput"),
  studentCountLabel: document.getElementById("studentCountLabel"),
  studentRegisterBody: document.getElementById("studentRegisterBody"),
  studentFilterClassSelect: document.getElementById("studentFilterClassSelect"),
  studentFilterStreamSelect: document.getElementById("studentFilterStreamSelect"),
  downloadStudentListBtn: document.getElementById("downloadStudentListBtn"),
  studentProfileContent: document.getElementById("studentProfileContent"),
  backToStudentsBtn: document.getElementById("backToStudentsBtn"),
  studentProfileReportBtn: document.getElementById("studentProfileReportBtn"),
  marksAcademicYearSelect: document.getElementById("marksAcademicYearSelect"),
  marksTermSelect: document.getElementById("marksTermSelect"),
  marksExamTypeSelect: document.getElementById("marksExamTypeSelect"),
  marksClassLevelSelect: document.getElementById("marksClassLevelSelect"),
  marksStreamSelect: document.getElementById("marksStreamSelect"),
  marksTeacherSelect: document.getElementById("marksTeacherSelect"),
  marksImportModeSelect: document.getElementById("marksImportModeSelect"),
  subjectSelect: document.getElementById("subjectSelect"),
  marksBody: document.getElementById("marksBody"),
  saveMarksBtn: document.getElementById("saveMarksBtn"),
  csvInput: document.getElementById("csvInput"),
  downloadTemplateBtn: document.getElementById("downloadTemplateBtn"),
  downloadErrorsBtn: document.getElementById("downloadErrorsBtn"),
  uploadMarksCsvBtn: document.getElementById("uploadMarksCsvBtn"),
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
  analyticsClassSelect: document.getElementById("analyticsClassSelect"),
  analyticsStreamSelect: document.getElementById("analyticsStreamSelect"),
  analyticsLearnerList: document.getElementById("analyticsLearnerList"),
  analyticsDrillTitle: document.getElementById("analyticsDrillTitle"),
  downloadAnalyticsLearnersBtn: document.getElementById("downloadAnalyticsLearnersBtn"),
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
  teacherAssignmentForm: document.getElementById("teacherAssignmentForm"),
  assignmentTeacherSelect: document.getElementById("assignmentTeacherSelect"),
  assignmentClassSelect: document.getElementById("assignmentClassSelect"),
  assignmentSubjectSelect: document.getElementById("assignmentSubjectSelect"),
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
    currentUser = db.currentUser || currentUser;
    if (currentUser) {
      els.currentUserRole.textContent = `${currentUser.name} | ${currentUser.role}`;
      applyRoleAccess();
      if (currentUser.assignmentWarning) toast(currentUser.assignmentWarning);
    }
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
  const canManageStudents = hasRole("Super Admin", "School Admin");
  if (els.studentImportPanel) els.studentImportPanel.hidden = !canManageStudents;
  if (els.studentCreatePanel) els.studentCreatePanel.hidden = !canManageStudents;
  if (els.teacherAssignmentForm) els.teacherAssignmentForm.hidden = !canManageStudents;
  if (els.marksImportModeSelect) {
    const multiOption = els.marksImportModeSelect.querySelector('option[value="multi"]');
    if (multiOption) multiOption.disabled = !canManageStudents;
    if (!canManageStudents) els.marksImportModeSelect.value = "single";
  }
  if (els.studentProfileReportBtn) els.studentProfileReportBtn.hidden = !allowed.has("reports");
}

function hasRole(...roles) {
  return roles.includes(currentUser?.role);
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
  const allowedLevels = [...new Set(db.classes.map((item) => item.level))];
  const allowedStreams = [...new Set(db.classes.map((item) => item.stream))];
  const levels = allowedLevels.map((name) => `<option value="${name}">${escapeHtml(name)}</option>`).join("");
  const streams = allowedStreams.map((name) => `<option value="${name}">${escapeHtml(name)}</option>`).join("");
  const subjects = db.subjects.map((subject) => `<option value="${subject.id}">${escapeHtml(subject.code)} - ${escapeHtml(subject.name)}</option>`).join("");
  const teachers = db.teachers.map((teacher) => `<option value="${teacher.id}">${escapeHtml(teacher.name)} (${escapeHtml(teacher.role)})</option>`).join("");
  const teacherRole = hasRole("Class Teacher", "Subject Teacher");
  const markSubjectRows = teacherRole
    ? db.subjects.filter((subject) => currentUser.assignedSubjectIds?.includes(subject.id))
    : db.subjects;
  const markTeacherRows = teacherRole
    ? db.teachers.filter((teacher) => teacher.id === currentUser.teacherId)
    : db.teachers;
  const markSubjects = markSubjectRows.map((subject) => `<option value="${subject.id}">${escapeHtml(subject.code)} - ${escapeHtml(subject.name)}</option>`).join("");
  const markTeachers = markTeacherRows.map((teacher) => `<option value="${teacher.id}">${escapeHtml(teacher.name)} (${escapeHtml(teacher.role)})</option>`).join("");

  setOptions(els.studentClassLevelSelect, levels, allowedLevels[0]);
  setOptions(els.studentStreamSelect, streams, allowedStreams[0]);
  setOptions(els.importClassLevelSelect, levels, allowedLevels[0]);
  setOptions(els.importStreamSelect, streams, allowedStreams[0]);
  els.studentStatusSelect.innerHTML = STATUS_OPTIONS.map((status) => `<option>${status}</option>`).join("");
  setOptions(els.studentFilterClassSelect, `<option value="All">All classes</option>${levels}`, "All");
  setOptions(els.studentFilterStreamSelect, `<option value="All">All streams</option>${streams}`, "All");

  setOptions(els.marksAcademicYearSelect, years, db.school.academicYear);
  setOptions(els.marksTermSelect, terms, db.school.term);
  setOptions(els.marksExamTypeSelect, exams, db.school.exam);
  setOptions(els.marksClassLevelSelect, levels, allowedLevels[0]);
  updateMarksStreamOptions();
  setOptions(els.subjectSelect, markSubjects, markSubjectRows[0]?.id);
  setOptions(els.marksTeacherSelect, markTeachers, currentUser?.teacherId || assignedTeacherId(currentMarksClassId(), els.subjectSelect.value) || markTeacherRows[0]?.id);
  els.marksTeacherSelect.disabled = teacherRole;
  updateMarksSubjectOptions();

  for (const id of ["deadlineAcademicYearSelect", "deadlineTermSelect", "deadlineExamTypeSelect", "deadlineClassLevelSelect", "deadlineStreamSelect", "deadlineSubjectSelect", "deadlineTeacherSelect"]) {
    const element = document.getElementById(id);
    if (!element) continue;
    if (id.includes("AcademicYear")) setOptions(element, years, db.school.academicYear);
    if (id.includes("Term")) setOptions(element, terms, db.school.term);
    if (id.includes("ExamType")) setOptions(element, exams, db.school.exam);
    if (id.includes("ClassLevel")) setOptions(element, levels, allowedLevels[0]);
    if (id.includes("Stream")) setOptions(element, streams, allowedStreams[0]);
    if (id.includes("Subject")) setOptions(element, subjects, "eng");
    if (id.includes("Teacher")) setOptions(element, teachers, assignedTeacherId("p6-east", "eng") || db.teachers[0]?.id);
  }

  setOptions(els.assignmentTeacherSelect, teachers, db.teachers[0]?.id);
  setOptions(els.assignmentClassSelect, db.classes.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join(""), db.classes[0]?.id);
  setOptions(els.assignmentSubjectSelect, subjects, db.subjects[0]?.id);
  updateStudentImportMode();
}

function setOptions(element, html, selectedValue) {
  if (!element) return;
  const previous = element.value;
  element.innerHTML = html;
  const available = [...element.options].map((option) => option.value);
  element.value = available.includes(previous)
    ? previous
    : available.includes(String(selectedValue ?? ""))
      ? String(selectedValue)
      : element.options[0]?.value || "";
}

function updateMarksStreamOptions() {
  const level = els.marksClassLevelSelect.value || db.classes[0]?.level;
  const rows = db.classes.filter((item) => item.level === level);
  setOptions(
    els.marksStreamSelect,
    rows.map((item) => `<option value="${item.stream}">${escapeHtml(item.stream)}</option>`).join(""),
    rows[0]?.stream
  );
}

function updateMarksSubjectOptions() {
  if (!hasRole("Class Teacher", "Subject Teacher")) return;
  const classId = currentMarksClassId();
  const subjectIds = new Set(db.teacherAssignments
    .filter((item) => item.teacherId === currentUser.teacherId && item.classId === classId && item.active !== false)
    .map((item) => item.subjectId));
  const rows = db.subjects.filter((subject) => subjectIds.has(subject.id));
  setOptions(
    els.subjectSelect,
    rows.map((subject) => `<option value="${subject.id}">${escapeHtml(subject.code)} - ${escapeHtml(subject.name)}</option>`).join(""),
    rows[0]?.id
  );
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
  const students = visibleRegisterStudents();
  const active = students.filter((student) => student.status === "Active").length;
  els.studentCountLabel.textContent = `${students.length} shown | ${active} active`;
  els.studentRegisterBody.innerHTML = students.map((student) => {
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
  }).join("") || `<tr><td colspan="10">No learners match the selected class and stream.</td></tr>`;
  decorateMobileTables();
}

function visibleRegisterStudents() {
  const classLevel = els.studentFilterClassSelect?.value || "All";
  const stream = els.studentFilterStreamSelect?.value || "All";
  return db.students
    .filter((student) => {
      const classInfo = classById(student.classId) || {};
      return (classLevel === "All" || (classInfo.level || student.classLevel) === classLevel) &&
        (stream === "All" || (classInfo.stream || student.stream) === stream);
    })
    .sort((a, b) => {
      const aClass = classById(a.classId)?.name || "";
      const bClass = classById(b.classId)?.name || "";
      return aClass.localeCompare(bClass) || a.name.localeCompare(b.name);
    });
}

function downloadVisibleStudentList() {
  const students = visibleRegisterStudents();
  if (!students.length) return toast("No learners are available to download");
  const lines = [["Admission Number", "Student ID", "Full Name", "Gender", "Class", "Stream", "Status", "Parent/Guardian", "Parent Contact"]];
  for (const student of students) {
    const classInfo = classById(student.classId) || {};
    lines.push([
      student.admissionNo,
      student.studentId,
      student.name,
      student.gender,
      classInfo.level || student.classLevel,
      classInfo.stream || student.stream,
      student.status,
      student.guardian,
      student.contact
    ]);
  }
  downloadText("visible_student_list.csv", lines.map((row) => row.map(csvCell).join(",")).join("\n"));
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
  const canManageStudent = hasRole("Super Admin", "School Admin");
  els.studentProfileContent.innerHTML = `
    <section class="student-profile-hero">
      <div class="student-profile-photo">
        ${student.photo ? `<img src="${escapeHtml(student.photo)}" alt="${escapeHtml(student.name)}">` : `<span>${escapeHtml(initials || "ST")}</span>`}
      </div>
      <div class="student-profile-identity">
        <span class="eyebrow">${escapeHtml(student.admissionNo)}</span>
        <h2>${escapeHtml(student.name)}</h2>
        <p>${escapeHtml(classInfo.name || `${student.classLevel} ${student.stream}`)} · ${escapeHtml(student.status)}</p>
        ${canManageStudent ? `<label class="profile-photo-upload">Replace Student Photo
          <input id="profilePhotoInput" type="file" accept="image/*">
        </label>` : ""}
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
    ${renderStudentProfileWorkspace(student, attendance, classOptions)}
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

function renderStudentProfileWorkspace(student, attendance, classOptions) {
  if (hasRole("Super Admin", "School Admin")) {
    return `
      <section class="profile-workspace-grid">
        <form id="studentDetailsForm" class="profile-form panel">
          <div class="panel-heading"><h3>Attendance, Contacts & Comments</h3><span>Maintain the learner's current record</span></div>
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
      </section>`;
  }

  const editable = hasRole("Class Teacher")
    ? ["classTeacher", "Class Teacher Comment"]
    : hasRole("DOS")
      ? ["dos", "Director of Studies Comment"]
      : hasRole("Head Teacher")
        ? ["headTeacher", "Head Teacher Comment"]
        : null;
  if (!editable) {
    return `<section class="panel role-guidance"><strong>Read-only learner profile</strong><span>Subject remarks are updated from Marks Upload for your assigned subject and classes.</span></section>`;
  }
  const [field, label] = editable;
  return `
    <section class="profile-workspace-grid single-editor">
      <form id="studentDetailsForm" class="profile-form panel">
        <div class="panel-heading"><h3>${escapeHtml(label)}</h3><span>This comment is specific to ${escapeHtml(student.name)}</span></div>
        <label>${escapeHtml(label)} <textarea name="${field}Comment">${escapeHtml(student.reportComments?.[field] || "")}</textarea></label>
        <button type="submit">Save Comment</button>
      </form>
    </section>`;
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
  renderAnalyticsDrilldown();
}

function renderSummaryBars(items) {
  return items.map((item) => `
    <button type="button" class="bar-row analytics-class-row" data-analytics-class="${escapeHtml(item.name)}">
      <div><strong>${escapeHtml(item.name)}</strong><span>${item.learners} learners | ${item.promoted} promoted</span></div>
      <div class="bar-track"><span style="width:${Math.max(4, item.average)}%"></span></div>
      <strong>${item.average}</strong>
    </button>
  `).join("");
}

function renderSummaryList(items) {
  return items.map((item) => `
    <article><div><strong>${escapeHtml(item.name)}</strong><span>${item.learners} learners</span></div><div><strong>${item.average}</strong><span>average</span></div><div><strong>${item.promoted}</strong><span>promoted</span></div></article>
  `).join("");
}

function renderAnalyticsDrilldown() {
  const classes = [...new Set(results.students.map((student) => student.className))].sort();
  if (!classes.includes(selectedAnalyticsClass)) selectedAnalyticsClass = classes[0] || "";
  setOptions(
    els.analyticsClassSelect,
    classes.map((name) => `<option value="${name}">${escapeHtml(name)}</option>`).join(""),
    selectedAnalyticsClass
  );
  selectedAnalyticsClass = els.analyticsClassSelect.value;
  const streams = [...new Set(results.students
    .filter((student) => student.className === selectedAnalyticsClass)
    .map((student) => student.stream))].sort();
  if (selectedAnalyticsStream !== "All" && !streams.includes(selectedAnalyticsStream)) selectedAnalyticsStream = "All";
  setOptions(
    els.analyticsStreamSelect,
    `<option value="All">All streams</option>${streams.map((name) => `<option value="${name}">${escapeHtml(name)}</option>`).join("")}`,
    selectedAnalyticsStream
  );
  selectedAnalyticsStream = els.analyticsStreamSelect.value;
  const learners = analyticsDrillLearners();
  els.analyticsDrillTitle.textContent = `${selectedAnalyticsClass || "Class"} ${selectedAnalyticsStream === "All" ? "" : selectedAnalyticsStream} Learners`.trim();
  els.analyticsLearnerList.innerHTML = learners.map((student) => `
    <article>
      <div><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.admissionNo)} | ${escapeHtml(student.className)} ${escapeHtml(student.stream)}</span></div>
      <div><span>Average</span><strong>${student.average}</strong></div>
      <div><span>Position</span><strong>${student.streamPosition || student.classPosition || "-"}</strong></div>
      <button type="button" class="secondary analytics-student-view" data-student-id="${escapeHtml(student.id)}">View</button>
    </article>
  `).join("") || `<div class="empty-state">No learners found for this class and stream.</div>`;
}

function analyticsDrillLearners() {
  return results.students
    .filter((student) => student.className === selectedAnalyticsClass && (selectedAnalyticsStream === "All" || student.stream === selectedAnalyticsStream))
    .sort((a, b) => a.stream.localeCompare(b.stream) || a.streamPosition - b.streamPosition || a.name.localeCompare(b.name));
}

function downloadAnalyticsLearners() {
  const learners = analyticsDrillLearners();
  if (!learners.length) return toast("No learners are available to download");
  const rows = [["Admission Number", "Student Name", "Class", "Stream", "Average", "Aggregate", "Class Position", "Stream Position", "Promotion"]];
  for (const student of learners) {
    rows.push([student.admissionNo, student.name, student.className, student.stream, student.average, student.aggregate, student.classPosition, student.streamPosition, student.promotion]);
  }
  downloadText(`${selectedAnalyticsClass}_${selectedAnalyticsStream}_learners.csv`, rows.map((row) => row.map(csvCell).join(",")).join("\n"));
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

async function saveTeacherAssignment(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  await api("/api/teacher-assignments", { method: "POST", body: JSON.stringify(body) });
  toast("Teacher assignment saved");
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
  const examples = els.studentImportModeSelect.value === "multi"
    ? [
        ["MJA-NEW-001", "MJA-NEW-001", "First Student", "F", "2014-01-31", "P6", "East", "Blue", "Parent Name", "+256700000000", "Active", new Date().toISOString().slice(0, 10), "90", ""],
        ["MJA-NEW-002", "MJA-NEW-002", "Second Student", "M", "2015-04-18", "P5", "West", "Red", "Parent Name", "+256700000001", "Active", new Date().toISOString().slice(0, 10), "92", ""]
      ]
    : [["MJA-NEW-001", "MJA-NEW-001", "Student Full Name", "F", "2014-01-31", level, stream, "Blue", "Parent Name", "+256700000000", "Active", new Date().toISOString().slice(0, 10), "90", ""]];
  const filename = els.studentImportModeSelect.value === "multi"
    ? "all_classes_student_import.csv"
    : `${level}_${stream}_student_class_list.csv`;
  downloadText(filename, [headers, ...examples].map((row) => row.map(csvCell).join(",")).join("\n"));
}

async function importStudentCsv(file) {
  cancelPendingStudentImport(false);
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

  const mixedClasses = els.studentImportModeSelect.value === "multi";
  const students = rows.slice(1).map((row, rowIndex) => ({
    rowNumber: rowIndex + 2,
    admissionNo: csvValueAny(row, index, admissionHeaders),
    studentId: csvValueAny(row, index, ["studentid", "id"]) || csvValueAny(row, index, admissionHeaders),
    name: csvValueAny(row, index, nameHeaders),
    gender: csvValueAny(row, index, ["gender", "sex"]),
    dateOfBirth: csvValueAny(row, index, ["dateofbirth", "dob"]),
    classLevel: csvValueAny(row, index, ["class", "classlevel"]) || (mixedClasses ? "" : els.importClassLevelSelect.value),
    stream: csvValueAny(row, index, ["stream"]) || (mixedClasses ? "" : els.importStreamSelect.value),
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

  const request = {
    action: "previewImport",
    mixedClasses,
    classLevel: mixedClasses ? "" : els.importClassLevelSelect.value,
    stream: mixedClasses ? "" : els.importStreamSelect.value,
    students
  };

  try {
    const result = await api("/api/students", {
      method: "POST",
      body: JSON.stringify(request)
    });
    pendingStudentImport = { fileName: file.name, request: { ...request, action: "import" }, preview: result };
    latestStudentImportErrors = [];
    renderStudentImportErrors();
    els.studentImportSummary.textContent = `${file.name}: ${result.total} valid row(s), ${result.created} new, ${result.updated} updates. Nothing uploaded yet.`;
    els.uploadStudentCsvBtn.disabled = false;
    els.cancelStudentImportBtn.hidden = false;
    renderStudentImportPreview(result);
    toast("Student file validated. Review it, then click Upload Students.");
  } catch (error) {
    latestStudentImportErrors = error.payload?.errors || [errorRow("-", "-", "Import Failed", error.message)];
    renderStudentImportErrors();
    renderStudentImportPreview(null);
    toast(`${latestStudentImportErrors.length} student import issue(s) found`);
  }
}

async function uploadPendingStudentImport() {
  if (!pendingStudentImport) return toast("Choose and validate a student CSV first");
  els.uploadStudentCsvBtn.disabled = true;
  els.uploadStudentCsvBtn.textContent = "Uploading...";
  try {
    const result = await api("/api/students", {
      method: "POST",
      body: JSON.stringify(pendingStudentImport.request)
    });
    toast(`Uploaded ${result.total} student record(s)`);
    cancelPendingStudentImport();
    await loadData();
  } catch (error) {
    latestStudentImportErrors = error.payload?.errors || [errorRow("-", "-", "Import Failed", error.message)];
    renderStudentImportErrors();
  } finally {
    els.uploadStudentCsvBtn.textContent = "Upload Students";
    els.uploadStudentCsvBtn.disabled = !pendingStudentImport;
  }
}

function renderStudentImportPreview(result) {
  if (!result?.preview?.length) {
    els.studentImportPreview.innerHTML = "";
    return;
  }
  const breakdown = result.classBreakdown.map((item) => `${item.className}: ${item.count}`).join(" | ");
  els.studentImportPreview.innerHTML = `
    <div class="preview-heading"><strong>Ready for upload</strong><span>${escapeHtml(breakdown)}</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Action</th><th>Admission No.</th><th>Name</th><th>Class</th><th>Stream</th></tr></thead>
        <tbody>${result.preview.map((row) => `<tr><td>${escapeHtml(row.action)}</td><td>${escapeHtml(row.admissionNo)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.classLevel)}</td><td>${escapeHtml(row.stream)}</td></tr>`).join("")}</tbody>
      </table>
    </div>
    ${result.total > result.preview.length ? `<small>Showing the first ${result.preview.length} of ${result.total} rows.</small>` : ""}`;
  decorateMobileTables();
}

function cancelPendingStudentImport(clearFile = true) {
  pendingStudentImport = null;
  latestStudentImportErrors = [];
  els.uploadStudentCsvBtn.disabled = true;
  els.cancelStudentImportBtn.hidden = true;
  els.studentImportSummary.textContent = "No class list selected";
  els.studentImportPreview.innerHTML = "";
  els.studentImportErrors.innerHTML = "";
  els.downloadStudentErrorsBtn.hidden = true;
  if (clearFile) els.studentCsvInput.value = "";
}

function updateStudentImportMode() {
  if (!els.studentImportModeSelect) return;
  const mixed = els.studentImportModeSelect.value === "multi";
  document.querySelectorAll(".student-import-default").forEach((label) => {
    label.hidden = mixed;
  });
  cancelPendingStudentImport();
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
  const body = { action: "updateDetails", studentId: selectedProfileStudentId };
  const reportComments = {};
  if (values.classTeacherComment !== undefined) reportComments.classTeacher = values.classTeacherComment;
  if (values.dosComment !== undefined) reportComments.dos = values.dosComment;
  if (values.headTeacherComment !== undefined) reportComments.headTeacher = values.headTeacherComment;
  if (Object.keys(reportComments).length) body.reportComments = reportComments;
  if (hasRole("Super Admin", "School Admin")) {
    Object.assign(body, {
      guardian: values.guardian,
      contact: values.contact,
      alternativeContact: values.alternativeContact,
      notes: values.notes,
      activities: String(values.activities || "").split(",").map((item) => item.trim()).filter(Boolean),
      attendanceDays: {
        present: Number(values.present || 0),
        absent: Number(values.absent || 0),
        total: Number(values.total || 0)
      }
    });
  }
  await api("/api/students", {
    method: "POST",
    body: JSON.stringify(body)
  });
  toast(hasRole("Super Admin", "School Admin") ? "Student details updated" : "Student comment updated");
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
  await loadData();
}

async function saveUserRole(userId) {
  const role = document.querySelector(`[data-user-role="${userId}"]`)?.value;
  await api("/api/users", {
    method: "POST",
    body: JSON.stringify({ action: "updateRole", userId, role })
  });
  toast("User role updated");
  await loadData();
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
  const lines = ["Academic Year,Term,Exam Type,Class,Stream,Subject,Admission Number,Student Name,Mark,Remarks"];
  const multi = els.marksImportModeSelect.value === "multi";
  const eligibleClassIds = multi
    ? new Set(db.teacherAssignments
      .filter((item) => item.teacherId === context.teacherId && item.subjectId === context.subjectId && item.active !== false)
      .map((item) => item.classId))
    : new Set([context.classId]);
  const learners = db.students.filter((student) => student.status === "Active" && eligibleClassIds.has(student.classId));
  for (const student of learners) {
    const classInfo = classById(student.classId);
    lines.push([context.academicYear, context.term, context.examType, classInfo.level, classInfo.stream, subject.name, student.admissionNo, student.name, "", ""].map(csvCell).join(","));
  }
  const scope = multi ? "multiple_classes" : classById(context.classId)?.name || "class";
  downloadText(`${context.academicYear}_${context.term}_${context.examType}_${scope}_${subject.code}_template.csv`, lines.join("\n"));
}

async function importCsv(file) {
  cancelPendingMarksImport(false);
  const context = marksContext();
  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("The marks CSV has no data rows");
  const headers = rows[0].map(normalizeCsvHeader);
  const headerIndex = Object.fromEntries(headers.map((header, position) => [header, position]));
  const errors = [];
  const groupedMarks = new Map();
  const seen = new Set();
  rows.slice(1).forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const multi = els.marksImportModeSelect.value === "multi";
    const classText = multi ? csvValueAny(row, headerIndex, ["class", "classlevel"]) : els.marksClassLevelSelect.value;
    const streamText = multi ? csvValueAny(row, headerIndex, ["stream"]) : els.marksStreamSelect.value;
    const admissionNo = csvValueAny(row, headerIndex, ["admissionnumber", "admissionno", "admno"]);
    const markValue = csvValueAny(row, headerIndex, ["mark", "score", "final"]);
    const rowSubject = csvValueAny(row, headerIndex, ["subject", "subjectname"]);
    const classInfo = findClassByNames(classText, streamText);
    if (!classInfo) return errors.push(errorRow(rowNumber, admissionNo, "Invalid Class/Stream", "Class and stream must match a configured school class"));
    if (rowSubject && ![subjectById(context.subjectId)?.name, subjectById(context.subjectId)?.code].some((value) => String(value || "").toLowerCase() === rowSubject.toLowerCase())) {
      return errors.push(errorRow(rowNumber, admissionNo, "Wrong Subject", `Row subject must be ${subjectById(context.subjectId)?.name}`));
    }
    const student = db.students.find((item) => item.admissionNo === admissionNo);
    if (!student) return errors.push(errorRow(rowNumber, admissionNo, "Missing Student", "Admission number does not exist"));
    if (student.classId !== classInfo.id) return errors.push(errorRow(rowNumber, admissionNo, "Wrong Class/Stream", "Learner is not in the class and stream stated in the file"));
    const duplicateKey = `${classInfo.id}:${admissionNo}`;
    if (seen.has(duplicateKey)) return errors.push(errorRow(rowNumber, admissionNo, "Duplicate Mark", "Learner appears twice in the file"));
    if (markValue === "") return errors.push(errorRow(rowNumber, admissionNo, "Missing Mark", "Mark is required"));
    const score = Number(markValue);
    if (!Number.isFinite(score) || score < 0 || score > 100) return errors.push(errorRow(rowNumber, admissionNo, "Mark Range", "Mark must be between 0 and 100"));
    if (!isTeacherAssigned(context.teacherId, classInfo.id, context.subjectId)) {
      return errors.push(errorRow(rowNumber, admissionNo, "Teacher Assignment", `Selected teacher is not assigned to ${classInfo.name} for this subject`));
    }
    seen.add(duplicateKey);
    if (!groupedMarks.has(classInfo.id)) groupedMarks.set(classInfo.id, []);
    groupedMarks.get(classInfo.id).push({
      rowNumber,
      studentId: student.id,
      admissionNo,
      score,
      remarks: csvValueAny(row, headerIndex, ["remarks", "comment", "teacherremark"])
    });
  });
  latestUploadErrors = errors;
  renderUploadErrors();
  if (errors.length) return toast(`${errors.length} upload error(s) found`);
  const batches = [...groupedMarks].map(([classId, marks]) => ({ ...context, classId, marks }));
  const total = batches.reduce((sum, batch) => sum + batch.marks.length, 0);
  pendingMarksImport = {
    fileName: file.name,
    body: els.marksImportModeSelect.value === "multi"
      ? { mode: "multi", ...context, batches }
      : batches[0]
  };
  els.uploadMarksCsvBtn.disabled = false;
  els.uploadSummary.textContent = `${file.name}: ${total} valid mark(s) across ${batches.length} class(es). Nothing uploaded yet.`;
  toast("Marks file validated. Click Upload Validated CSV to save it.");
}

async function uploadPendingMarksCsv() {
  if (!pendingMarksImport) return toast("Choose and validate a marks CSV first");
  els.uploadMarksCsvBtn.disabled = true;
  els.uploadMarksCsvBtn.textContent = "Uploading...";
  try {
    const response = await api("/api/marks", { method: "POST", body: JSON.stringify(pendingMarksImport.body) });
    const saved = response.results?.counts?.marks ?? "";
    toast(saved === "" ? "Marks uploaded" : "Validated marks uploaded");
    cancelPendingMarksImport();
    await loadData();
  } catch (error) {
    latestUploadErrors = error.payload?.errors || [errorRow("-", "-", "Upload Failed", error.message)];
    renderUploadErrors();
  } finally {
    els.uploadMarksCsvBtn.textContent = "Upload Validated CSV";
    els.uploadMarksCsvBtn.disabled = !pendingMarksImport;
  }
}

function cancelPendingMarksImport(clearFile = true) {
  pendingMarksImport = null;
  els.uploadMarksCsvBtn.disabled = true;
  if (clearFile) els.csvInput.value = "";
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

function findClassByNames(level, stream) {
  const normalizedLevel = String(level || "").trim().toLowerCase();
  const normalizedStream = String(stream || "").trim().toLowerCase();
  return db.classes.find((item) =>
    String(item.level || "").toLowerCase() === normalizedLevel &&
    String(item.stream || "").toLowerCase() === normalizedStream
  );
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
els.teacherAssignmentForm?.addEventListener("submit", saveTeacherAssignment);
els.studentForm.addEventListener("submit", saveStudent);
els.downloadStudentTemplateBtn.addEventListener("click", downloadStudentTemplate);
els.downloadStudentErrorsBtn.addEventListener("click", downloadStudentErrorReport);
els.uploadStudentCsvBtn.addEventListener("click", uploadPendingStudentImport);
els.cancelStudentImportBtn.addEventListener("click", () => cancelPendingStudentImport());
els.studentImportModeSelect.addEventListener("change", updateStudentImportMode);
els.studentCsvInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) importStudentCsv(file).catch((error) => toast(error.message));
});
els.studentFilterClassSelect.addEventListener("change", renderStudents);
els.studentFilterStreamSelect.addEventListener("change", renderStudents);
els.downloadStudentListBtn.addEventListener("click", downloadVisibleStudentList);
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
  els.subjectSelect
].forEach((element) => element.addEventListener("change", renderMarksEntry));
els.marksClassLevelSelect.addEventListener("change", () => {
  updateMarksStreamOptions();
  updateMarksSubjectOptions();
  renderMarksEntry();
});
els.marksStreamSelect.addEventListener("change", () => {
  updateMarksSubjectOptions();
  renderMarksEntry();
});
els.marksImportModeSelect.addEventListener("change", () => {
  cancelPendingMarksImport();
  els.uploadSummary.textContent = "No file selected";
});
els.saveMarksBtn.addEventListener("click", saveMarks);
els.downloadTemplateBtn.addEventListener("click", downloadCsvTemplate);
els.downloadErrorsBtn.addEventListener("click", downloadErrorReport);
els.uploadMarksCsvBtn.addEventListener("click", uploadPendingMarksCsv);
els.csvInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) importCsv(file).catch((error) => toast(error.message));
});
els.deadlineForm.addEventListener("submit", saveDeadline);
els.approvePromotionBtn.addEventListener("click", approvePromotion);
els.classComparisonBars.addEventListener("click", (event) => {
  const row = event.target.closest("[data-analytics-class]");
  if (!row) return;
  selectedAnalyticsClass = row.dataset.analyticsClass;
  selectedAnalyticsStream = "All";
  renderAnalyticsDrilldown();
  document.querySelector(".analytics-drill-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
});
els.analyticsClassSelect.addEventListener("change", () => {
  selectedAnalyticsClass = els.analyticsClassSelect.value;
  selectedAnalyticsStream = "All";
  renderAnalyticsDrilldown();
});
els.analyticsStreamSelect.addEventListener("change", () => {
  selectedAnalyticsStream = els.analyticsStreamSelect.value;
  renderAnalyticsDrilldown();
});
els.analyticsLearnerList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-student-id]");
  if (button) openStudentProfile(button.dataset.studentId);
});
els.downloadAnalyticsLearnersBtn.addEventListener("click", downloadAnalyticsLearners);
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
