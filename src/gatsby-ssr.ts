import React from 'react'
import { ERRORS, FIXED_WEIGHTS, VARIABLE_WEIGHT_REGEX, BASE_URL } from './constants'
import { Font, Options } from './interfaces'
import { log } from './utils'

const filterFonts = (options: Options) => {
  const errors: any[] = []
  const accepted: Font[] = []
  const { fonts } = options

  for (const font of fonts) {
    const { family, variable, weights } = font
    if (!variable) {
      if (weights) {
        const validWeights = weights.filter((weight: string) => {
          if (FIXED_WEIGHTS.includes(weight)) {
            return true
          } else {
            errors.push({
              family,
              weight,
              reason: ERRORS.NOT_VALID_WEIGHT
            })
          }
        })
        accepted.push({
          ...font,
          weights: validWeights
        })
      } else {
        accepted.push({
          ...font
        })
      }
    } else {
      // if variable and len > 2
      if (weights) {
        if (weights.length > 2) {
          errors.push({
            family,
            reason: ERRORS.TOO_MANY_WEIGHTS
          })
          continue
        }
        const validWeights = weights.filter((weight: string) => {
          if (weight.match(VARIABLE_WEIGHT_REGEX)) {
            return true
          } else {
            errors.push({
              family,
              weight,
              reason: ERRORS.NOT_VALID_VARIABLE_WEIGHT_FORMAT
            })
            return false
          }
        })
        accepted.push({
          ...font,
          weights: validWeights
        })
      }
    }
    // if legacy && variable return error
  }
  return {
    accepted,
    errors
  }
}

const checkNoLegacyVariableConflict = (options: Options) => {
  const { legacy, fonts } = options
  if (!legacy) {
    return true
  } else {
    for (const font of fonts) {
      if (font.variable) {
        return false
      }
    }
  }
}

const formatFontName = (font: Font) => {
  const { family, strictName } = font
  if (strictName) {
    return family
  }
  return family
    .split(' ')
    .map((token: string) => {
      return token.replace(/^\w/, (s: string) => {
        return s.toUpperCase()
      })
    })
    .join(' ')
    .replace(/ /g, '+')
}

const getFontWeight = (font: Font) => {
  const { variable, weights } = font
  if (weights) {
    if (variable) {
      const [boldWeight, italWeight] = weights
      return `${italWeight ? 'ital,' : ''}wght@${boldWeight ? `${italWeight ? '0,' : ''}${boldWeight}` : ''}${
        boldWeight && italWeight ? ';' : ''
      }${italWeight ? `1,${italWeight}` : ''}`
    } else {
      return `wght@${weights.join(';')}`
    }
  }
  return ''
}

const assembleFonts = (fonts: Font[]) => {
  return fonts
    .map((font: Font) => {
      const family = formatFontName(font)
      const weights = getFontWeight(font)
      return `family=${family}${weights ? `:${weights}` : ''}`
    })
    .join('&')
}

export const onRenderBody = ({ setHeadComponents }: any, options: Options) => {
  // if legacy mode was used and variable font request was found
  // exit immediately
  if (!checkNoLegacyVariableConflict(options)) {
    log(ERRORS.VARIABLE_LEGACY_CONFLICT)
    return
  }

  let link

  if (!options.legacy) {
    const finalFonts = filterFonts(options)
    if (finalFonts.errors && options.verbose) {
      log('The following fonts/weights were not loaded')
      log(finalFonts.errors)
    }
    const fonts = assembleFonts(finalFonts.accepted)
    link = `${BASE_URL}?${fonts}`
  }
  console.log(link)

  setHeadComponents([
    React.createElement('link', {
      key: 'fonts',
      href: link,
      rel: 'stylesheet'
    })
  ])
}
