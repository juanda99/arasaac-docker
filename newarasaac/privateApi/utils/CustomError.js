class CustomError extends Error {
  constructor (message, code) {
    super(message)
    this.httpCode = code
    this.name = 'Custom error'
  }
}

module.exports = CustomError
