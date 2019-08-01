import axios from 'axios';
import fuzzy from 'fuzzy';
import {
  IncomingMessage
} from 'http';
import numeral from 'numeral';
import v from 'voca';
import crypto from 'crypto';
import fs from 'fs';
import util from 'util'
import path from 'path';
import yargs from 'yargs';

const commands = yargs.argv._

const datums = [
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

const shouldIgnoreProduct = (product) => {
  if (product.productFamily === 'Compute Instance') {
    return product.attributes.operatingSystem.toLowerCase() !== 'linux'
        || product.attributes.capacitystatus.toLowerCase() !== 'used'
        || product.attributes.tenancy.toLowerCase() !== 'shared'
        || product.attributes.preInstalledSw.toLowerCase() !== 'na'
  }

  return false
}

const cacheDir = path.join(path.resolve(__dirname), 'cache')

if (!fs.existsSync('cache')) {
  fs.mkdirSync('cache')
}

const outDir = path.join(path.resolve(__dirname), 'out')

if (!fs.existsSync('out')) {
  fs.mkdirSync('out')
}

const log = (...args) => {
  console.log(args.map(v => util.inspect(v, true, Infinity, true)).join('\n'))
}

const logJSON = async (obj) => {
  return new Promise((resolve, reject) => {
    const flushed = process.stdout.write(JSON.stringify(obj))
    if (!flushed) {
      process.stdout.once('drain', () => {
        resolve()
      });
    } else {
      resolve()
    }
  })
}

const hashIt = (value) => {
  const hash = crypto.createHash('md5')

  hash.update(value)

  return hash.digest('hex')
}

const search = (datum) => {
  return async (answers, input) => {
    input = input || '';

    const fuzzyResult = fuzzy.filter(input, datum, {
      extract: (i) => i.name
    });

    return fuzzyResult.map(function(el) {
      return el.original;
    })
  }
}

/**
 * @param {IncomingMessage} message 
 */
const progress = (text, message) => {
  return new Promise((resolve, reject) => {
    const totalBytes = parseInt(message.headers["content-length"])
    let readBytes = null
    let readPackages = []

    message.on('data', (data) => {
      if (data instanceof Buffer) {
        readBytes += data.length
        readPackages.push(data)

        const readBytesH = numeral(readBytes)
          .format('0.00b')
        const totalBytesH = numeral(totalBytes)
          .format('0.00b')

        const progress = Math.ceil((readBytes / totalBytes) * 100)
          .toString()
          .padStart(3, '0')

        process.stdout.write(
          `\x1B[2K\x1B[G[Downloading ${text}] ${progress}% - ${readBytesH}/${totalBytesH}`
        )
      }
    })

    message.on('end', () => {
      process.stdout.write("\n")
      resolve(Buffer.concat(readPackages))
    })

    message.on('error', (err) => {
      process.stdout.write("\n")
      reject(err)
    })
  })
}

const downloadJSON = async (message, url) => {
  const hash = hashIt(url)
  const cachedFile = path.join(cacheDir, `${hash}-${v.slugify(url)}`)

  if (fs.existsSync(cachedFile)) {
    return JSON.parse(fs.readFileSync(cachedFile).toString())
  }

  const response = await axios.get(url, {
    responseType: 'stream'
  });

  const result = await progress(message, response.data)

  fs.writeFileSync(cachedFile, result)

  return JSON.parse(result.toString())
}

(async () => {
  const base = 'https://pricing.us-east-1.amazonaws.com';
  const servicesIndicesRes = await downloadJSON(`Services`,
    `${base}/offers/v1.0/aws/index.json`);

  if (commands.length > 0 && commands[0] === 'list-services') {
    await logJSON(servicesIndicesRes)
    process.exit()
  }

  const servicesIndices = servicesIndicesRes.offers;

  for (const datum of datums) {
    if (servicesIndices.hasOwnProperty(datum.service)) {
      const service = servicesIndices[datum.service]
      const regionsIndexUrl = service.currentRegionIndexUrl
      const regionsRes = await downloadJSON(`Regions for ${datum.service}`,
        `${base}${regionsIndexUrl}`);

      if (regionsRes.regions.hasOwnProperty(datum.region)) {
        const regionOffersUrl = regionsRes.regions[datum.region]
          .currentVersionUrl
        const regionOffersRes = await downloadJSON(
          `Offers for ${datum.service} on ${datum.region}`,
          `${base}${regionOffersUrl}`)

        let products = {}

        for (const sku in regionOffersRes.products) {
          const product = regionOffersRes.products[sku]
          const t = product.attributes.instanceType

          if (shouldIgnoreProduct(product)) {
            continue
          }

          if (t) {
            if (!products.hasOwnProperty(t)) {
              products[t] = {
                type: t,
                variations: []
              }
            }

            products[t].variations.push(product)
          }
        }

        const fetchRates = (product, variation, term) => {
          const isConvertible = String(term.termAttributes.OfferingClass).toLowerCase() === 'convertible'
          const purchaseOption = term.termAttributes.PurchaseOption
          const contractLength = term.termAttributes.LeaseContractLength

          const rates = []
          if (contractLength) {
            const priceDimensions = Object.values(term.priceDimensions)
            const upfrontPrices = priceDimensions.filter(_ => _.unit.toLowerCase() === 'quantity')
            const onDemandPrices = priceDimensions.filter(_ => _.unit.toLowerCase() === 'hrs')
            
            if (upfrontPrices.length > 1) {
              throw new Error(`${product.type} => ${variation.sku} => ${term.sku} => upfrontPrices > 1`)
            }

            if (onDemandPrices.length > 1) {
              throw new Error(`${product.type} => ${variation.sku} => ${term.sku} => onDemandPrices > 1`)
            }

            let lengthInHours = 0
            switch (contractLength.replace(/\s/, '').toLowerCase()) {
              case '1yr':
                lengthInHours = (1/*years*/ * 12 /*months*/) * 730/*hours*/
                break;
              case '2yr':
                  lengthInHours = (2/*years*/ * 12 /*months*/) * 730/*hours*/
                  break;
              case '3yr':
                  lengthInHours = (3/*years*/ * 12 /*months*/) * 730/*hours*/
                  break;
              default:
                console.error('contractLength', contractLength)
            }

            const upfrontPriceItem = upfrontPrices[0] || null
            const onDemandPriceItem = onDemandPrices[0] || null

            let upfrontPricePerUnit = upfrontPriceItem ? parseFloat(upfrontPriceItem.pricePerUnit.USD) : 0
            let onDemandPricePerUnit = onDemandPriceItem ? parseFloat(onDemandPriceItem.pricePerUnit.USD) : 0
            
            let onDemandLengthInHours = 0
            let reservedLengthInHours = 0

            switch (purchaseOption.replace(/\s/, '').toLowerCase()) {
              case 'allupfront':
                onDemandLengthInHours = 0
                reservedLengthInHours = lengthInHours
                break;
              case 'partialupfront':
                onDemandLengthInHours = lengthInHours / 2
                reservedLengthInHours = lengthInHours / 2
                break;
              case 'noupfront':
                onDemandLengthInHours = lengthInHours
                reservedLengthInHours = 0
                break;
              default:
                console.error('purchaseOption', purchaseOption.replace(/\s/, ''))
            }

            let totalPriceOnDemand = 0
            let totalPriceReserved = 0

            if (upfrontPricePerUnit) {
              totalPriceReserved = upfrontPricePerUnit
            }

            if (onDemandPricePerUnit) {
              totalPriceOnDemand = onDemandPricePerUnit * onDemandLengthInHours
            }

            let reservedPricePerHour = 0
            let onDemandPricePerHour = 0

            if (totalPriceOnDemand > 0) {
              onDemandPricePerHour = totalPriceOnDemand / onDemandLengthInHours
            }

            if (totalPriceReserved > 0) {
              reservedPricePerHour = totalPriceReserved / reservedLengthInHours
            }
            
            const totalPricePerHour = reservedPricePerHour + onDemandPricePerHour
            const totalPrice = totalPriceOnDemand + totalPriceReserved

            rates.push({
              skus: [onDemandPriceItem && onDemandPriceItem.rateCode, upfrontPriceItem && upfrontPriceItem.rateCode].filter(_ => !!_),
              totalPriceOnDemand,
              totalPriceReserved,
              totalPrice,
              
              onDemandPricePerHour,
              reservedPricePerHour,
              totalPricePerHour,

              onDemandLengthInHours,
              reservedLengthInHours,

              purchaseOption,
              contractLength,
              isConvertible,
              type: 'reserved',
              // $term: term
            })
          } else {
            for (const rateSku in term.priceDimensions) {
              const price = term.priceDimensions[rateSku]
              rates.push({
                skus: [rateSku],
                totalPricePerHour: parseFloat(price.pricePerUnit.USD),
                onDemandPricePerHour: parseFloat(price.pricePerUnit.USD),
                type: 'on-demand'
              })
            }
          }

          return rates
        }

        const fetchOffers = (product) => {
          for (const variation of product.variations) {
            variation.offers = []
            for (const termsListName in regionOffersRes.terms) {
              const termsList = regionOffersRes.terms[termsListName]
              const terms = termsList[variation.sku];
              for (const termSku in terms) {
                const term = terms[termSku]
                term.sku = termSku
                variation.offers = variation.offers.concat(fetchRates(product, variation, term))
              }
            }
          }

          return product
        }

        const result = Object.values(products).map((product) => {
          return fetchOffers(product)
        }, {})

        fs.writeFileSync(path.join(outDir, `${datum.service}.json`), JSON.stringify(result, null, '  '))
        fs.writeFileSync(path.join(outDir, `${datum.service}.min.json`), JSON.stringify(result))
      }
    }
  }
})()