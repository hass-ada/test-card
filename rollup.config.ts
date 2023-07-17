import { makeRollupOptions } from './ada/rollup'

const config = makeRollupOptions({
  input: 'src/index.ts',
})

export default config
