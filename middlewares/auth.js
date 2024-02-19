const admin = require("../firebase");

exports.authCheck = async (req, res, next) => {
  try {
    const firebaseUser = await admin
    .auth()
    .verifyIdToken(req?.headers?.authtoken);
    console.log("FIREBASE USER IN AUTHCHECK", firebaseUser);
    req.user = firebaseUser; // Question" Is firebaseUser is saved to req.user although in request user was not present.
    next();
  } catch (error) {
    res.status(401).json({
      err: "Invalid or expired token"
    })
  }
};
