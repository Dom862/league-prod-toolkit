import minimist from 'minimist'
import { lt } from 'semver'
import { version } from '../package.json'
import logger, { eventbusTransport } from './logging'
import { runServer } from './web/server'
import moduleService from './modules/ModuleService'
import lpteService from './eventbus/LPTEService'
import axios from 'axios'

const argv = minimist(process.argv.slice(2))

if (argv.loglevel !== undefined) {
  process.env.LOGLEVEL = argv.loglevel
}

const log = logger('main')

log.info(' _          _       _____           _ _    _ _   ')
log.info('| |    ___ | |     |_   _|__   ___ | | | _(_) |_ ')
log.info('| |   / _ \\| |       | |/ _ \\ / _ \\| | |/ / | __|')
log.info('| |__| (_) | |___    | | (_) | (_) | |   <| | |_ ')
log.info('|_____\\___/|_____|   |_|\\___/ \\___/|_|_|\\_\\_|\\__|')
log.info('')

const checkVersion = async (): Promise<any> => {
  const res = await axios.get('https://prod-toolkit-latest.himyu.workers.dev/', {
    headers: { 'Accept-Encoding': 'gzip,deflate,compress' }
  })

  if (res.status !== 200) {
    return log.warn('The current version could not be checked')
  }

  if (lt(version, res.data.tag_name)) {
    log.info('='.repeat(50))
    log.info(`There is a new version available: ${res.data.tag_name as string}`)
    log.info('='.repeat(50))
    log.info('')
  }
}

const main = async (): Promise<void> => {
  await checkVersion()

  lpteService.initialize()
  eventbusTransport.lpte = lpteService

  await moduleService.initialize()

  lpteService.once('lpt', 'ready', async () => {
    await runServer()
  })
}

main()
  .then(() => log.info('LoL Toolkit started up successfully.'))
  .catch((e) => {
    log.error('Startup failed, critical error: ', e)

    process.exit(1)
  })
