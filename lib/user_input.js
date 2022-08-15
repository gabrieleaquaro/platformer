//-------------------Key Functions------------------------------//  
var keyMap = [];
function onDocumentKeyDown(event){ 
  if(event.target.tagName=='INPUT' || inMenu || !isGameStarted) return;
  var keyCode = event.keyCode;
  keyMap[keyCode] = true;  
}

function onDocumentKeyUp(event){
  if(inMenu){
    //ESC
    if(event.keyCode==27){toggleSettingsMenu();} 
    return;
  }
  if(event.target.tagName=='INPUT'  || !isGameStarted) return;
  var keyCode = event.keyCode;
  if (keyCode == 75) {  //K
    mouseState = false;
    isConstructModeEnabled ? disableConstructMode() : enableConstructMode();
  }
  if(isConstructModeEnabled){
    if(keyCode == 66){selectBuildingBlock('cube');}
     //esc
     if(keyCode == 27){
      removeActiveBlock();
      }
  }
  keyMap[keyCode] = false;
}

function executeMovements(dt){
    if(inMenu  || !isGameStarted){
      return;
    }

    if(!isConstructModeEnabled){
      //A
      if(keyMap[65]){blocks[0].moveLeft(dt);}
      //D
      if(keyMap[68]){blocks[0].moveRight(dt);}
      //S
      if(keyMap[83]){blocks[0].moveBackwards(dt);}
      //W
      if(keyMap[87]){blocks[0].moveStraight(dt);}
      //SPACE
      if(keyMap[32]){blocks[0].toggle_jump();}
    }else{
      //A
      if(keyMap[65]){camera.moveLeft();}
      //D
      if(keyMap[68]){camera.moveRight();}
      //W
      if(keyMap[87]){camera.moveUp();}
      //S
      if(keyMap[83]){camera.moveDown();} 
      //ESC
      if(keyMap[27]){removeActiveBlock();} 
      //CANC
      if(keyMap[46]){deleteActiveBlock();} 
    }    
}

//MOUSE CAMERA MOVEMENT
var mouseState = false;
var lastMouseX = -100, lastMouseY = -100;
var delta_T = 0
function doMouseDown(event) {
  if(event.target.tagName=='INPUT'  || !isGameStarted || event.target.classList.contains("editor-setting-name") || event.target.tagName =='BUTTON') return;
  if(inMenu) return;
	lastMouseX = event.pageX;
	lastMouseY = event.pageY;
	mouseState = true;
  start_t =  (new Date).getTime();
}

function doMouseUp(event) {
  if(inMenu  || !isGameStarted || event.target.classList.contains("editor-setting-name")) return;
  if(isConstructModeEnabled){
    lastMouseX = -100;
    lastMouseY = -100;
    mouseState = false;
    var dt = (new Date).getTime() - start_t;
    if(dt < 250){
      myOnMouseUp(event);
    }
  }  
}

function doMouseMove(event) {
  if(event.target.tagName=='INPUT'  || !isGameStarted || event.target.classList.contains("editor-setting-name") || event.target.tagName =='BUTTON') return;
  if(inMenu) return;

	if(mouseState) {
		var dx = event.pageX - lastMouseX;
		var dy = lastMouseY - event.pageY;
		lastMouseX = event.pageX;
		lastMouseY = event.pageY;
		if((dx != 0) || (dy != 0)) {
      if(!isConstructModeEnabled){
        blocks[0].turn(0.02*dx);
        camera.incline_view(0.02*dy);
      }else{
        camera.move(0.25*dx);
        camera.incline_view_building(0.25*dy);
      }
		}
	}
}

function doMouseWheel(event) {
  if(event.target.tagName=='INPUT' || event.target.classList.contains("editor-setting-name") || !isGameStarted || event.target.tagName =='BUTTON') return;
  if(inMenu) return;

	if((camera.radius >= 0) && (camera.radius < 1000.0)) {
    if(!isConstructModeEnabled){
      return
    }else{
		  camera.zoom(event.wheelDelta/100.0);
    }
	}
}


/* MOVEMENTS TUTORIAL 
  

  IN GAME MODE : 
    Move the camera with mouse movements (no hold needed), needs a click on the window to start move. 
    Move the character with WASD, jump with spacebar
    
  IN Construction Mode: 
    Click-Hold and move the mouse to move the camera;
    Click on Object : Select-----------------------------------------------------> TODO
    Esc : Deselect 
    AD : move left/right
    Wheel : Zoom IN/OUT 
    WS : Move camera Up or down   
    B : place a block 
    
*/