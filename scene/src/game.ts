import {
  swatchZUnselected,
  swatchScale,
  Swatch,
  swatches,
  GrowSwatches,
} from './modules/swatches'
import {
  Pixel,
  pixels,
  CheckServer,
  getFromServer,
  wallPixelTransparentMaterial,
  wallPixelColorMaterial,
} from './modules/pixels'
import {
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
  apiUrl,
} from './params'

// initiate timer to update wall from server regularly
const refreshTimer: number = refreshInterval

// Add systems to engine
engine.addSystem(new GrowSwatches())

engine.addSystem(new CheckServer(refreshTimer))

////// ENVIRONMENT

/*

There are two materials used for the wall:
+ wallPixelColorMaterial - opaque material which is the background for colors
+ wallPixelTransparentMaterial - transparent material used for no color

*/

let currentColor: Material = wallPixelTransparentMaterial

/*

An [x] icon shows on the palette. This is that texture material.

*/

const transparentTexture = new Texture('textures/transparent-texture.png')

const transparentMaterial = new BasicMaterial()
transparentMaterial.texture = transparentTexture

// lay out all wall pixels
function InitiateWall() {
  for (let xIndex = 0; xIndex < wallBlocksX; xIndex += 1) {
    for (let yIndex = 0; yIndex < wallBlocksY; yIndex += 1) {
      const xPos = (wallWidth / wallBlocksX) * xIndex + wallOffsetX
      const yPos = (wallHeight / wallBlocksY) * yIndex + wallOffsetY

      const pix = new Entity()
      pix.addComponent(
        new Transform({
          position: new Vector3(xPos, yPos, wallPixelZ),
          scale: wallPixelScale,
        })
      )
      pix.addComponent(new Pixel(xIndex, yIndex))

      pix.addComponent(wallPixelTransparentMaterial)
      pix.addComponent(new PlaneShape())
      pix.addComponent(
        new OnPointerDown(
          (e) => {
            clickPixel(pix)
          },
          { button: ActionButton.POINTER, hoverText: 'Paint' }
        )
      )

      engine.addEntity(pix)
    }
  }
}

InitiateWall()

// lay out swatches in the palette
function InitiatePalette() {
  const paletteContainer = new Entity()
  paletteContainer.addComponent(
    new Transform({
      position: new Vector3(8.5, 1, 3),
      rotation: Quaternion.Euler(0, 50, 0),
    })
  )
  engine.addEntity(paletteContainer)

  const palette = new Entity()
  palette.setParent(paletteContainer)
  palette.addComponent(
    new Transform({
      scale: new Vector3(2.2, 1, 1),
    })
  )
  palette.addComponent(new PlaneShape())
  palette.addComponent(wallPixelColorMaterial[paletteColor])
  engine.addEntity(palette)
  let rowY = 0
  for (let i = 0; i < swatchColors.length; i++) {
    const x = ((i % 12) + 1) / 6 - 1.08
    if (i % 12 === 0) {
      rowY -= 0.17
    }
    const y = rowY + 0.5

    const colorOption = new Entity()
    colorOption.setParent(paletteContainer)
    colorOption.addComponent(
      new Transform({
        position: new Vector3(x, y, swatchZUnselected),
        scale: swatchScale,
      })
    )
    colorOption.addComponent(new Swatch(x, y))
    //log(wallPixelColorMaterial[i].albedoColor)
    if (i === 0) {
      colorOption.addComponent(transparentMaterial)
    } else {
      const col = swatchColors[i]
      colorOption.addComponent(wallPixelColorMaterial[col])
    }

    colorOption.addComponent(new PlaneShape())
    colorOption.addComponent(
      new OnPointerDown(
        (e) => {
          clickSwatch(colorOption)
        },
        { button: ActionButton.PRIMARY, hoverText: 'Pick Color' }
      )
    )

    engine.addEntity(colorOption)
  }
}

InitiatePalette()

// when a swatch is clicked set color as active color
function clickSwatch(colorOption: IEntity) {
  // inactivate all options
  for (const swatch of swatches.entities) {
    swatch.getComponent(Swatch).active = false
  }
  // activate clicked
  colorOption.getComponent(Swatch).active = true
  // set painting color
  currentColor = colorOption.getComponent(Material)
  log('clicked color in the palette')
}

// when a pixel is clicked, send data to server
function clickPixel(pix: Entity) {
  //pix.set(currentColor)
  log('setting color to pixel')

  const x = pix.getComponent(Pixel).x
  const y = pix.getComponent(Pixel).y
  let color
  if (currentColor.albedoColor) {
    color = currentColor.albedoColor.toHexString()
  } else {
    // transparent
    color = null
  }

  const url = `${apiUrl}/api/pixels/pixel`
  const method = 'POST'
  const headers = { 'Content-Type': 'application/json' }
  const body = JSON.stringify({ x: x, y: y, color: color })

  executeTask(async () => {
    try {
      const response = await fetch(url, {
        headers: headers,
        method: method,
        body: body,
      })
    } catch {
      log('error sending pixel change')
    }
  }).catch((error) => log(error))
  getFromServer()
}

getFromServer()
