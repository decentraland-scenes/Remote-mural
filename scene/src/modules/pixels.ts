import {
  apiUrl,
  refreshInterval,
  swatchColors,
  wallBlocksX,
  wallBlocksY,
  wallWidth,
  wallHeight,
  wallPixelZ,
  wallPixelScale,
  paletteColor,
  wallOffsetX,
  wallOffsetY,
  blankColor,
} from '../params'

@Component('pixel')
export class Pixel {
  x: number
  y: number
  //color: string
  constructor(x: number = 0, y: number = 0) {
    this.x = x
    this.y = y
    //this.color = color
  }
}

export const pixels = engine.getComponentGroup(Pixel)

export class CheckServer implements ISystem {
  timer: number
  constructor(timer: number) {
    this.timer = timer
  }
  update(dt: number) {
    this.timer -= dt
    if (this.timer < 0) {
      this.timer = refreshInterval
      getFromServer()
    }
  }
}

export function getFromServer() {
  const url = `${apiUrl}/api/pixels`

  executeTask(async () => {
    try {
      const response = await fetch(url)
      const json = await response.json()
      //log(json)
      for (const pixel of pixels.entities) {
        const x = pixel.getComponent(Pixel).x
        const y = pixel.getComponent(Pixel).y
        const pix = json.find((p) => p.x === x && p.y === y)
        if (pix && pix.color) {
          if (wallPixelColorMaterial[pix.color]) {
            const newMaterial = wallPixelColorMaterial[pix.color]
            pixel.removeComponent(Material)
            pixel.addComponentOrReplace(newMaterial)
          } else {
            log(
              'pixel color' + pix.color + ' not supported on ' + x + ' & ' + y
            )
          }
        } else {
          pixel.removeComponent(Material)
          pixel.addComponentOrReplace(wallPixelTransparentMaterial)
        }
      }
      log('got data from server')
    } catch {
      log('error getting all pixels')
    }
  }).catch((error) => log(error))
}

/// Materials

export const wallPixelColorMaterial = {}

for (let i = 0; i < swatchColors.length; i++) {
  const material = new Material()
  const color = Color3.FromHexString(swatchColors[i])
  material.ambientColor = color
  material.albedoColor = color
  material.reflectivityColor = color
  wallPixelColorMaterial[swatchColors[i]] = material
}

export const wallPixelTransparentMaterial = new Material()
wallPixelTransparentMaterial.alpha = 0.1
wallPixelTransparentMaterial.ambientColor = Color3.FromHexString(blankColor)
wallPixelTransparentMaterial.albedoColor = Color3.FromHexString(blankColor)
wallPixelTransparentMaterial.reflectivityColor =
  Color3.FromHexString(blankColor)
wallPixelTransparentMaterial.hasAlpha = true
wallPixelTransparentMaterial.transparencyMode = 2
