import axios from "axios";
const jwt = require("jsonwebtoken");

const authenticate = async (req, res, next) => {
  const token = req.header('x-auth')

  try {
    // we verify token using auth service:
    const response = axios.get('https://auth.arasaac.org/api/tokeninfo')
    if (response.status === 400) res.status(400).json({err: response.statusText})
    const { iss, sub, aud, role, exp, scope } = jwt.decode(token);
    req.auth = jwt.decode(token);
    next()
  } catch (e) {
    res.status(401).send(e.message)
  }

  return User.findOne({
    _id: decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  })

