export const VARIANTS = ['default', 'bundle/frontend', 'bundle/lovelace'] as const
export type Variant = typeof VARIANTS[number]

export const ENVIRONMENTS = ['modern', 'legacy'] as const
export type Environment = typeof ENVIRONMENTS[number]

export const ENVIRONMENT_SUFFIXES = {
  modern: '.module',
  legacy: '.es5',
} as const

export const ENVIRONMENT_FORMATS = {
  modern: 'es',
  legacy: 'system',
} as const

export const VARIANT_ENVIRONMENTS = VARIANTS.flatMap((variant) => {
  return ENVIRONMENTS.map((env) => {
    return {
      variant,
      env,
    }
  })
})
export type VariantEnvironment = typeof VARIANT_ENVIRONMENTS[number]

/**
 * Browserslist from the Home Assistant frontend project.
 * Try to keep this in sync with that.
 * @see https://github.com/home-assistant/frontend/blob/dev/.browserslistrc
 *
 * Note: Legacy builds may not be supported by downstream projects.
 */
export const HOME_ASSISTANT_FRONTEND_BROWSERSLIST = {
  modern: [
    'supports es6-module-dynamic-import',
    'not Safari < 13',
    'not iOS < 13',
    'not KaiOS > 0',
    'not QQAndroid > 0',
    'not UCAndroid > 0',
    'not dead',
  ],
  legacy: [
    'unreleased versions',
    'last 7 years',
    '> 0.05% and supports websockets',
  ],
} as const
