const { readDb, sendError, sendJson } = require("./_lib/shule");

module.exports = function handler(req, res) {
  try {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    return sendJson(res, 200, readDb());
  } catch (error) {
    return sendError(res, 400, error.message || "Request failed");
  }
};
