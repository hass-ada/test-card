export interface CardRollupConfig {
  /**
   * The base directory to resolve from.
   *
   * Ada will resolve all paths relative to this directory.
   * Ada expects a package.json to exist in this directory.
   */
  base?: string
  input?: string | Record<string, string>
  distDir?: string
}

export type ResolvedCardRollupConfig = Required<CardRollupConfig>

export const DEFAULT_CONFIG: CardRollupConfig = {
  base: '.',
  input: 'src/index.ts',
  distDir: 'dist',
}
