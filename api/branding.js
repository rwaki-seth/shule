const { loadDb, sendError, sendJson } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    const db = await loadDb();
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
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
