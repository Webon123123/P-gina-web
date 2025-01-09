require("dotenv").config();

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || "supersecreykey",
  RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET,
};
