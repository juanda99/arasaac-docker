module.exports = {
  Bearer: function checkApiKeySecurity(req, res, next) {
    console.log(req)
    if (req.headers.authorization === 'Scott') {
      next();
    } else {
      next(new Error('access denied!'));
    }
  }
};