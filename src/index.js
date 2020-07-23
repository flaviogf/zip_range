import path from 'path'
import zipRange, { createCSVFileOutputGateway } from './zip-range'

const directory = path.join(__dirname, '..', 'out')

const CSVFileOutputGateway = createCSVFileOutputGateway(directory)

zipRange(CSVFileOutputGateway)
