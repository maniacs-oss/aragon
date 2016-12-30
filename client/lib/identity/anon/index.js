// @flow
import jdenticon from 'jdenticon'

import type { Entity } from '../entity'
import haiku from './haiku'

const identicon = (str: string): string => {
  const svg = jdenticon.toSvg(str.slice(2), 128)
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  return URL.createObjectURL(blob)
}

export default class Anon {
  static lookupEthAddress(addr: string): Object {
    return { ethereumAddress: addr }
  }

  static format(entity: Entity) {
    return {
      username: entity.ethereumAddress,
      name: haiku(entity.ethereumAddress),
      picture: identicon(entity.ethereumAddress),
    }
  }
}