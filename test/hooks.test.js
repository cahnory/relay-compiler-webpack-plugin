/* global jest, describe, it, beforeEach */
/* eslint-env jest */
import webpack from 'webpack'
import path from 'path'
import rimraf from 'rimraf'
import RelayCompilerWebpackPlugin from '../src/index'
import createWebpackConfig from './fixtures/normalCase/createWebpackConfig'
import normaliseConfigForWebpackVersion from './support/normaliseConfigForWebpackVersion'

jest.setTimeout(30000)

const DEFAULT_NODE_ENV = process.env.NODE_ENV

describe('RelayCompilerWebpackPlugin', () => {
  const normalCaseDir = path.resolve(__dirname, 'fixtures', 'normalCase')
  const srcDir = path.resolve(normalCaseDir, 'src')

  beforeEach(done => {
    rimraf(srcDir + '/**/__generated__/**', done)
    process.env.NODE_ENV = DEFAULT_NODE_ENV
  })

  it('Calls hoooks appropriately', done => {
    const beforeWriteSpy = jest.fn()
    const afterWriteSpy = jest.fn()
    const relayCompilerWebpackPlugin = new RelayCompilerWebpackPlugin({
      schema: path.resolve(normalCaseDir, 'schema.json'),
      src: srcDir
    })

    const plugin = {
      apply (compiler) {
        compiler.hooks.compilation.tap(
          'TestHooksPlugin',
          (compilation) => {
            const hooks = RelayCompilerWebpackPlugin.getHooks(compilation)
            hooks.beforeWrite.tapPromise('test-hooks', async () => {
              beforeWriteSpy()
            })

            hooks.afterWrite.tapPromise('test-hooks', async (result) => {
              afterWriteSpy(result)
            })
          }
        )
      }
    }

    const webpackConfig = normaliseConfigForWebpackVersion(
      createWebpackConfig({
        relayCompilerWebpackPlugin,
        plugins: [plugin]
      })
    )

    webpack(webpackConfig, (err, stats) => {
      expect(err).toBeFalsy()
      expect(stats.compilation.errors).toHaveLength(0)
      expect(stats.compilation.warnings).toHaveLength(0)

      expect(beforeWriteSpy).toHaveBeenCalledTimes(1)
      expect(afterWriteSpy).toHaveBeenCalledTimes(1)
      expect(afterWriteSpy).toHaveBeenCalledWith('HAS_CHANGES')
      done()
    })
  })
})
