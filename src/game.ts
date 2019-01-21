import { swatchZUnselected, swatchScale, Swatch, swatches, GrowSwatches } from "./modules/swatches";
import { Pixel, pixels, CheckServer, getFromServer, wallPixelTransparentMaterial, wallPixelColorMaterial } from "./modules/pixels";
import { refreshInterval, swatchColors, wallBlocksX, wallBlocksY, wallWidth, wallHeight, wallPixelZ, wallPixelScale, paletteColor, wallOffsetX, wallOffsetY, blankColor, apiUrl } from "./params";


// initiate timer to update wall from server regularly
let refreshTimer: number = refreshInterval

// Add systems to engine
engine.addSystem(new GrowSwatches())

engine.addSystem(new CheckServer(refreshTimer))


////// SCENERY

/*

There are two materials used for the wall:
+ wallPixelColorMaterial - opaque material which is the background for colors
+ wallPixelTransparentMaterial - transparent material used for no color

*/

let currentColor: Material = wallPixelTransparentMaterial

/*

An [x] icon shows on the palette. This is that texture material.

*/

let transparentMaterial = new BasicMaterial()
transparentMaterial.texture = "./textures/transparent-texture.png"


// lay out all wall pixels
function InitiateWall(){

  for (let xIndex = 0; xIndex < wallBlocksX; xIndex += 1) {
    for (let yIndex = 0; yIndex < wallBlocksY; yIndex += 1) {
      const xPos = (wallWidth / wallBlocksX) * xIndex + wallOffsetX;
      const yPos = (wallHeight / wallBlocksY) * yIndex + wallOffsetY;
      
      let pix = new Entity()
      pix.add(new Transform({
        position: new Vector3(xPos, yPos, wallPixelZ),
        scale: wallPixelScale
      }))
      pix.add(new Pixel(xIndex, yIndex))

      pix.set(wallPixelTransparentMaterial)
      pix.add(new PlaneShape())
      pix.add(new OnClick(e=> {
        clickPixel(pix)
      }))

      engine.addEntity(pix)
    }
  }
}

InitiateWall()

// lay out swatches in the palette
function InitiatePalette(){
  let paletteContainer = new Entity()
  paletteContainer.add(new Transform({
    position: new Vector3(8.5, 1, 3),
    rotation: Quaternion.Euler(30, 50, 0)
  }))
  engine.addEntity(paletteContainer)

  let palette = new Entity()
  palette.setParent(paletteContainer)
  palette.add(new Transform({
    scale: new Vector3(2.2, 1, 1)
  }))
  palette.add(new PlaneShape())
  palette.set(wallPixelColorMaterial[paletteColor])
  engine.addEntity(palette)
  let rowY = 0
  for (let i = 0; i< swatchColors.length; i++){
    const x = ((i % 12) + 1) / 6 - 1.08;
    if (i % 12 === 0) {
      rowY -= 0.17;
    }
    const y = rowY + 0.5;

    let colorOption = new Entity()
    colorOption.setParent(paletteContainer)
    colorOption.add(new Transform({
      position: new Vector3(x, y, swatchZUnselected),
      scale: swatchScale
    }))
    colorOption.add(new Swatch(x, y))
    //log(wallPixelColorMaterial[i].albedoColor)
    if(i == 0){
      colorOption.set(transparentMaterial)
    }else{
      let col = swatchColors[i]
      colorOption.set(wallPixelColorMaterial[col])
    }
    
    colorOption.add(new PlaneShape())
    colorOption.add(new OnClick(e=> {
      clickSwatch(colorOption)
    }))

    engine.addEntity(colorOption)

  }
}

InitiatePalette()



// when a swatch is clicked set color as active color
function clickSwatch(colorOption: Entity){
  // inactivate all options
  for (let swatch of swatches.entities) {
    swatch.get(Swatch).active = false
  }
  // activate clicked
  colorOption.get(Swatch).active = true
  // set painting color
  currentColor = colorOption.get(Material)
  log("clicked color in the palette")
}


// when a pixel is clicked, send data to server
function clickPixel(pix: Entity){
  //pix.set(currentColor)
  log("setting color to pixel")

  let x = pix.get(Pixel).x
  let y = pix.get(Pixel).y
  let color
  if (currentColor.albedoColor){
    color = currentColor.albedoColor.toHexString()
  } else{
    // transparent
    color = null
  }
  
  let url = `${apiUrl}/api/pixels/pixel`
  let method = "POST";
  let headers = { "Content-Type": "application/json" }
  let body =  JSON.stringify({"x": x, "y": y, "color": color})

  executeTask(async () => {
    try {
      let response = await fetch(url, {
        headers: headers,
        method: method,
        body: body})
    } catch {
      log("error sending pixel change")
    }
   })
   getFromServer()
}



//getFromServer()

