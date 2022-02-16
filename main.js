let simple_color_shader_frag_text =`#version 300 es
precision mediump float;
uniform vec4 inColor;

out vec4 FragColor;
in vec4 colorModifier;

void main()
{
  FragColor.xyz = normalize(colorModifier.xyz);
  FragColor.w = 0.2f;
}
`

let simple_color_shader_vs_text = `#version 300 es
precision mediump float;
layout (location = 0) in vec3 position;

uniform mat4 mvpMatrix;

out vec4 colorModifier;

void main()
{
  gl_Position = mvpMatrix * vec4(position, 1.0f);
  colorModifier = vec4(position, 1.0f);
}
`

let canvasController, propertiesSection, canvas;

function eventToNumber(e){
  if(window.event) { // IE                  
    return e.keyCode;
  } else if(e.which){ // Netscape/Firefox/Opera                 
    return e.which;
  }
  return 0;
}

function keyUp(e){
  canvasController.updateKeys(eventToNumber(e), false)
}

function keyDown(e){
  canvasController.updateKeys(eventToNumber(e), true)
}

function canvasOnClick(e){
  canvas.focus();
  canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock;
  canvas.requestPointerLock()
}

function canvasMouseMove(e){
  canvasController.mouseMoveEvent(e.movementX, e.movementY)
}

function main() {
  canvas = document.querySelector("#glCanvas");
  canvas.addEventListener('keydown', keyDown, false);
  canvas.addEventListener('keyup', keyUp, false);
  canvas.addEventListener('click', canvasOnClick, false);
  canvas.addEventListener('mousemove', canvasMouseMove, false);

  canvasController = new RenderingWindow(canvas)
  canvasController.initialize()

  let camerasAndCutsArea = document.querySelector("#leftColumn");
  propertiesSection = new PropertiesSection(camerasAndCutsArea);
  propertiesSection.generateDimensionViewing(canvasController.cutLocations, canvasController.camerasND, canvasController.camera3D, true, 0.6)


  // Signals from the PropertiesSection to the RenderingWindow
  connect('signalCameraOriginMovement', canvasController, canvasController.moveCameraOrigin)
  connect('signalCameraTargetMovement', canvasController, canvasController.moveCameraTarget)
  connect('signalCameraChangedPerspective', canvasController, canvasController.changeCameraPerspective)
  connect('signalCutLocationChange', canvasController, canvasController.receiveCutLocationChange)
  connect('signalNewNumberOfCuts', canvasController, canvasController.receiveNewNumberOfCuts)
  connect('signalFaceCullingChange', canvasController, canvasController.receiveChangeFaceCulling)
  connect('signalWireframeChange', canvasController, canvasController.receiveChangeWireframe)
  connect('signalOpenFile', canvasController, canvasController.receiveOpenFile)
  connect('signalRotationPlaneChange', canvasController, canvasController.receiveRotationPlaneChange)
  connect('signalChangeBackgroundColor', canvasController, canvasController.receiveChangeBackgroundColor)

  // Signals from the RenderingWindow to the PropertiesSection
  connect('signal3DLocation', propertiesSection, propertiesSection.receiveChangedFirstThreePositions)
  connect('signalGenerateDimensionVieweing', propertiesSection, propertiesSection.receiveGenerateDimensionVieweing)
  connect('signalPossibleNumberOfCuts', propertiesSection, propertiesSection.receiveNewMaxNumberOfCuts)
  connect('signalRotation', propertiesSection, propertiesSection.receiveAddRotation)

  emit('signalOpenFile', hypercube_file, OBJECTNDMANAGER_NDP_FORMAT)

  // Main render loop
  var loop = function(){
    //update world

    //render stuff here
    canvasController.render()

    requestAnimationFrame(loop);
  }


  requestAnimationFrame(loop);
}

main();