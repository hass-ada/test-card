import path from 'node:path'
import type { OutputBundle, Plugin, RollupOptions } from 'rollup'
import type { VariantEnvironment } from './const'
import type { ResolvedCardRollupConfig } from './config'

export class AdaPkgGenerator {
  private PLACEHOLDER_ID = 'ada-pkg'

  private bundles: Map<VariantEnvironment, OutputBundle> = new Map()

  constructor(private config: ResolvedCardRollupConfig) { }

  sourcePlugin(ve: VariantEnvironment): Plugin {
    return {
      name: 'ada-pkg-source',
      generateBundle: (_, bundle: OutputBundle) => {
        this.bundles.set(ve, bundle)
      },
    }
  }

  makeRollupOptions(): RollupOptions {
    return {
      input: this.PLACEHOLDER_ID,
      output: {
        dir: this.config.distDir,
      },
      plugins: [
        this.placeholderPlugin(),
        this.pkgPlugin(),
      ],
    }
  }

  placeholderPlugin(): Plugin {
    return {
      name: 'ada-pkg-placeholder',
      resolveId: (id) => {
        if (id === this.PLACEHOLDER_ID)
          return `\0${this.PLACEHOLDER_ID}`
      },
      load: (id) => {
        if (id === `\0${this.PLACEHOLDER_ID}`)
          return 'export default {}'
      },
      generateBundle: (_, bundle: OutputBundle) => {
        for (const [key, info] of Object.entries(bundle)) {
          if (info.type === 'chunk' && info.facadeModuleId === `\0${this.PLACEHOLDER_ID}`)
            delete bundle[key]
        }
      },
    }
  }

  exportsField(): Record<string, Record<string, Record<string, Record<string, string>>>> {
    const exp = {}

    // If single entry, make index the single card.
    const entries = {
      '.': 'swipe-card',
      './swipe-card': 'swipe-card',
    }

    /*
    If multiple entries, also make a index entry that exports all entries.
    const entries = {
      '.': 'index',
      './swipe-card': 'swipe-card',
      './other-card': 'other-card',
    }
    */

    for (const [alias, entry] of Object.entries(entries)) {
      // In the browser, we have three options, unbundled, bundled, and bundled for frontend use.
      for (const type of ['', '/bundle/lovelace', '/bundle/frontend']) {
        const key = `${alias}${type}`
        const path = `.${type}/${entry}`
        exp[key] = {}

        // When using node, always use main module export for each entry.
        // We do not make any CJS builds, so this is always ESM.
        // Allow bundles to be imported in node for some advanced use cases.
        exp[key] = {
          node: `${path}.module.js`,
        }

        exp[key].browser = {
          // When used in a normal script tag. Use systemjs/legacy.
          script: `${path}.es5.js`,
          // When used in a module script tag. Use esm/modern.
          import: `${path}.module.js`,
          default: `${path}.module.js`,
        }
      }
    }

    return exp
  }

  pkgPlugin(): Plugin {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return {
      name: 'ada-pkg-pkg',
      async generateBundle() {
        const rootPkg = (await import(path.resolve(self.config.base!, 'package.json'), { assert: { type: 'json' } })).default
        const pkg = {
          name: rootPkg.name,
          version: rootPkg.version,
          description: rootPkg.description,
          keywords: rootPkg.keywords,
          author: rootPkg.author,
          license: rootPkg.license,
          type: 'module',
          exports: self.exportsField(),
          dependencies: rootPkg.dependencies,
        }

        this.emitFile({
          type: 'asset',
          fileName: 'package.json',
          source: JSON.stringify(pkg, null, 2),
        })
      },
    }
  }
}
