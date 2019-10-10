const fs = require('fs')

let env = process.env
if (fs.existsSync('./.env')) {
  env = require('dotenv')
    .parse(fs.readFileSync('./.env'))
}

module.exports = {
  target: 'serverless',
  env: {
    API_HOST: env.API_HOST,
  }
}