
// how often to refresh scene, in seconds
const refreshInterval: number = 1
let refreshTimer: number = refreshInterval


@Component('pixel')
export class Pixel {
  x: number
  y: number
  //color: string
  constructor(x : number = 0, y : number = 0){
    this.x = x 
    this.y = y 
    //this.color = color 
  }
}

const pixels = engine.getComponentGroup(Pixel)


@Component('swatch')
export class Swatch {
  x: number
  y: number
  //color: Color3
  active: boolean
  size: number
  constructor(x : number = 0, y : number = 0){
    this.x = x 
    this.y = y 
    //this.color = color 
    this.active = false
    this.size = 0
  }
}

const swatches = engine.getComponentGroup(Swatch)


///////// SYSTEMS


export class GrowSwatches implements ISystem {
 
  update(dt: number) {
    for (let swatch of swatches.entities) {
      let state = swatch.get(Swatch)
      let transform = swatch.get(Transform)
      if (state.active && state.size < 1){
        state.size += dt * 2
        transform.scale = Vector3.Lerp(swatchScale, swatchSelectedScale, state.size)
        transform.position.z = Scalar.Lerp(swatchZUnselected, swatchZSelected, state.size)
      }
      else if (!state.active && state.size > 0){
        state.size -= dt * 2
        transform.scale = Vector3.Lerp(swatchScale, swatchSelectedScale, state.size)
        transform.position.z = Scalar.Lerp(swatchZUnselected, swatchZSelected, state.size)
      }
 
    }
  }
}

// Add system to engine
engine.addSystem(new GrowSwatches())

export class CheckServer implements ISystem {
  update(dt:number){
    refreshTimer -= dt
    if (refreshTimer <0){
      refreshTimer = refreshInterval
      getFromServer()
    }
  }

}
engine.addSystem(new CheckServer())



////////  PARAMETERS

const wallBlocksX: number = 21;
const wallBlocksY: number = 6;
const wallWidth = 7;
const wallHeight = 2;
const wallOffsetX = 0.75;
const wallOffsetY = 1;
const wallPixelPrefix = "wall-pixel-";
const wallPixelZ = 5;

const wallPixelScale: Vector3 = new Vector3(wallWidth / wallBlocksX - 0.01, wallHeight / wallBlocksY - 0.01, 0.01)

const swatchPrefix = "swatch-";

// z = 0.1 or else clicks would not fire
const swatchScale = new Vector3(0.16, 0.16,  0.1)
const swatchSelectedScale = new Vector3(0.18, 0.18, 0.1)

const swatchZSelected = -0.06
const swatchZUnselected = -0.03


/*

Color list

Source:
https://www.patternfly.org/styles/color-palette/

+ some are commented to get the entity count down
+ more wall pixels could be added if the palette is truncated

*/
const blankColor = "#0099CC"

const paletteColor =  "#666666"

const swatchColors = [
  blankColor,
  //"#FDBEBF",
  //"#F7BD7F",
  //"#F39D3C",
  //"#EC7A08",
  //"#B35C00",
  //"#773D00",
  // "#3b1f00",
  //"#FBEABC",
  "#F9D67A",
  //"#F5C12E",
  //"#F0AB00",
  //"#B58100",
  "#795600",
  // "#3d2c00",
  //"#E4F5BC",
  "#C8EB79",
  //"#ACE12E",
  "#92D400",
  //"#6CA100",
  "#486B00",
  // // "#253600",
  //"#CFE7CD",
  //"#9ECF99",
  "#6EC664",
  //"#3F9C35",
  "#2D7623",
  "#1E4F18",
  // // "#0f280d",
  //"#BEDEE1",
  //"#7DBDC3",
  //"#3A9CA6",
  "#007A87",
  //"#005C66",
  "#003D44",
  // // "#001f22",
  //"#BEEDF9",
  //"#7CDBF3",
  //"#35CAED",
  "#00B9E4",
  //"#008BAD",
  //"#005C73",
  // // "#002d39",
  //"#DEF3FF",
  //"#BEE1f4",
  //"#7DC3E8",
  //"#39A5DC",
  "#0088CE",
  //"#00659C",
  // // "#004368",
  // // "#002235",
  //"#C7BFFF",
  //"#A18fff",
  //"#8461f7",
  "#703FEC",
  //"#582FC0",
  "#40199A",
  // // "#1f0066",
  // "#fafafa",
  // // "#f5f5f5",
  // "#ededed",
  // // "#d1d1d1",
  //"#BBBBBB",
  // // "#8b8d8f",
  //"#72767B",
  // // "#4d5258",
  //"#393F44",
  // // "#292e34",
  "#030303",
  // "#CC0000",
  "#A30000",
  //"#8B0000",
  //"#470000",
  // "#2c0000",
  paletteColor
]


let activePixels = []


////// SCENERY

/*

There are two materials used for the wall:
+ wallPixelColorMaterial - opaque material which is the background for colors
+ wallPixelTransparentMaterial - transparent material used for no color

*/

let wallPixelColorMaterial = {}

for (let i = 0; i< swatchColors.length; i++){
  let material = new Material()
  let color = Color3.FromHexString(swatchColors[i])
  material.ambientColor = color
  material.albedoColor = color
  material.reflectivityColor = color
  wallPixelColorMaterial[swatchColors[i]] = material  
}


let wallPixelTransparentMaterial = new Material()
wallPixelTransparentMaterial.alpha = 0.1
wallPixelTransparentMaterial.ambientColor= Color3.FromHexString(blankColor)
wallPixelTransparentMaterial.albedoColor=Color3.FromHexString(blankColor)
wallPixelTransparentMaterial.reflectivityColor=Color3.FromHexString(blankColor)
wallPixelTransparentMaterial.hasAlpha=true
wallPixelTransparentMaterial.transparencyMode =2

let currentColor: Material = wallPixelTransparentMaterial

/*

An [x] icon shows on the palette. This is that texture material.

*/

let transparentMaterial = new BasicMaterial()
transparentMaterial.texture = "./textures/transparent-texture.png"



function InitiateWall(){

  for (let xIndex = 0; xIndex < wallBlocksX; xIndex += 1) {
    for (let yIndex = 0; yIndex < wallBlocksY; yIndex += 1) {
      const xPos = (wallWidth / wallBlocksX) * xIndex + wallOffsetX;
      const yPos = (wallHeight / wallBlocksY) * yIndex + wallOffsetY;
      
      let pix = new Entity()
      pix.set(new Transform({
        position: new Vector3(xPos, yPos, wallPixelZ),
        scale: wallPixelScale
      }))
      pix.set(new Pixel(xIndex, yIndex))

      pix.set(wallPixelTransparentMaterial)
      pix.set(new PlaneShape())
      pix.set(new OnClick(e=> {
        clickPixel(pix)
      }))

      engine.addEntity(pix)
    }
  }
}


function InitiatePalette(){
  let paletteContainer = new Entity()
  paletteContainer.set(new Transform({
    position: new Vector3(8.5, 1, 3),
    rotation: Quaternion.Euler(30, 50, 0)
  }))
  engine.addEntity(paletteContainer)

  let palette = new Entity()
  palette.setParent(paletteContainer)
  palette.set(new Transform({
    scale: new Vector3(2.2, 1, 1)
  }))
  palette.set(new PlaneShape())
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
    colorOption.set(new Transform({
      position: new Vector3(x, y, swatchZUnselected),
      scale: swatchScale
    }))
    colorOption.set(new Swatch(x, y))
    //log(wallPixelColorMaterial[i].albedoColor)
    if(i == 0){
      colorOption.set(transparentMaterial)
    }else{
      let col = swatchColors[i]
      colorOption.set(wallPixelColorMaterial[col])
    }
    
    colorOption.set(new PlaneShape())
    colorOption.set(new OnClick(e=> {
      clickSwatch(colorOption)
    }))

    engine.addEntity(colorOption)

  }
}


InitiateWall()
InitiatePalette()

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

///// Connect to the REST API

const apiUrl = "http://127.0.0.1:7753"

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json"
};


//getFromServer()

function getFromServer() {

  let url = `${apiUrl}/api/pixels`

  executeTask(async () => {
    try {
      let response = await fetch(url)
      let json = await response.json()
      //log(json)
      for (let pixel of pixels.entities){
        let x = pixel.get(Pixel).x
        let y = pixel.get(Pixel).y
        let pix = json.find((p)=> p.x === x && p.y === y )

        if(pix && pix.color){
          if (wallPixelColorMaterial[pix.color]){
            let material = wallPixelColorMaterial[pix.color]
            pixel.set(material)
           }
           else{
             log("pixel color" + pix.color + " not supported on " + x + " & " + y)
           }   
        }
        else {
          pixel.set(wallPixelTransparentMaterial)
        }
      }
      log("got data from server")
    } catch {
      log("error getting all pixels")
    }

   })
}