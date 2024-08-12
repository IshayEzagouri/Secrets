import bcrypt from "bcrypt";
export async function hashPasswordMiddleware(req, res, next) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    req.body.password = hashedPassword;
  } catch (e) {
    return res.status(500).send(e.message);
  }
  next();
}
