const crypto = require("crypto");

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const SETUP_KEY = process.env.SHULE_SETUP_KEY || "";
const DEFAULT_TENANT_CODE = String(process.env.SHULE_TENANT_CODE || "main").trim().toLowerCase();
const SUPER_ADMIN_EMAILS = String(process.env.SHULE_SUPER_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const ROLE_VIEWS = {
  "Super Admin": ["dashboard", "setup", "students", "marks", "monitoring", "promotion", "analytics", "reports", "accessControl"],
  "School Admin": ["dashboard", "setup", "students", "marks", "monitoring", "promotion", "analytics", "reports", "accessControl"],
  "Head Teacher": ["dashboard", "students", "monitoring", "promotion", "analytics", "reports"],
  "DOS": ["dashboard", "students", "marks", "monitoring", "promotion", "analytics", "reports"],
  "Class Teacher": ["dashboard", "students", "marks", "reports"],
  "Subject Teacher": ["dashboard", "students", "marks"],
  "Bursar": ["dashboard", "students"],
  "Parent": ["parentPortal"],
  "Viewer": ["dashboard", "reports"]
};

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map((part) => {
    const index = part.indexOf("=");
    if (index < 0) return ["", ""];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }).filter(([key]) => key));
}

function sessionCookies(res, session) {
  const secure = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  const base = `Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
  const expiresIn = Math.max(60, Number(session.expires_in || 3600));
  res.setHeader("Set-Cookie", [
    `shule_access=${encodeURIComponent(session.access_token)}; Max-Age=${expiresIn}; ${base}`,
    `shule_refresh=${encodeURIComponent(session.refresh_token)}; Max-Age=2592000; ${base}`
  ]);
}

function clearSessionCookies(res) {
  const secure = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  const base = `Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
  res.setHeader("Set-Cookie", [
    `shule_access=; Max-Age=0; ${base}`,
    `shule_refresh=; Max-Age=0; ${base}`
  ]);
}

async function authRequest(pathname, options = {}, admin = false) {
  if (!SUPABASE_URL || !(admin ? SERVICE_KEY : PUBLIC_KEY)) throw new Error("Supabase Auth is not configured");
  const key = admin ? SERVICE_KEY : PUBLIC_KEY;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${pathname}`, {
    method: options.method || "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${options.accessToken || key}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(payload.msg || payload.message || payload.error_description || "Authentication request failed");
  return payload;
}

async function login(req, res, body) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) throw new Error("Email and password are required");
  const session = await authRequest("token?grant_type=password", { method: "POST", body: { email, password } });
  sessionCookies(res, session);
  return publicUser(session.user);
}

async function getSession(req, res) {
  const cookies = parseCookies(req);
  let accessToken = cookies.shule_access;
  if (!accessToken && !cookies.shule_refresh) return null;
  try {
    const user = await authRequest("user", { accessToken });
    return sessionUser(user);
  } catch (error) {
    if (!cookies.shule_refresh) return null;
    try {
      const session = await authRequest("token?grant_type=refresh_token", {
        method: "POST",
        body: { refresh_token: cookies.shule_refresh }
      });
      sessionCookies(res, session);
      accessToken = session.access_token;
      return sessionUser(session.user);
    } catch (_refreshError) {
      clearSessionCookies(res);
      return null;
    }
  }
}

function sessionUser(user) {
  const email = String(user.email || "").toLowerCase();
  const configuredSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
  const role = configuredSuperAdmin ? "Super Admin" : user.app_metadata?.role || user.user_metadata?.role || "Viewer";
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email,
    tenantCode: user.app_metadata?.tenant_code || user.user_metadata?.tenantCode || DEFAULT_TENANT_CODE,
    role: ROLE_VIEWS[role] ? role : "Viewer",
    views: ROLE_VIEWS[role] || ROLE_VIEWS.Viewer
  };
}

function publicUser(user) {
  return sessionUser(user);
}

function requireSession(session) {
  if (!session) {
    const error = new Error("Sign in is required");
    error.statusCode = 401;
    throw error;
  }
  return session;
}

function requireRoles(session, roles) {
  requireSession(session);
  if (!roles.includes(session.role)) {
    const error = new Error("Your role does not permit this action");
    error.statusCode = 403;
    throw error;
  }
  return session;
}

async function bootstrapSuperAdmin(req, res, body) {
  if (!(await bootstrapAvailable())) throw new Error("First Super Admin setup is already complete");
  if (!SETUP_KEY) throw new Error("First-time setup is disabled until SHULE_SETUP_KEY is configured");
  if (!safeEqual(String(body.setupKey || ""), SETUP_KEY)) throw new Error("Invalid first-time setup key");
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || "Super Admin").trim();
  if (!email || password.length < 8) throw new Error("Enter an email and a password of at least 8 characters");
  try {
    await authRequest("admin/users", {
      method: "POST",
      body: {
        email,
        password,
        email_confirm: true,
        app_metadata: { role: "Super Admin", tenant_code: DEFAULT_TENANT_CODE },
        user_metadata: { name, tenantCode: DEFAULT_TENANT_CODE }
      }
    }, true);
  } catch (error) {
    if (!/already|registered|exists/i.test(error.message)) throw error;
  }
  return login(req, res, { email, password });
}

async function bootstrapAvailable() {
  if (!SETUP_KEY || !SUPABASE_URL || !SERVICE_KEY) return false;
  try {
    const payload = await authRequest("admin/users?page=1&per_page=1000", {}, true);
    return !(payload.users || []).some((user) => {
      const email = String(user.email || "").trim().toLowerCase();
      return user.app_metadata?.role === "Super Admin" || SUPER_ADMIN_EMAILS.includes(email);
    });
  } catch (error) {
    console.error("Unable to check first Super Admin setup status", error.message);
    return false;
  }
}

async function listUsers(tenantCode = "") {
  const payload = await authRequest("admin/users?page=1&per_page=100", {}, true);
  return (payload.users || [])
    .map(publicUser)
    .filter((user) => !tenantCode || user.tenantCode === tenantCode);
}

async function createUser(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = ROLE_VIEWS[body.role] ? body.role : "Viewer";
  const name = String(body.name || email).trim();
  const tenantCode = String(body.tenantCode || DEFAULT_TENANT_CODE).trim().toLowerCase();
  if (!email || password.length < 8) throw new Error("Enter an email and a password of at least 8 characters");
  const user = await authRequest("admin/users", {
    method: "POST",
    body: {
      email,
      password,
      email_confirm: true,
      app_metadata: { role, tenant_code: tenantCode },
      user_metadata: { name, tenantCode }
    }
  }, true);
  return publicUser(user);
}

async function updateUserRole(body) {
  const userId = String(body.userId || "");
  const role = ROLE_VIEWS[body.role] ? body.role : "Viewer";
  if (!userId) throw new Error("User ID is required");
  if (body.tenantCode) {
    const existing = await authRequest(`admin/users/${encodeURIComponent(userId)}`, {}, true);
    const existingTenant = existing.app_metadata?.tenant_code || existing.user_metadata?.tenantCode || DEFAULT_TENANT_CODE;
    if (existingTenant !== body.tenantCode) {
      const error = new Error("This user belongs to another school");
      error.statusCode = 403;
      throw error;
    }
  }
  const user = await authRequest(`admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: { app_metadata: { role, tenant_code: body.tenantCode || DEFAULT_TENANT_CODE } }
  }, true);
  return publicUser(user);
}

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = {
  ROLE_VIEWS,
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
};
