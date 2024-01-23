import 'reflect-metadata'
import { join } from 'path'
import getPort from 'get-port'
import { configure } from 'japa'
import souceMapSupport from 'source-map-support'
import execa from 'execa'

process.env.NODE_ENV = 'testing'
process.env.ADONIS_ACE_CWD = join(__dirname)
souceMapSupport.install({ handleUncaughException: false })

async function runMigration() {
  await execa.node('ace', ['migration:run'], {
    stdio: 'inherit',
  })
}

async function rollbackMigration() {
  await execa.node('ace', ['migration:rollback'], {
    stdio: 'inherit',
  })
}

async function startHttpServer() {
  const { Ignitor } = await import('@adonisjs/core/build/src/Ignitor')
  process.env.PORT = String(await getPort())
  await new Ignitor(__dirname).httpServer().start()
}

/**
 * Configure test runner
 */
configure({
  files: ['test/**/*.spec.ts'],
  before: [runMigration, startHttpServer],
  after: [rollbackMigration],
})
