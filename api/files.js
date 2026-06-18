const { sendError, signedStorageUrl } = require("./_lib/shule");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    const url = await signedStorageUrl(req.query?.ref);
    res.statusCode = 302;
    res.setHeader("Location", url);
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.end();
  } catch (error) {
    return sendError(res, 404, error.message || "File not found");
  }
};
