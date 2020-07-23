import axios from 'axios'
import chalk from 'chalk'
import cheerio from 'cheerio'
import fs from 'fs'
import uniqBy from 'lodash/uniqBy'
import path from 'path'
import querystring from 'querystring'
import { promisify } from 'util'

export default function zipRange(outputGateway) {
  const client = createClient()

  const correios = createCorreios(client)

  return correios
    .fetchStates()
    .then(correios.fetchCities)
    .then(outputGateway.execute)
    .then(() => console.log(chalk.green('States have been exported')))
    .catch((err) => console.log(chalk.red('States have not been exported', err)))
}

export function createCSVFileOutputGateway(directory) {
  function execute(states) {
    return createOutputFolder().then(() => Promise.all([saveStates(states), ...states.map(saveCities)]))
  }

  function createOutputFolder() {
    return promisify(fs.exists)(directory).then((exists) => !exists && promisify(fs.mkdir)(directory))
  }

  function saveStates(states) {
    const header = 'id,name,beginZipCode,endZipCode\n'

    const data = states.map((it) => `${it.id},${it.name},${it.beginZipCode},${it.endZipCode}\n`).join('')

    return promisify(fs.writeFile)(path.join(directory, 'states.csv'), `${header}${data}`)
  }

  function saveCities(state) {
    const header = 'name,stateId,stateName,beginZipCode,endZipCode\n'

    const data = state.cities
      .map((it) => `${it.name},${it.stateId},${it.stateName},${it.beginZipCode},${it.endZipCode}\n`)
      .join('')

    return promisify(fs.writeFile)(path.join(directory, `${state.name.toLowerCase()}.csv`), `${header}${data}`)
  }

  return {
    execute,
  }
}

function createClient() {
  return axios.create({
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'arraybuffer',
  })
}

function createCorreios(client) {
  function fetchStates() {
    const url = 'http://www.buscacep.correios.com.br/sistemas/buscacep/buscaFaixaCep.cfm'

    return client
      .get(url)
      .then((res) => res.data.toString('latin1'))
      .then((data) => cheerio.load(data, { decodeEntities: false }))
      .then(($) => {
        return $('select option')
          .filter((_, it) => {
            const hasValue = $(it).val()

            return hasValue
          })
          .map((index, it) => {
            const id = index + 1

            const name = $(it).text()

            return {
              id,
              name,
            }
          })
          .toArray()
      })
      .then(fetchZipCodeRangeOfTheStates)
  }

  function fetchZipCodeRangeOfTheStates(states) {
    return Promise.all(states.map(fetchZipCodeRangeOfTheState))
  }

  function fetchZipCodeRangeOfTheState(state) {
    const url = 'http://www.buscacep.correios.com.br/sistemas/buscacep/resultadoBuscaFaixaCEP.cfm'

    const data = querystring.stringify({
      UF: state.name,
    })

    return client
      .post(url, data)
      .then((res) => res.data.toString('latin1'))
      .then((data) => cheerio.load(data, { decodeEntities: false }))
      .then(($) => {
        const beginZipCode = $('table:first-of-type tr')
          .find('td:nth-child(2)')
          .text()
          .trim()
          .match(/^\d{5}-\d{3}/g)
          .toString()
          .replace(/(\d{5})-(\d{3})/g, '$1$2')

        const endZipCode = $('table:first-of-type tr')
          .find('td:nth-child(2)')
          .text()
          .trim()
          .match(/\d{5}-\d{3}$/g)
          .toString()
          .replace(/(\d{5})-(\d{3})/g, '$1$2')

        return {
          ...state,
          beginZipCode,
          endZipCode,
        }
      })
  }

  function fetchCities(states) {
    return Promise.all(states.map((it) => browseAllCityPages(it).then((cities) => ({ ...it, cities }))))
  }

  function browseAllCityPages(state, cities = [], next = { begin: 1, end: 50 }) {
    return paginatedCitiesByState(state, next).then((page) => {
      const newCities = uniqBy([...cities, ...page.content], 'name')

      if (!page.next) return Promise.resolve(newCities)

      return browseAllCityPages(state, newCities, page.next)
    })
  }

  function paginatedCitiesByState(state, { begin, end }) {
    const url = 'http://www.buscacep.correios.com.br/sistemas/buscacep/resultadoBuscaFaixaCEP.cfm'

    const data = querystring.stringify({
      UF: state.name,
      qtdrow: 50,
      pagini: begin,
      pagfim: end,
    })

    return client
      .post(url, data)
      .then((res) => res.data.toString('latin1'))
      .then((data) => cheerio.load(data, { decodeEntities: false }))
      .then(($) => {
        const cities = $('table:last-of-type tr')
          .filter((_, it) => {
            const hasChildren = $(it).find('td').length

            return hasChildren
          })
          .map((_, it) => {
            const name = $(it)
              .find('td:nth-child(1)')
              .text()

            const [beginZipCode, endZipCode] = $(it)
              .find('td:nth-child(2)')
              .text()
              .trim()
              .replace(/(\d{5})-(\d{3})/g, '$1$2')
              .split(' a ')

            return {
              name,
              stateId: state.id,
              stateName: state.name,
              beginZipCode,
              endZipCode,
            }
          })
          .toArray()

        const next = $('form[name=Proxima]').serialize()

        if (!next) {
          return {
            content: cities,
            next: null,
          }
        }

        const urlSearchParams = new URLSearchParams(next)

        const begin = urlSearchParams.get('pagini')

        const end = urlSearchParams.get('pagfim')

        return {
          content: cities,
          next: {
            begin,
            end,
          },
        }
      })
  }

  return {
    fetchStates,
    fetchCities,
  }
}
