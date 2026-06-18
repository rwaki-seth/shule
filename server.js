const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const {
  bootstrapAvailable,
  bootstrapSuperAdmin,
  clearSessionCookies,
  createUser,
  getSession,
  listUsers,
  login,
  requireRoles,
  requireSession,
  updateUserRole
} = require("./api/_lib/auth");
const {
  addStudent,
  addMovement,
  archiveReports,
  ensureTeacher,
  importStudents,
  isDuplicateMark,
  approvePromotion,
  assessmentWorkflowFor,
  audit,
  calculateResults,
  loadDb,
  saveDb,
  saveDeadline,
  saveTeacherAssignment,
  sendError,
  sendJson,
  signedStorageUrl,
  storageMode,
  storageStatus,
  listAudit,
  listMarks,
  listReportArchive,
  listStudents,
  transitionAssessmentWorkflow,
  updateSettings,
  updateStudentDetails,
  secureStudentPhoto,
  upsertMark,
  validateMarks,
  verifiedReport,
  rollbackPromotion
} = require("./api/_lib/shule");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const TEACHER_ROLES = new Set(["Class Teacher", "Subject Teacher"]);
const SCHOOL_ADMIN_ROLES = ["Super Admin", "School Admin"];
const RATE_WINDOWS = new Map();

function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
}

function requestIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
}

function enforceRateLimit(req, key, limit, windowMs) {
  const now = Date.now();
  const bucketKey = `${key}:${requestIp(req)}`;
  const current = RATE_WINDOWS.get(bucketKey);
  if (!current || current.resetAt <= now) {
    RATE_WINDOWS.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) {
    const error = new Error("Too many requests. Please wait and try again.");
    error.statusCode = 429;
    throw error;
  }
}

function validateMutationOrigin(req) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return;
  const fetchSite = String(req.headers["sec-fetch-site"] || "");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    const error = new Error("Cross-site request blocked");
    error.statusCode = 403;
    throw error;
  }
  const origin = req.headers.origin;
  if (!origin) return;
  const expected = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
  if (origin !== expected) {
    const error = new Error("Request origin is not permitted");
    error.statusCode = 403;
    throw error;
  }
}

function enforceSubscription(school, session) {
  if (session.role === "Super Admin") return;
  const status = String(school.subscriptionStatus || "Active");
  const expiry = school.subscriptionExpiresAt || (status === "Trial" ? school.trialEndsAt : "");
  const expired = expiry && new Date(expiry).getTime() < Date.now();
  if (["Suspended", "Expired", "Cancelled"].includes(status) || expired) {
    const error = new Error("This school subscription is not active. Contact the Shule administrator.");
    error.statusCode = 402;
    throw error;
  }
}

function accessForSession(db, session) {
  if (!TEACHER_ROLES.has(session.role)) {
    return { teacherId: "", assignedClassIds: [], assignedSubjectIds: [], assignments: [] };
  }
  const teacher = db.teachers.find((item) =>
    String(item.email || "").trim().toLowerCase() === String(session.email || "").trim().toLowerCase()
  );
  const assignments = teacher
    ? db.teacherAssignments.filter((item) => item.teacherId === teacher.id && item.active !== false)
    : [];
  return {
    teacherId: teacher?.id || "",
    assignedClassIds: [...new Set(assignments.map((item) => item.classId))],
    assignedSubjectIds: [...new Set(assignments.map((item) => item.subjectId))],
    assignments
  };
}

function userWithAccess(session, access) {
  return {
    ...session,
    teacherId: access.teacherId,
    assignedClassIds: access.assignedClassIds,
    assignedSubjectIds: access.assignedSubjectIds,
    assignmentWarning: TEACHER_ROLES.has(session.role) && !access.teacherId
      ? "No teacher profile matches this login email. Ask School Admin to add the teacher and assignments."
      : ""
  };
}

function scopeDbForSession(db, session, access) {
  if (!TEACHER_ROLES.has(session.role)) return db;
  const classIds = new Set(access.assignedClassIds);
  const studentIds = new Set(db.students.filter((student) => classIds.has(student.classId)).map((student) => student.id));
  const ownAssignmentKeys = new Set(access.assignments.map((item) => `${item.classId}:${item.subjectId}`));
  const scopedMarks = session.role === "Subject Teacher"
    ? db.marks.filter((mark) => studentIds.has(mark.studentId) && ownAssignmentKeys.has(`${mark.classId}:${mark.subjectId}`))
    : db.marks.filter((mark) => studentIds.has(mark.studentId));
  const subjectIds = session.role === "Subject Teacher"
    ? new Set(access.assignedSubjectIds)
    : new Set(db.subjects.map((subject) => subject.id));
  const levelIds = new Set(db.classes.filter((item) => classIds.has(item.id)).map((item) => item.levelId));
  const streamIds = new Set(db.classes.filter((item) => classIds.has(item.id)).map((item) => item.streamId));
  return {
    ...db,
    classLevels: db.classLevels.filter((item) => levelIds.has(item.id)),
    streams: db.streams.filter((item) => streamIds.has(item.id)),
    classes: db.classes.filter((item) => classIds.has(item.id)),
    subjects: db.subjects.filter((item) => subjectIds.has(item.id)),
    teachers: session.role === "Subject Teacher"
      ? db.teachers.filter((item) => item.id === access.teacherId)
      : db.teachers,
    teacherAssignments: access.assignments,
    students: db.students.filter((student) => classIds.has(student.classId)),
    marks: scopedMarks,
    deadlines: db.deadlines.filter((item) => item.teacherId === access.teacherId),
    uploadBatches: db.uploadBatches.filter((item) => item.teacherId === access.teacherId),
    uploadErrors: [],
    movements: db.movements.filter((item) => studentIds.has(item.studentId)),
    audit: []
  };
}

function requireAssignedStudent(db, session, access, studentId) {
  const student = db.students.find((item) => item.id === studentId || item.admissionNo === studentId);
  if (!student) throw new Error("Student not found");
  if (TEACHER_ROLES.has(session.role) && !access.assignedClassIds.includes(student.classId)) {
    const error = new Error("This learner is outside your assigned classes");
    error.statusCode = 403;
    throw error;
  }
  return student;
}

function requireOwnTeacherContext(session, access, body) {
  if (!TEACHER_ROLES.has(session.role)) return;
  if (!access.teacherId || access.teacherId !== body.teacherId) {
    const error = new Error("Teachers may only upload marks under their own assigned account");
    error.statusCode = 403;
    throw error;
  }
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

async function handleApi(req, res, pathname, searchParams) {
  validateMutationOrigin(req);
  if (req.method === "POST" && pathname === "/api/auth/login") {
    enforceRateLimit(req, "login", 10, 15 * 60 * 1000);
    const user = await login(req, res, await parseBody(req));
    return sendJson(res, 200, { authenticated: true, user });
  }
  if (req.method === "POST" && pathname === "/api/auth/logout") {
    clearSessionCookies(res);
    return sendJson(res, 200, { authenticated: false });
  }
  if (req.method === "POST" && pathname === "/api/auth/bootstrap") {
    enforceRateLimit(req, "bootstrap", 5, 30 * 60 * 1000);
    const user = await bootstrapSuperAdmin(req, res, await parseBody(req));
    return sendJson(res, 201, { authenticated: true, user });
  }

  const session = await getSession(req, res);
  if (req.method === "GET" && pathname === "/api/auth/session") {
    return sendJson(res, 200, {
      authenticated: Boolean(session),
      user: session,
      firstAdminSetupAvailable: session ? false : await bootstrapAvailable()
    });
  }

  const db = await loadDb();

  if (req.method === "GET" && pathname === "/api/branding") {
    const school = db.school || {};
    return sendJson(res, 200, {
      name: school.name,
      shortName: school.shortName,
      motto: school.motto,
      logoUrl: school.logoUrl,
      tenantCode: school.tenantCode,
      portalUrl: school.portalUrl,
      verificationPrefix: school.verificationPrefix,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
      accentColor: school.accentColor
    });
  }
  if (req.method === "GET" && pathname === "/api/verify") {
    enforceRateLimit(req, "verify", 60, 10 * 60 * 1000);
    return sendJson(res, 200, verifiedReport(db, searchParams.get("code")));
  }
  if (req.method === "GET" && pathname === "/api/qr") {
    const QRCode = require("qrcode");
    const code = String(searchParams.get("code") || "").trim();
    verifiedReport(db, code);
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const verificationUrl = `${protocol}://${req.headers.host}/verify/${encodeURIComponent(code)}`;
    const svg = await QRCode.toString(verificationUrl, { type: "svg", width: 140, margin: 1, errorCorrectionLevel: "M" });
    res.statusCode = 200;
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.end(svg);
  }

  if (req.method === "GET" && pathname === "/api/files") {
    enforceRateLimit(req, "files", 120, 10 * 60 * 1000);
    const url = await signedStorageUrl(searchParams.get("ref"));
    res.statusCode = 302;
    res.setHeader("Location", url);
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.end();
  }

  requireSession(session);
  enforceSubscription(db.school, session);
  const access = accessForSession(db, session);
  const scopedUser = userWithAccess(session, access);
  const scopedDb = scopeDbForSession(db, session, access);

  if (req.method === "GET" && pathname === "/api/bootstrap") return sendJson(res, 200, { ...scopedDb, currentUser: scopedUser, storageMode: storageMode() });
  if (req.method === "GET" && pathname === "/api/results") return sendJson(res, 200, { ...calculateResults(scopedDb), storageMode: storageMode() });
  if (req.method === "GET" && pathname === "/api/storage-status") return sendJson(res, 200, storageStatus());
  if (req.method === "GET" && pathname === "/api/students/list") return sendJson(res, 200, listStudents(scopedDb, Object.fromEntries(searchParams.entries())));
  if (req.method === "GET" && pathname === "/api/marks/list") return sendJson(res, 200, listMarks(scopedDb, Object.fromEntries(searchParams.entries())));
  if (req.method === "GET" && pathname === "/api/audit/list") {
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS"]);
    return sendJson(res, 200, listAudit(scopedDb, Object.fromEntries(searchParams.entries())));
  }
  if (req.method === "GET" && pathname === "/api/reports/archive") {
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS", "Class Teacher", "Viewer"]);
    return sendJson(res, 200, listReportArchive(scopedDb, Object.fromEntries(searchParams.entries())));
  }
  if (req.method === "POST" && pathname === "/api/reports/archive") {
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS", "Class Teacher"]);
    const result = archiveReports(db, await parseBody(req), session);
    await saveDb(db);
    return sendJson(res, 201, result);
  }
  if (req.method === "GET" && pathname === "/api/users") {
    requireRoles(session, SCHOOL_ADMIN_ROLES);
    return sendJson(res, 200, await listUsers(session.role === "Super Admin" ? "" : session.tenantCode));
  }
  if (req.method === "POST" && pathname === "/api/users") {
    requireRoles(session, SCHOOL_ADMIN_ROLES);
    const body = await parseBody(req);
    if (session.role !== "Super Admin" && body.role === "Super Admin") {
      const error = new Error("Only a Super Admin can create or assign another Super Admin");
      error.statusCode = 403;
      throw error;
    }
    body.tenantCode = session.tenantCode;
    if (body.action === "updateRole") {
      const user = await updateUserRole(body);
      if (TEACHER_ROLES.has(user.role)) {
        ensureTeacher(db, { name: user.name, email: user.email, role: user.role });
        await saveDb(db);
      }
      return sendJson(res, 200, user);
    }
    const user = await createUser(body);
    if (TEACHER_ROLES.has(user.role)) {
      ensureTeacher(db, { name: user.name, email: user.email, role: user.role });
      await saveDb(db);
    }
    return sendJson(res, 201, user);
  }

  if (req.method === "POST" && pathname === "/api/teacher-assignments") {
    requireRoles(session, SCHOOL_ADMIN_ROLES);
    const assignment = saveTeacherAssignment(db, await parseBody(req));
    await saveDb(db);
    return sendJson(res, 201, assignment);
  }

  if (req.method === "POST" && pathname === "/api/school") {
    requireRoles(session, ["Super Admin", "School Admin"]);
    const body = await parseBody(req);
    db.school = { ...db.school, ...body };
    db.audit.push(audit("School Admin", "Updated school profile", "-", db.school.name));
    await saveDb(db);
    return sendJson(res, 200, db.school);
  }

  if (req.method === "POST" && pathname === "/api/students") {
    const body = await parseBody(req);
    if (body.action === "previewImport") {
      requireRoles(session, SCHOOL_ADMIN_ROLES);
      const result = importStudents(db, body, { commit: false });
      return sendJson(res, result.ok ? 200 : 422, result);
    }
    if (body.action === "import") {
      requireRoles(session, SCHOOL_ADMIN_ROLES);
      const result = importStudents(db, body);
      if (!result.ok) return sendJson(res, 422, result);
      await saveDb(db);
      return sendJson(res, 200, result);
    }
    if (body.action === "updatePhoto") {
      requireRoles(session, SCHOOL_ADMIN_ROLES);
      const student = await secureStudentPhoto(db, { ...body, updatedBy: session.name });
      await saveDb(db);
      return sendJson(res, 200, student);
    }
    if (body.action === "updateDetails") {
      requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS", "Class Teacher"]);
      requireAssignedStudent(db, session, access, body.studentId || body.admissionNo);
      let permittedBody = body;
      if (session.role === "Class Teacher") {
        permittedBody = { studentId: body.studentId, reportComments: { classTeacher: body.reportComments?.classTeacher || "" } };
      } else if (session.role === "DOS") {
        permittedBody = { studentId: body.studentId, reportComments: { dos: body.reportComments?.dos || "" } };
      } else if (session.role === "Head Teacher") {
        permittedBody = { studentId: body.studentId, reportComments: { headTeacher: body.reportComments?.headTeacher || "" } };
      }
      const student = updateStudentDetails(db, permittedBody);
      await saveDb(db);
      return sendJson(res, 200, student);
    }
    requireRoles(session, SCHOOL_ADMIN_ROLES);
    const student = addStudent(db, body);
    await saveDb(db);
    return sendJson(res, 201, student);
  }

  if (req.method === "POST" && pathname === "/api/marks") {
    requireRoles(session, ["Super Admin", "School Admin", "DOS", "Class Teacher", "Subject Teacher"]);
    const body = await parseBody(req);
    if (body.action === "workflow") {
      const workflow = transitionAssessmentWorkflow(db, body, session);
      await saveDb(db);
      return sendJson(res, 200, { ok: true, workflow });
    }
    const batches = body.mode === "multi" ? (body.batches || []) : [body];
    if (body.mode === "multi") requireRoles(session, SCHOOL_ADMIN_ROLES);
    if (!batches.length) throw new Error("No marks batches were supplied");
    const validationErrors = [];
    for (const batch of batches) {
      const context = {
        ...batch,
        academicYear: batch.academicYear || body.academicYear,
        term: batch.term || body.term,
        examType: batch.examType || body.examType,
        subjectId: batch.subjectId || body.subjectId,
        teacherId: batch.teacherId || body.teacherId
      };
      requireOwnTeacherContext(session, access, context);
      validationErrors.push(...validateMarks(db, context));
    }
    if (validationErrors.length) {
      db.uploadErrors = validationErrors;
      db.audit.push(audit(session.name, "Rejected marks upload", "-", `${validationErrors.length} validation issue(s)`));
      await saveDb(db);
      return sendJson(res, 422, { ok: false, errors: validationErrors });
    }
    let savedCount = 0;
    let skippedDuplicateCount = 0;
    for (const batch of batches) {
      let batchSkippedDuplicates = 0;
      const context = {
        ...batch,
        academicYear: batch.academicYear || body.academicYear,
        term: batch.term || body.term,
        examType: batch.examType || body.examType,
        subjectId: batch.subjectId || body.subjectId,
        teacherId: batch.teacherId || body.teacherId
      };
      for (const mark of context.marks || []) {
        const payload = {
          ...mark,
          academicYear: context.academicYear,
          term: context.term,
          examType: context.examType,
          classId: context.classId,
          subjectId: context.subjectId,
          teacherId: context.teacherId,
          updatedBy: session.name
        };
        if (isDuplicateMark(db, payload)) {
          skippedDuplicateCount += 1;
          batchSkippedDuplicates += 1;
          continue;
        }
        upsertMark(db, payload);
        savedCount += 1;
      }
      db.uploadBatches.push({
        id: `batch-${Date.now()}-${context.classId}`,
        teacherId: context.teacherId,
        classId: context.classId,
        subjectId: context.subjectId,
        academicYear: context.academicYear,
        term: context.term,
        examType: context.examType,
        status: "complete",
        rows: context.marks.length,
        validRows: context.marks.length - batchSkippedDuplicates,
        errorRows: 0,
        skippedDuplicates: batchSkippedDuplicates,
        uploadedAt: new Date().toISOString()
      });
    }
    db.uploadErrors = [];
    db.audit.push(audit(session.name, "Uploaded marks", "-", `${savedCount} mark(s) saved, ${skippedDuplicateCount} duplicate(s) skipped across ${batches.length} class(es)`));
    await saveDb(db);
    return sendJson(res, 200, {
      ok: true,
      saved: savedCount,
      skippedDuplicates: skippedDuplicateCount,
      duplicateWarning: skippedDuplicateCount ? `${skippedDuplicateCount} duplicate mark record(s) were already in the system and were skipped.` : "",
      results: calculateResults(db)
    });
  }

  if (req.method === "POST" && pathname === "/api/deadlines") {
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS"]);
    const deadline = saveDeadline(db, await parseBody(req));
    await saveDb(db);
    return sendJson(res, 200, deadline);
  }

  if (req.method === "POST" && pathname === "/api/promotions") {
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS"]);
    const body = await parseBody(req);
    if (body.action === "rollback") {
      requireRoles(session, ["Super Admin", "School Admin"]);
      const history = rollbackPromotion(db, { ...body, rolledBackBy: session.name });
      await saveDb(db);
      return sendJson(res, 200, history);
    }
    const history = approvePromotion(db, body);
    await saveDb(db);
    return sendJson(res, 200, history);
  }

  if (req.method === "POST" && pathname === "/api/movements") {
    requireRoles(session, SCHOOL_ADMIN_ROLES);
    const movement = addMovement(db, await parseBody(req));
    await saveDb(db);
    return sendJson(res, 201, movement);
  }

  if (req.method === "POST" && pathname === "/api/settings") {
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS"]);
    const settings = updateSettings(db, await parseBody(req));
    await saveDb(db);
    return sendJson(res, 200, settings);
  }

  return sendError(res, 404, "API route not found");
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === "/" || pathname.startsWith("/verify/") ? "/index.html" : pathname;
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
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    applySecurityHeaders(res);
    const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);
    if (pathname.startsWith("/api/")) return await handleApi(req, res, pathname, searchParams);
    return serveStatic(req, res, pathname);
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message || "Request failed");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Shule MVP2 running at http://${HOST}:${PORT}`);
});
