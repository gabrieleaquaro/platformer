class Camera{

    constructor(){
        //Camera parameters
        this.position = [10, 10, 30];
        this.target = [0, 0, 0];
        this.up = [0, 1, 0];
        this.radius = 37.5;
        this.movement = 9.5;
        this.looking_inclination = 0;
        this.speed = 2;

    }

    set_building(){
        this.target = [0, 0, 0]; 
        this.update_building_camera();     
    }

    set_game(character){
        this.position = character.get_position();
        this.position[0] += character.get_direction()[0] * character.scale[0]/2;
        this.position[2] += character.get_direction()[2] *  character.scale[2]/2;
        this.target[0] = this.position[0] + character.get_direction()[0];
        this.target[1] = this.position[1] + this.looking_inclination;
        this.target[2] = this.position[2] + character.get_direction()[2];
    }

    cameraLookAtMatrix(){
        return utils.MakeLookAt(this.position, this.target, this.up);
    }


    //Returns a vector with the looking direction of the camera in "2D"
    __get_direction(){
        return normaliseVector([this.target[0] - this.position[0], 0.0 ,this.target[2] - this.position[2]]);

    }

    //Return the directionn Right to the looking direction in "2D"
    __get_right_direction(){
      return [this.__get_direction()[2], 0.0, -this.__get_direction()[0]];

    }

    //Building movements
    moveLeft(){
        var d = this.__get_right_direction();
        this.target = [this.target[0] + d[0]*this.speed,this.target[1] + d[1]*this.speed, this.target[2] + d[2]*this.speed];
        this.position = [this.position[0] + d[0]*this.speed,this.position[1] + d[1]*this.speed, this.position[2] + d[2]*this.speed];
    }

    moveRight(){
        var d = this.__get_right_direction();
        this.target = [this.target[0] - d[0]*this.speed,this.target[1] - d[1]*this.speed, this.target[2] - d[2]*this.speed];
        this.position = [this.position[0] - d[0]*this.speed,this.position[1] - d[1]*this.speed, this.position[2] - d[2]*this.speed];      
    }

    move(delta = 0.1){
        this.movement += delta % (2*Math.PI);
        this.position = [this.target[0] + Math.cos(this.movement * .1) * this.radius,
                         this.target[1],
                         this.target[2] + Math.sin(this.movement * .1) * this.radius];  
    }

    moveUp(){
        this.target[1] += 1;
        this.position[1] += 1;
    }

    moveDown(){
        this.target[1] -= 1;
        this.position[1] -= 1;
    }

    incline_view(delta = 0.1){
        this.looking_inclination += delta*0.5;
    }

    incline_view_building(delta = 0.1){
        this.looking_inclination += delta;
        this.position[1] -= this.looking_inclination;
    }

    zoom(delta = 1){
        if(this.radius > delta){
            this.radius -= delta;   
        }
        this.position[0] = this.target[0] + Math.cos(this.movement * .1) * this.radius;
        this.position[2]= this.target[2] + Math.sin(this.movement * .1) * this.radius;
    }

    center_block(block){
        this.target = block.get_position();
        this.looking_inclination = -block.scale[1] * 10 > 40 ? 40:-block.scale[1] * 10 ;
        this.radius = 100;
        if(block.scale[0] > 100){
             this.radius = block.scale[0]*0.7;
        }
        this.update_building_camera();
    }

    update_building_camera(){
        this.position = [this.target[0] + Math.cos(this.movement * .1) * this.radius,
                         this.target[1] - this.looking_inclination,
                         this.target[2] + Math.sin(this.movement * .1) * this.radius];  
    }
}