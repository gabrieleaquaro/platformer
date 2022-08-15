var isConstructModeEnabled = false;
var selectedObject = null;

// Path computation
var path = window.location.pathname;
var page = path.split("/").pop();
var baseDir = window.location.href.replace(page,'');
var shaderDir = baseDir+"shaders/";

// WEBGL elements
var programInfo = null;
var skyboxProgramInfo = null;
var gl = null;
var canvas = null;

// Objects and Textures
var objectsBuffer = new Map();
var textures = new Map();

//Cubevao
var cubeVAO = null;

//Blocks
var blocks = [];
// Is the blocks' array index of the selected block
var selectedBlock = -1;

//Camera
var camera = null;

// Canvas elements and settings
var textFont = "marioFont";
var textColor = "#ed4705";
var textSize = "1em";
var canvasGUI = null;
 
// Time management
var lastUpdateTime = (new Date).getTime();

// Matrices
var perspectiveMatrix = null;
var viewMatrix = null;
    
// Skybox parameters
var skyboxTexture = null;
var quadBufferInfo = null;

// Debug section, enable this variable to print log message on the console
var isDebugEnabled = true;

// Game Status
var isGameStarted = true;

async function main(){
  //Get WebGL Context and Canvas
  var canvas = document.getElementById("c");
  gl = canvas.getContext("webgl2");
  if(!gl){
      document.write("GL context not opened");
  return;
  }

  // Create main program
  await utils.loadFiles([shaderDir + 'vs.vert', shaderDir + 'fs_light.frag'], function
  (shaderText) {
    programInfo = twgl.createProgramInfo(gl,shaderText)
  });

  perspectiveMatrix = utils.MakePerspective(50*0.174, gl.canvas.width/gl.canvas.height, 0.1, 2000.0);;

  // Objects definition
  var cubeBuffer = twgl.primitives.createCubeBufferInfo(gl, 1);
  
  blocks = [];

  objectsBuffer['cube'] = {
    bufferInfo: cubeBuffer,
    material: {u_texture: [1, 1, 1, 1]},
    boundingBox: new BoundingBox(0.5,-0.5,0.5,-0.5,0.5,-0.5),
  };

  for(var i=0;i<objectsList.length;i++){
    // Load Object file
    const response = await fetch('./assets/objects/'+objectsList[i]);  
    const text = await response.text();
    const obj = parseOBJ(text);

    obj.geometries.map(({object,material,data,boundingBox}) => {
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
      objectsBuffer[object] = {
        bufferInfo: bufferInfo,
        material: {u_texture: [1, 1, 1, 1]},
        boundingBox: boundingBox,
      };
    });
  }

  resetGame();
  setupLight();

  // Textures definition
  // Asynchronously load textures
  var color = [255,255,255,255];
  for(var i=0; i<texturesList.length ; i++){
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,new Uint8Array(color));

    var image = new Image();
    image.src = "./assets/textures/"+texturesList[i].file;
    var imageLoadListener = function(texture,i,image, ev) {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      textures.set(texturesList[i].name, texture);
    }
    image.addEventListener('load', imageLoadListener.bind(null,texture,i,image), false);
  }

  //Setup Skybox
  await setUpSkybox();
  
  requestAnimationFrame(drawScene);
}

function resetGame(){
  resetBlocks(true);
  //First block= Character Creation 
  blocks.push(new Character([10.0,10.0,10.0], [0.0, 0.0, 0.0], [0.0, 180.0, 0.0]));
  //Create Goal
  goal_position = [10*Math.random(), 500, 10*Math.random()];
  blocks.push(new Platform([1,1,1], goal_position, [0,0,0], objectsBuffer['Cloud_1_Icosphere'], 'Cloud_1_Icosphere' , 'Goal', false, [255, 226, 36, 255]));
  //Floor Platform 
  blocks.push(new Platform([300.0,1.0,300.0] , [0.0, -20.0, 0.0], [0.0, 0.0, 0.0], objectsBuffer['cube'], 'cube', 'floor', true, [150, 87, 50, 255]));
  camera = new Camera();
}

function resetBlocks(hard_reset = false){
  blocks.forEach(function(element){
    element.delete_block(hard_reset);
  });
  blocks = [];
}

function drawScene(time) {
  time = 5 + time * 0.0001;
  
  animate();
  utils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.depthFunc(gl.LESS);

  if(!isConstructModeEnabled){
    camera.set_game(blocks[0]);
  }else{
    drawConstructModeGUI();
  }

  setLightConstantUniforms();

  setLightUniforms();

  // Draw objects
  var drawObjects = [];
  blocks.forEach(function(block) {
    var uniforms = create_uniforms(block);
    drawObjects.push({
      programInfo: programInfo,
      bufferInfo: block.objectBuffer.bufferInfo,
      uniforms: uniforms,
      texture: block.get_texture(),
    });
  });

  twgl.drawObjectList(gl,drawObjects);

  drawSkyBox();
  requestAnimationFrame(drawScene);    
}

function valType(section, type) {
	return valTypeDecoder[section][type];
}

function normalizeColor(color){
  return [color[0]/255, color[1]/255, color[2]/255, color[3]/255];
}

function RGBAcolor(color){
  return [color[0]*255, color[1]*255, color[2]*255, color[3]*255];
}

function setLightUniforms(light){
  var lightTypeVector = [];
  var PosVector = [];
  var DirVector = [];
  var ConeOutVector = [];
  var ConeInVector = [];
  var DecayVector = [];
  var TargetVector = [];
  var lightColorVector = [];

  lights.forEach(function(light){
    lightTypeVector.push(valType('lightType', light.getLightType()));
    PosVector.push(light.getPosition());
    DirVector.push(valDir(light.getTheta(), light.getPhi()));
    ConeOutVector.push(light.getConeOut());
    ConeInVector.push(light.getConeIn());
    DecayVector.push(light.getDecay());
    TargetVector.push(light.getTargetDistance());
    lightColorVector.push(normalizeColor(light.getColor()));
  });

  const uniforms= {
    lightType: lightTypeVector.flat(),
    Pos: PosVector.flat(),
    Dir: DirVector.flat(),
    ConeOut: ConeOutVector,
    ConeIn: ConeInVector,
    Decay: DecayVector,
    Target: TargetVector,
    lightColor: lightColorVector.flat(),
    lightsNumber: lights.length,
  };
  gl.useProgram(programInfo.program);
  twgl.setUniforms(programInfo, uniforms);
}

function valDir(theta, phi) {
  var t = utils.degToRad(theta);
  var p = utils.degToRad(phi);
  return [Math.sin(t)*Math.sin(p), Math.cos(t), Math.sin(t)*Math.cos(p)];
}

function setLightConstantUniforms(){
  const uniforms= {
    eyePos: camera.position,
    ambientType: valType('ambientType', ambientSelected),
    ambientLightColor: normalizeColor(ambientColor),
    ambientLightLowColor: normalizeColor(lowerColor),
    SHLeftLightColor: normalizeColor(rightColor),
    SHRightLightColor: normalizeColor(leftColor),
    ADir: valDir(ambientDirTheta, ambientDirPhi),
    ambientMatColor: normalizeColor(materialAmbientColor),
  };
  gl.useProgram(programInfo.program);
  twgl.setUniforms(programInfo, uniforms);
}

function create_uniforms(block){
  // Compute the projection matrix
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  var perspective = utils.MakePerspective(60, aspect, 1, 2000);
  var viewMatrix = camera.cameraLookAtMatrix();
  var worldMatrix = block.worldMatrix;
  var normalMatrix = utils.invertMatrix(utils.transposeMatrix(worldMatrix));

  var worldViewMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix)
  var viewProjectionMatrix = utils.multiplyMatrices(perspective,worldViewMatrix);

  var uniforms = {
  matrix: utils.transposeMatrix(viewProjectionMatrix),
  pMatrix:utils.transposeMatrix(worldMatrix),
  nMatrix:utils.transposeMatrix(normalMatrix),
}
  
  uniforms = {...block.materialUniforms, ...uniforms};
  return uniforms;
}

function animate(){
  var currentTime = (new Date).getTime();
  //times in second between updates
  var dt = (currentTime - lastUpdateTime)/1000;
  executeMovements(dt);
  if(!isConstructModeEnabled){
    blocks[0].gravity(dt);
    check_if_over(blocks, dt);
  }
  lastUpdateTime = currentTime;

}

function drawConstructModeGUI(){

}

//---------------Canvas TEXT and GUI Functions------------------//
function enableConstructMode(){
  isConstructModeEnabled = true;
  var constructGUI = document.getElementById('construct-gui');

  camera.set_building();
  switchVisibility(constructGUI, true);
}

function disableConstructMode(){
  isConstructModeEnabled = false;
  var constructGUI = document.getElementById('construct-gui');

  camera.looking_inclination = 0;
  removeActiveBlock();

  switchVisibility(constructGUI, false);
}

function switchVisibility(element, isVisible){
  if(isVisible && element.classList.contains('not-visible')){
    element.classList.add('visible');
    element.classList.remove('not-visible');
  }else if(!isVisible && element.classList.contains('visible')){
    element.classList.add('not-visible');
    element.classList.remove('visible');
  }
}

function getSizeWidth(size = '1em', parent = document.body) {
    let l = document.createElement('div')
    l.style.visibility = 'hidden'
    l.style.boxSize = 'content-box'
    l.style.position = 'absolute'
    l.style.maxWidth = 'none'
    l.style.width = size
    parent.appendChild(l)
    size = l.clientWidth
    l.remove()
    return size
}

//---------------Skybox Functions------------------------------//
async function setUpSkybox(){
  await utils.loadFiles([shaderDir + 'vs_skybox.vert', shaderDir + 'fs_skybox.frag'], function
  (shaderText) {
    skyboxProgramInfo = twgl.createProgramInfo(gl, shaderText);
  });
  quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

  skyboxTexture = twgl.createTexture(gl, {
    target: gl.TEXTURE_CUBE_MAP,
    src: [
      'assets/skybox/sky-pos-x.jpg',
      'assets/skybox/sky-neg-x.jpg',
      'assets/skybox/sky-pos-y.jpg',
      'assets/skybox/sky-neg-y.jpg',
      'assets/skybox/sky-pos-z.jpg',
      'assets/skybox/sky-neg-z.jpg',
    ],
    min: gl.LINEAR_MIPMAP_LINEAR,
  });
}

function drawSkyBox(){
  twgl.setDefaults({ attribPrefix: 'a_' });
  // Draw skybox
  gl.useProgram(skyboxProgramInfo.program);
  gl.depthFunc(gl.LEQUAL); 
  var viewDirectionProjectionInverseMatrix = skyboxMatrix();
  twgl.setBuffersAndAttributes(gl, skyboxProgramInfo, quadBufferInfo);
  twgl.setUniforms(skyboxProgramInfo, {
    u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
    u_skybox: skyboxTexture,
  });
  twgl.drawBufferInfo(gl, quadBufferInfo);
}

function skyboxMatrix(){
    // Compute the required matrix for the skybox
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = utils.MakePerspective(60, aspect, 1, 2000);
    var cameraMatrix = camera.cameraLookAtMatrix();
    // We only care about direction so remove the translation
    var viewDirectionMatrix =  utils.invertMatrix(cameraMatrix);
    viewDirectionMatrix[3] = 0;
    viewDirectionMatrix[7] = 0;
    viewDirectionMatrix[11] = 0;  
    var viewDirectionProjectionMatrix = utils.multiplyMatrices(viewDirectionMatrix, projectionMatrix);
    return utils.invertMatrix(viewDirectionProjectionMatrix);
}

function selectBuildingBlock(selectedBlock){
  var projInv = utils.invertMatrix(perspectiveMatrix);
  var viewInv = utils.invertMatrix(camera.cameraLookAtMatrix());

  var pointEyeCoords = utils.multiplyMatrixVector(projInv, [0.0, 0.0, -1.0, 1.0]);
  var rayEyeCoords = [pointEyeCoords[0], pointEyeCoords[1], -1.0, 0.0];

  var rayDir = utils.multiplyMatrixVector(viewInv, rayEyeCoords);
  var normalisedRayDir = normaliseVector(rayDir);

  position = m4.addVectors(camera.position, m4.scale(normalisedRayDir, 50));
  position[0] = Math.round(position[0]);
  position[1] = Math.round(position[1]);
  position[2] = Math.round(position[2]);


  var objectName;
  var displayName;
  switch(selectedBlock){
    case 'cube':
      objectName = 'cube';
      displayName = 'Cube';
      break;
    case 'brick':
      objectName = 'Box005_Mesh';
      displayName = 'Brick';
      break;
    case 'cloud':
      objectName = 'Cloud_1_Icosphere';
      displayName = 'Cloud';
      break;
    case 'cylinder-island':
      objectName = 'Cylinder-Island_2_Cylinder.001';
      displayName = 'Cylinder Island';
      break;
    case 'mountain':
      objectName = 'Mountain_2_Cone.001';
      displayName = 'Mountain';
      break;
    case 'rock':
      objectName = 'Rock_1_Icosphere.002';
      displayName = 'Rock';
      break;
    case 'square-island':
      objectName = 'Square-Island_2_Cube.001';
      displayName = 'Square Island';
      break;
    case 'tree':
      objectName = 'Tree_1_Cylinder.003';
      displayName = 'Tree';
      break;
    case 'cylinder-island':
      objectName = 'Cylinder-Island_2_Cylinder.001';
      displayName = 'Cylinder Island';
      break;
    case 'hedge':
      objectName = 'Hedge_1_Cube.003';
      displayName = 'Hedge';
      break;
    default:
      log.message('Selected Building Block non found!');
      return;
  }
  
  blocks.push(new Platform([1.0,1.0,1.0] , position, [0.0, 0.0, 0.0],objectsBuffer[objectName],objectName, displayName));
}

function logMessage(message){
  if(!isDebugEnabled) return;
  console.log(message);
}

function setActiveBlock(blockName){
  var blockIndex = null;
  blockIndex = blocks.findIndex((element)=>element.name == blockName);
  if(blockIndex!=null && blockIndex!=-1 && blockIndex!=selectedBlock){
    removeActiveBlock();
    selectedBlock = blockIndex;
    var block = blocks[selectedBlock];
    camera.center_block(block)
    block.draw_element_editor();
  }
}

function removeActiveBlock(){
  if(selectedBlock!=-1){
    removeFromEditorActiveEditor();
    // TODO on remove active block set camera
    selectedBlock = -1;
  }
}

function removeFromEditorActiveEditor(){
  blocks[selectedBlock].blockEl.classList.remove('active');   
  blocks[selectedBlock].remove_editor_element();
}

function deleteActiveBlock(){
  if(selectedBlock!=-1 && blocks[selectedBlock].isDeletable){
    removeFromEditorActiveEditor();
    blocks[selectedBlock].delete_block();
    selectedBlock = -1;
  }
}

function finish_game(hasWin){
  isGameStarted = false;
  removeActiveBlock();
  isConstructModeEnabled = false;

  var endGameTitle = document.getElementById('end-game-title');
  endGameTitle.textContent = hasWin ? 'You Win!' : 'You Lost!';

  var endGameGUI = document.getElementById('end-game-gui');
  switchVisibility(endGameGUI, true);
  endGameGUI.style.display = 'flex';
}

function restart(){
  isGameStarted = true;
  isConstructModeEnabled = false;

  var endGameGUI = document.getElementById('end-game-gui');
  switchVisibility(endGameGUI, true);
  endGameGUI.style.display = 'none';

  resetGame();
}

window.addEventListener("mousedown", doMouseDown, false);
window.addEventListener("mouseup", doMouseUp, false);
window.addEventListener("mousemove", doMouseMove, false);
window.addEventListener("mousewheel", doMouseWheel, false);

window.addEventListener("keyup", onDocumentKeyUp, false);
window.addEventListener("keydown", onDocumentKeyDown, false);

main()