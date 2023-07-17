import path from 'node:path'
import type { ExternalOption, InputPluginOption, OutputOptions, RollupOptions } from 'rollup'
import { defineConfig } from 'rollup'

import type { PluginOptions as RollupSwcOptions } from 'rollup-plugin-swc3'
import { minify, swc } from 'rollup-plugin-swc3'
import type { RollupNodeResolveOptions } from '@rollup/plugin-node-resolve'
import nodeResolve from '@rollup/plugin-node-resolve'
import type { RollupCommonJSOptions } from '@rollup/plugin-commonjs'
import commonjs from '@rollup/plugin-commonjs'
import type { RollupJsonOptions } from '@rollup/plugin-json'
import json from '@rollup/plugin-json'

import packageJson from '../package.json' assert { type: 'json' }
import type { VariantEnvironment } from './const'
import { ENVIRONMENT_FORMATS, ENVIRONMENT_SUFFIXES, HOME_ASSISTANT_FRONTEND_BROWSERSLIST, VARIANT_ENVIRONMENTS } from './const'
import type { CardRollupConfig, ResolvedCardRollupConfig } from './config'
import { DEFAULT_CONFIG } from './config'
import { AdaPkgGenerator } from './pkg'

// import { visualizer } from 'rollup-plugin-visualizer'

export class RollupGenerator {
  private config: ResolvedCardRollupConfig
  private pkgGenerator: AdaPkgGenerator

  constructor(config: CardRollupConfig) {
    const merged = {
      ...DEFAULT_CONFIG,
      ...config,
    }

    const base = path.resolve(merged.base!)

    const resolved: ResolvedCardRollupConfig = {
      base,
      input: merged.input!,
      distDir: path.isAbsolute(merged.distDir!) ? merged.distDir! : path.resolve(base, merged.distDir!),
    }

    this.pkgGenerator = new AdaPkgGenerator(resolved)

    this.config = resolved
  }

  makeRollupOptions(): RollupOptions[] {
    // TODO: Emit a dist/{,legacy/,modern/}readme.me with the generated config.

    // Make a config for each variant and environment combo + the pkg.
    return [
      ...VARIANT_ENVIRONMENTS.map(ve => this.makeSingleRollupOptions(ve)),
      this.pkgGenerator.makeRollupOptions(),
    ]
  }

  makeSingleRollupOptions(ve: VariantEnvironment): RollupOptions {
    return defineConfig({
      ...this.input(ve),
      output: this.output(ve),
      plugins: this.plugins(ve),
      external: this.external(ve),
    })
  }

  input(ve: VariantEnvironment): RollupOptions {
    let input = this.config.input

    // Use package name as the entry point name if we only specified a path.
    if (typeof input === 'string')
      input = { [packageJson.name]: input }

    // Resolve
    input = Object.entries(input).reduce((acc, [name, src]) => {
      acc[name] = path.resolve(this.config.base!, src)
      return acc
    }, {})

    return defineConfig({
      input,
      preserveEntrySignatures: false,
    })
  }

  output(ve: VariantEnvironment): OutputOptions[] {
    return [true, false].map((shouldMinify) => {
      const fileNamesFunc = (type: 'entry' | 'chunk' | 'asset') => {
        return (info: { name?: string }) => {
          const name = info.name ?? { entry: 'index', chunk: 'chunk', asset: 'asset' }[type]

          let bundleDir = ''
          if (ve.variant.startsWith('bundle/'))
            bundleDir = `${ve.variant}/`

          const typeDir = type === 'chunk' ? 'chunks/' : ''

          let extname = ''
          if (type === 'asset') {
            extname = '[extname]'
          }
          else {
            const envSuffix = ENVIRONMENT_SUFFIXES[ve.env]
            const minSuffix = shouldMinify ? '.min' : ''
            extname = `${envSuffix}${minSuffix}.js`
          }

          return `${bundleDir}${typeDir}${name}${extname}`
        }
      }

      return {
        dir: this.config.distDir,
        format: ENVIRONMENT_FORMATS[ve.env],
        entryFileNames: fileNamesFunc('entry'),
        chunkFileNames: fileNamesFunc('chunk'),
        assetFileNames: fileNamesFunc('asset'),
        sourcemap: true,
        externalLiveBindings: false,
        ...shouldMinify
          ? {
              plugins: [
                minify({
                  compress: true,
                  mangle: true,
                  sourceMap: true,
                }),
              ],
            }
          : {},

      }
    })
  }

  plugins(ve: VariantEnvironment): InputPluginOption {
    return [
      swc(this.swc(ve)),
      nodeResolve(this.nodeResolve(ve)),
      commonjs(this.commonjs(ve)),
      json(this.json(ve)),
      this.pkgGenerator.sourcePlugin(ve),
      // visualizer({
      //   template: 'treemap',
      //   gzipSize: true,
      //   emitFile: true,
      //   filename: `stats.${ve.variant}.html`,
      // }),
    ]
  }

  swc(ve: VariantEnvironment): RollupSwcOptions {
    return {
      exclude: /^$/,
      include: /\.[mc]?[jt]sx?$/,
      env: {
        targets: HOME_ASSISTANT_FRONTEND_BROWSERSLIST[ve.env],
      },
      sourceMaps: true,
      jsc: {
        // Do not minify in this step. We will do it in an output plugin.
        minify: {
          compress: false,
          mangle: false,
          sourceMap: true,
        },
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
      },
    }
  }

  nodeResolve(ve: VariantEnvironment): RollupNodeResolveOptions {
    return {
      // Prefer typescript sources over javascript sources.
      extensions: ['.mts', '.ts', '.mjs', '.js'],
      // Use the source field in package.json if it exists - this is useful for
      // packages that have both a source and a dist version, like lit-element.
      // If not found then just prefer esm over cjs.
      mainFields: ['source', 'module', 'main'],
    }
  }

  commonjs(ve: VariantEnvironment): RollupCommonJSOptions {
    return {
      include: /node_modules/,
    }
  }

  json(ve: VariantEnvironment): RollupJsonOptions {
    return {
      // All JSON files will be parsed by default,
    }
  }

  external(ve: VariantEnvironment): ExternalOption {
    return ve.variant === 'default'
      ? (id) => {
        // Do not bundle dependencies.
          return /node_modules/.test(id)
        }
      : []
  }
}

export function makeRollupOptions(config: CardRollupConfig): RollupOptions[] {
  return new RollupGenerator(config).makeRollupOptions()
}
