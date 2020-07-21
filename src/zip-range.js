import querystring from 'querystring'
import axios from 'axios'
import chalk from 'chalk'
import cheerio from 'cheerio'

function zipRange() {
  const client = createClient()

  const correios = createCorreios(client)

  return correios
    .fetchStates()
    .then(correios.fetchCities)
    .then((cities) => console.log(chalk.green(JSON.stringify(cities))))
    .catch((err) => console.log(chalk.red(err)))
}

function createClient() {
  return axios.create({
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'arraybuffer',
  })
}

function createCorreios(client) {
  function fetchStates() {
    const url =
      'http://www.buscacep.correios.com.br/sistemas/buscacep/buscaFaixaCep.cfm'

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
          .map((_, it) => {
            const name = $(it).text()

            return {
              name,
            }
          })
          .toArray()
      })
  }

  function fetchCities(states) {
    return Promise.all(states.map(fetchCitiesByState))
  }

  function fetchCitiesByState(state) {
    const url =
      'http://www.buscacep.correios.com.br/sistemas/buscacep/resultadoBuscaFaixaCEP.cfm'

    const data = querystring.stringify({
      UF: state.name,
    })

    return client
      .post(url, data)
      .then((res) => res.data.toString('latin1'))
      .then((data) => cheerio.load(data, { decodeEntities: false }))
      .then(($) =>
        $('table:last-of-type tr')
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
              beginZipCode,
              endZipCode,
            }
          })
          .toArray(),
      )
  }

  return {
    fetchStates,
    fetchCities,
  }
}

export default zipRange
