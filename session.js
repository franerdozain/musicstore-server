const crypto = require('crypto');
const sessionToken = crypto.randomBytes(32).toString("hex");

module.exports = sessionToken;