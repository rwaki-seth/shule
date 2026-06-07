const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const {
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
  importStudents,
  approvePromotion,
  audit,
  calculateResults,
  loadDb,
  saveDb,
  saveDeadline,
  sendError,
  sendJson,
  storageMode,
  storageStatus,
  updateSettings,
  updateStudentDetails,
  updateStudentPhoto,
  upsertMark,
  validateMarks,
  verifiedReport
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
  if (req.method === "POST" && pathname === "/api/auth/login") {
    const user = await login(req, res, await parseBody(req));
    return sendJson(res, 200, { authenticated: true, user });
  }
  if (req.method === "POST" && pathname === "/api/auth/logout") {
    clearSessionCookies(res);
    return sendJson(res, 200, { authenticated: false });
  }
  if (req.method === "POST" && pathname === "/api/auth/bootstrap") {
    const user = await bootstrapSuperAdmin(req, res, await parseBody(req));
    return sendJson(res, 201, { authenticated: true, user });
  }

  const session = await getSession(req, res);
  if (req.method === "GET" && pathname === "/api/auth/session") {
    return sendJson(res, 200, { authenticated: Boolean(session), user: session });
  }

  const db = await loadDb();

  if (req.method === "GET" && pathname === "/api/verify") return sendJson(res, 200, verifiedReport(db, searchParams.get("code")));
  if (req.method === "GET" && pathname === "/api/qr") {
    const QRCode = require("qrcode");
    const code = String(searchParams.get("code") || "").trim();
    verifiedReport(db, code);
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const verificationUrl = `${protocol}://${req.headers.host}/#verify/${encodeURIComponent(code)}`;
    const svg = await QRCode.toString(verificationUrl, { type: "svg", width: 140, margin: 1, errorCorrectionLevel: "M" });
    res.statusCode = 200;
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.end(svg);
  }

  requireSession(session);

  if (req.method === "GET" && pathname === "/api/bootstrap") return sendJson(res, 200, { ...db, currentUser: session, storageMode: storageMode() });
  if (req.method === "GET" && pathname === "/api/results") return sendJson(res, 200, { ...calculateResults(db), storageMode: storageMode() });
  if (req.method === "GET" && pathname === "/api/storage-status") return sendJson(res, 200, storageStatus());
  if (req.method === "GET" && pathname === "/api/users") {
    requireRoles(session, ["Super Admin"]);
    return sendJson(res, 200, await listUsers());
  }
  if (req.method === "POST" && pathname === "/api/users") {
    requireRoles(session, ["Super Admin"]);
    const body = await parseBody(req);
    if (body.action === "updateRole") return sendJson(res, 200, await updateUserRole(body));
    return sendJson(res, 201, await createUser(body));
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
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS", "Class Teacher"]);
    const body = await parseBody(req);
    if (body.action === "import") {
      const result = importStudents(db, body);
      if (!result.ok) return sendJson(res, 422, result);
      await saveDb(db);
      return sendJson(res, 200, result);
    }
    if (body.action === "updatePhoto") {
      const student = updateStudentPhoto(db, body);
      await saveDb(db);
      return sendJson(res, 200, student);
    }
    if (body.action === "updateDetails") {
      const student = updateStudentDetails(db, body);
      await saveDb(db);
      return sendJson(res, 200, student);
    }
    const student = addStudent(db, body);
    await saveDb(db);
    return sendJson(res, 201, student);
  }

  if (req.method === "POST" && pathname === "/api/marks") {
    requireRoles(session, ["Super Admin", "School Admin", "DOS", "Class Teacher", "Subject Teacher"]);
    const body = await parseBody(req);
    if (session.role === "Subject Teacher") {
      const teacher = db.teachers.find((item) => String(item.email || "").toLowerCase() === String(session.email || "").toLowerCase());
      if (!teacher || teacher.id !== body.teacherId) {
        const error = new Error("Subject teachers may only upload marks under their own assigned teacher account");
        error.statusCode = 403;
        throw error;
      }
    }
    const errors = validateMarks(db, body);
    if (errors.length) {
      db.uploadErrors = errors;
      db.audit.push(audit("Subject Teacher", "Rejected marks upload", "-", `${errors.length} validation issue(s)`));
      await saveDb(db);
      return sendJson(res, 422, { ok: false, errors });
    }
    for (const mark of body.marks || []) upsertMark(db, {
      ...mark,
      academicYear: body.academicYear,
      term: body.term,
      examType: body.examType,
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId: body.teacherId
    });
    db.uploadErrors = [];
    db.uploadBatches.push({
      id: `batch-${Date.now()}`,
      teacherId: body.teacherId,
      classId: body.classId,
      subjectId: body.subjectId,
      academicYear: body.academicYear,
      term: body.term,
      examType: body.examType,
      status: "complete",
      rows: body.marks.length,
      validRows: body.marks.length,
      errorRows: 0,
      uploadedAt: new Date().toISOString()
    });
    db.audit.push(audit("Subject Teacher", "Uploaded marks", "-", `${body.marks.length} mark(s)`));
    await saveDb(db);
    return sendJson(res, 200, { ok: true, results: calculateResults(db) });
  }

  if (req.method === "POST" && pathname === "/api/deadlines") {
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS"]);
    const deadline = saveDeadline(db, await parseBody(req));
    await saveDb(db);
    return sendJson(res, 200, deadline);
  }

  if (req.method === "POST" && pathname === "/api/promotions") {
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS"]);
    const history = approvePromotion(db, await parseBody(req));
    await saveDb(db);
    return sendJson(res, 200, history);
  }

  if (req.method === "POST" && pathname === "/api/movements") {
    requireRoles(session, ["Super Admin", "School Admin", "Head Teacher", "DOS", "Class Teacher"]);
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
