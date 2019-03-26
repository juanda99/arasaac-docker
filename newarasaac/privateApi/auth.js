const axios = require('axios')
const passport = require('passport')
const Strategy = require('passport-http-bearer').Strategy
const jwt = require('jsonwebtoken')

// see https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253 for axios catch errors

passport.use(
  new Strategy(async (token, cb) => {
    // const url = `https://auth.arasaac.org/api/tokeninfo?access_token=${token}`
    const url =
      'https://auth.arasaac.org/api/tokeninfo?access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMGU0OGI4NS0xYmUzLTQ1MWMtOGU1MS1kNDIxMTk5ZmFiNmEiLCJpc3MiOiJhdXRoLmFyYXNhYWMub3JnIiwic3ViIjoiNWM4N2IzYzJiNDM5ZjkwMDAxMmNlNzYyIiwiYXVkIjoidGVzdENsaWVudCIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTU1MzYxMTk0OCwic2NvcGUiOlsicmVhZCIsIndyaXRlIiwidHJhbnNsYXRlIiwiYWRtaW4iXSwiaWF0IjoxNTUzNjA4MzQ4fQ.PTcxBTCLis6l5GZtSLL7Gk7o8W6fIKaCnVTGN7AK_WQLUW-jBFATqrcgk1HTgwxN5vLddU8akVeXUtJVl91LmQc0a8dM_XL1fREcSCNDlyyFoSvN4k-AaeFQs-ibPecPn5zUcGAF4mPyqOSmmhRRyc3X2hiVf3ELYMyUPDbLy1HSvR0F2JYwPzKdtG_vVSaRvI0EUc2BcCpAGwqxqoflB64o3m0H12stK_ZYizqvJLmR29AZKSusAmDt5v0JYcCtbUlAP0_gRMrwinSwxug2tOr8DoCxfi63bxJSbECv2PtjFoKdtqzhiQ1B9kFPruOg3vwRoGM5zBt6O-7nwJdMiQ'
    console.log(url)
    try {
      console.log('pidiendol......')
      const respuesta = await axios.get(url) // no error (20X code), go on
      console.log('--------------------')
      console.log(respuesta)
      const { iss, sub, aud, role, exp, scope } = jwt.decode(token)
      const user = { user: sub, role, scope, iss, aud, exp }
      return cb(null, user)
    } catch (error) {
      if (error.response) {
        const { data, status, headers } = error.response
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(data)
        console.log(status)
        console.log(headers)
        if (status === 400) return cb(null, false) // bad request, invalid token
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        return cb(error)
      }
      console.log(error.config)
      return cb(err)
    }
  })
)
