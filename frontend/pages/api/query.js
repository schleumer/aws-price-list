import { ServerResponse } from 'http';

const databases = {
  AmazonES: require('../../database/AmazonES.min.json'),
  AmazonEC2: require('../../database/AmazonEC2.min.json'),
  AmazonRDS: require('../../database/AmazonRDS.min.json'),
  AmazonElastiCache: require('../../database/AmazonElastiCache.min.json'),
}

const getProducts = async (code) => {
  if (!databases.hasOwnProperty(code)) {
    return null
  }

  const database = databases[code]

  return database
}

const getProduct = async (code, type) => {
  if (!databases.hasOwnProperty(code)) {
    return null
  }

  const database = databases[code]

  const item = database.find(_ => _.type === type)
  if (!item) {
    return null
  }

  return item
}

const servicesAction = async () => {
  return [
    {
      service: 'AmazonEC2',
      region: 'us-west-2'
    },
    {
      service: 'AmazonRDS',
      region: 'us-west-2'
    },
    {
      service: 'AmazonElastiCache',
      region: 'us-west-2'
    },
    {
      service: 'AmazonES',
      region: 'us-west-2'
    }
  ]
}

let productsCache = {}

const productsAction = async (params) => {
  if (productsCache.hasOwnProperty(params.code)) {
    return productsCache[params.code]
  }

  productsCache[params.code] = await getProducts(params.code)

  return productsCache[params.code]
}

const productAction = async (params) => {
  return await getProduct(params.code, params.type)
}

const run = async (body, req) => {
  switch (body.action) {
    case 'services':
      return await servicesAction()
    case 'products':
      return await productsAction(body.params)
    case 'product':
        return await productAction(body.params)
  }
}

const handle = async (req, res) => {
  if (req.method !== 'POST') {
    return { status: 406 }
  }

  const body = req.body

  if (body && body.i) {
    const result = await run(body, req)
    
    if (result === null) {
      return { status: 500 }
    }

    return { status: 200, response: JSON.stringify(result) }
  }

  return { status: 406 }
}

/**
 * 
 * @param {*} req 
 * @param {ServerResponse} res 
 */
export default function (req, res) {
  handle(req, res).then((result) => {
    if (result.response) {
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(result.status)
      res.end(result.response)
    } else {
      res.writeHead(result.status)
      res.end()
    }
  })
}