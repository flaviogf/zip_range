import path from 'path'
import zipRange, { createCSVFileOutputGateway } from './zip-range'

const DIR_OUT = path.join(__dirname, '..', 'out')

zipRange(createCSVFileOutputGateway(DIR_OUT))
