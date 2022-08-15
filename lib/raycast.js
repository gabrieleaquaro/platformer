function normaliseVector(vec){
    var magnitude = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    var normVec = [vec[0]/magnitude, vec[1]/magnitude, vec[2]/magnitude];
    return normVec;
}


function myOnMouseUp(ev){
    //This is a way of calculating the coordinates of the click in the canvas taking into account its possible displacement in the page
    var top = 0.0, left = 0.0;
    canvas = gl.canvas;

    while (canvas && canvas.tagName !== 'BODY') {
        top += canvas.offsetTop;
        left += canvas.offsetLeft;
        canvas = canvas.offsetParent;
    }
    var x = ev.clientX - left;
    var y = ev.clientY - top;
        
    //Here we calculate the normalised device coordinates from the pixel coordinates of the canvas
    var normX = (2.0*x)/ gl.canvas.width - 1.0;
    var normY = 1.0 - (2.0*y) / gl.canvas.height;

    //We need to go through the transformation pipeline in the inverse order so we invert the matrices
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projInv = utils.invertMatrix(utils.MakePerspective(60, aspect, 1, 2000));
    var viewInv = utils.invertMatrix(utils.MakeLookAt(camera.position, camera.target, camera.up));
    
    //Find the point (un)projected on the near plane, from clip space coords to eye coords
    //z = -1 makes it so the point is on the near plane
    //w = 1 is for the homogeneous coordinates in clip space
    var pointEyeCoords = utils.multiplyMatrixVector(projInv, [normX, normY, -1.0, 1.0]);

    //This finds the direction of the ray in eye space
    //Formally, to calculate the direction you would do dir = point - eyePos but since we are in eye space eyePos = [0,0,0] 
    //w = 0 is because this is not a point anymore but is considered as a direction
    var rayEyeCoords = [pointEyeCoords[0], pointEyeCoords[1], pointEyeCoords[2], 0.0];

    
    //We find the direction expressed in world coordinates by multipling with the inverse of the view matrix
    var rayDir = utils.multiplyMatrixVector(viewInv, rayEyeCoords);
    rayDir = [rayDir[0],rayDir[1],rayDir[2]];
    var normalisedRayDir = normaliseVector(rayDir);


    //The ray starts from the camera in world coordinates
    var rayStartPoint = camera.position;
    
    // console.log("Try hit on", rayStartPoint, "with direction", normalisedRayDir);
    var sel = intersect(rayStartPoint, normalisedRayDir);
    if(sel != -1){
        setActiveBlock(blocks[sel].name);
        console.log("HIT : ", sel);
    }

}

function intersect(rayStartPoint, normalisedRayDir){
    for(eps = 0; eps < 10000; eps += 0.5){
        point = [rayStartPoint[0] + (normalisedRayDir[0] * eps),rayStartPoint[1] + (normalisedRayDir[1] * eps), rayStartPoint[2] + (normalisedRayDir[2] * eps)];
        sel = detect_hit(point);
        if(sel!=-1){
            console.log(point, eps);
            return sel;
        }
    }
    return -1;
}


function detect_hit(pos){
    pos.push(1);
    for(i = 0; i < blocks.length; i++){
        var block = blocks[i];   
        var inverseWorldMatrix = utils.invertMatrix(block.worldMatrix);
        var localPos = utils.multiplyMatrixVector(inverseWorldMatrix, pos);
        //block position box         
        var x_bounds = [block.get_maxX(false), block.get_minX(false)];
        var y_bounds = [block.get_maxY(false), block.get_minY(false)];
        var z_bounds = [block.get_maxZ(false), block.get_minZ(false)];
        //Checks if inside
        var x = localPos[0] < x_bounds[0] && localPos[0] > x_bounds[1];
        var y = localPos[1] < y_bounds[0] && localPos[1] > y_bounds[1];
        var z = localPos[2] < z_bounds[0] && localPos[2] > z_bounds[1];
        if(x && y && z){
            return i;  
        }
    }
    return -1;
}