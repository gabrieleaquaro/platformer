const objectsList = [
    'brick.obj',
    'cloud.obj',
    'cylinderIsland.obj',
    'ghost.obj',
    'hedge.obj',
    'mountain.obj',
    'rock.obj',
    'squareIsland.obj',
    'tree.obj',
];

const texturesList = [
    {file: 'Terrain-Texture_2.png', name: 'terrain'},
    {file: 'Terrain-green.png', name: 'terrain-green'},
    {file: 'Terrain-red.png', name: 'terrain-red'},
    {file: 'Terrain-white.png', name: 'terrain-white'},
    {file: 'Terrain-grey.png', name: 'terrain-grey'},
];

class RenderingObject{
    constructor(){
        return
    }

    toJSON(){
        return{
            'scale' : this.scale,
            'pos' : this.pos,
            'rot' : this.rot,
            'buffer_name' : this.buffer_name,
            'name' : this.name.split('-')[0],
            'color' : RGBAcolor(this.get_diffuseColor()),
            'textureName' :  this.textureName,
            'dTexMix' : this.get_texMix(),
        }
    }

}

function listenerCollapsibleClick(object,blockEl,ev){
    if(ev.target.id!=object.name) return;
    blockEl.classList.add("active");
    setActiveBlock(object.name);
}

class Block extends RenderingObject {
    constructor(scale,pos, rot, materialUniforms, objectBuffer, buffer_name, name = 'Block',isDeletable = true, color = [255, 255, 255 , 255], textureName = null){
        super();
        this.objectBuffer = objectBuffer;
        this.buffer_name = buffer_name;
        this.scale = scale; //vec3 x,y,z 
        this.rot = rot;  //vec3 x,y,z
        this.pos = pos;  //vec3 x,y,z
        this.update_world_matrix(this.pos);

       //Material Variables
        this.materialUniforms = materialUniforms;

        this.set_diffuseType(diffuseType.LAMBERT);
        this.set_specularType(specularType.PHONG);
        this.set_materialEmission(emissionType.NO);

        this.set_roughnessSpecular(defaultValues['specRoughness']);
        this.set_diffuseColor(color);
        this.set_texMix(defaultValues['dTexMix']);
        this.set_specularColor(defaultValues['specularColor']);
        this.set_toonDiffuseThreshold(defaultValues['dToonTh']);
        this.set_toonSpecularThreshold(defaultValues['sToonTh']);
        this.set_roughness(defaultValues['ONroughness']);
        this.set_angleSpecular(defaultValues['angleWard']);
        this.set_anisotropicSpecular(defaultValues['anisotropicAmount']);
        this.set_fresnel(defaultValues['fresnel']);
        this.set_specularShine(defaultValues['specShine']);
        this.set_emitColor(color); 
        this.set_materialAmbientColor(color); 
        this.set_specularity(defaultValues['specularity']);


        if(textureName == null){
            var texture = get_1x1_texture_mono(color);
            this.set_texture(texture);
        }else{
            this.set_texture(textures.get(textureName), textureName);
        }
        

        this.diffuseColorPicker = null;
        this.materialAmbientPicker = null;
        this.texMixPicker = null;
        this.materialEmissionPicker = null;
        this.materialAmbientCoor = null; 
        this.toonThresholdPicker = null;
        this.roughnessPicker = null;
        this.emitColorPicker = null;

        this.name = name+"-"+Math.floor(Math.random() * 10000000);
        this.children = [];
        this.isDeletable = isDeletable;

        // Add block into hierarchy
        this.blockEl = document.createElement('div');
        this.blockEl.setAttribute("id",this.name);
        this.blockEl.textContent = this.name;
        this.blockEl.classList.add('collapsible');
        this.blockEl.addEventListener("click", listenerCollapsibleClick.bind(null,this,this.blockEl),false);
        var blocksList = document.getElementById("blocks-list");
        blocksList.appendChild(this.blockEl);
        blocksList.appendChild(document.getElementById("empty-block"));

        this.blockEl.setAttribute('draggable',true);
        var dragListener = function (ev){
            ev.dataTransfer.setData("text", ev.target.id);
        };
        this.blockEl.addEventListener('dragstart',dragListener.bind(null),false);

        var dropListener = function (block,ev){
            ev.preventDefault();
            var data = ev.dataTransfer.getData("text");
            ev.target.appendChild(document.getElementById(data));
            var blockIndex = null;
            blockIndex = blocks.findIndex((element)=>element.name == data);
            if(blockIndex!=null && blockIndex!=-1){
                block.add_children(blocks[blockIndex]);
            }
        };
        this.blockEl.addEventListener('drop',dropListener.bind(null,this),false);

        var dragOverListener = function (ev){
            ev.preventDefault();
        };
        this.blockEl.addEventListener('dragover',dragOverListener.bind(null),false);

        this.diffuseSelected = diffuseType.NONE;
    }

    get_children(){
        return this.children;
    }

    add_children(block){
        block.parent = this;
        this.children.push(block);

        block.update_matrix_from_parent(this);
        
        // if(this.blockEditor!=null){
        //     block.set_material_uniforms(this.materialUniforms);
        // }
    };

    remove_as_children(){
        if(this.parent==null) return;

        var blockName = this.name;
        this.parent.children = this.parent.children.filter(function(value,index,arr){
            return value.name!=blockName;
          });
        this.update_matrix_from_parent(null);
    }

    //Material Getters
    get_diffuseType(){
        return this.materialUniforms['diffuseType']; 
    }

    get_specularType(){
        return this.materialUniforms['specularType'];
    }

    get_diffuseColor(){
        return this.materialUniforms['diffuseColor'];
    }
    get_texMix (){
       return this.materialUniforms['DTexMix'];
    }

    get_materialEmission(){
        return this.materialUniforms['emissionType'] == valTypeDecoder['emissionType']['Yes'] ? true : false;
    }
    get_toonDiffuseThreshold(){
        return this.materialUniforms['DToonTh'];
    }
    get_roughness(){
        return this.materialUniforms['ONroughness'];
    }
    get_emitColor(){
        return this.materialUniforms['emitColor'];
    }
    get_specularColor(){
        return this.materialUniforms['specularColor'];
    }
    get_specularShine(){
        return this.materialUniforms['SpecShine'];
    }
    get_toonSpecularThreshold(){
        return this.materialUniforms['SToonTh'];
    }
    get_roughnessSpecular(){
        return this.materialUniforms['specRoughness'];
    }
    get_anisotropicSpecular(){
        return this.materialUniforms['anisotropicAmount'];
    }
    get_angleSpecular(){
        return this.materialUniforms['angleWard'];
    }
    get_fresnel(){
        return this.materialUniforms['fresnel'];
    }
    
    get_specularity(){
        return this.materialUniforms['specularity'];
    }

    get_materialAmbientColor(){
        return this.materialUniforms['ambientMatColor'];
    }

    //Material setters
    set_diffuseType(value){
        this.materialUniforms['diffuseType'] = valType('diffuseType', value);    
        this.diffuseType = value;
    }

    set_specularType(value){
        this.materialUniforms['specularType'] = valType('specularType', value);   
        this.specularType = value; 
    }

    set_diffuseColor(value){
        this.materialUniforms['diffuseColor'] = normalizeColor(value);
    }
    set_texMix(value){
        this.materialUniforms['DTexMix'] = value;
    }

    set_materialEmission(value){
        this.materialUniforms['emissionType'] = value =='Yes' ? valTypeDecoder['emissionType']['Yes'] : valTypeDecoder['emissionType']['No'];
    }
    set_toonDiffuseThreshold(value){
        this.materialUniforms['DToonTh'] = value;
    }

    set_roughness(value){
        this.materialUniforms['ONroughness'] = value;
    }
    set_emitColor(value){
        this.materialUniforms['emitColor'] = normalizeColor(value);
    }
    
    set_specularity(value){
        this.materialUniforms['specularity'] = value; 
    }

    set_specularColor(value){
        this.materialUniforms['specularColor'] = normalizeColor(value);
    }
    set_specularShine(value){
        this.materialUniforms['SpecShine'] = value;
    }
    set_toonSpecularThreshold(value){
        this.materialUniforms['SToonTh'] = value;
    }
    set_roughnessSpecular(value){
        this.materialUniforms['specRoughness'] = value;
    }
    
    set_anisotropicSpecular(value){
        this.materialUniforms['anisotropicAmount'] = value;
    }
    set_angleSpecular(value){
        this.materialUniforms['angleWard'] = value;
    }
    set_fresnel(value){
        this.materialUniforms['fresnel'] = value;
    }

    set_materialAmbientColor(value){
        this.materialUniforms['ambientMatColor'] = normalizeColor(value)
    }


    draw_element_editor(){
        this.blockEditor = document.getElementById('block-editor');
        this.blockEditor.classList.add('visible');
        this.blockEditor.classList.remove('not-visible');

        // Add name editor
        var nameEditor = document.createElement('div');
        nameEditor.textContent = 'name';
        nameEditor.classList.add('editor-setting-name');
        this.blockEditor.appendChild(nameEditor);
        nameEditor.appendChild(document.createElement('br'));
        var nameInputText = document.createElement("INPUT");
        nameInputText.setAttribute("type", "text");
        nameEditor.appendChild(nameInputText);
        var enterHandler = function(nameInputText,block,e){
            if(e.keyCode==13){
                block.set_name(nameInputText.value);
                nameInputText.value=block.name;
            }
        };
        nameInputText.addEventListener('keydown',enterHandler.bind(null,nameInputText,this),false);
        nameInputText.value = this.name;

        // Add position editor
        var positionEditor = document.createElement('div');
        positionEditor.textContent = 'Position';
        positionEditor.classList.add('editor-setting-name');
        this.blockEditor.appendChild(positionEditor);
        positionEditor.appendChild(document.createElement('br'));
        // X
        var posX = document.createElement('div');
        posX.textContent="X: ";
        posX.classList.add('editor-subsetting-name');
        positionEditor.appendChild(posX);
        this.posXText = document.createElement("INPUT");
        this.posXText.setAttribute("type", "text");
        posX.appendChild(this.posXText);
        // Y
        var posY = document.createElement('div');
        posY.textContent="Y: ";
        posY.classList.add('editor-subsetting-name');
        positionEditor.appendChild(posY);
        this.posYText = document.createElement("INPUT");
        this.posYText.setAttribute("type", "text");
        posY.appendChild(this.posYText);
        // Z
        var posZ = document.createElement('div');
        posZ.textContent="Z: ";
        posZ.classList.add('editor-subsetting-name');
        positionEditor.appendChild(posZ);
        this.posZText = document.createElement("INPUT");
        this.posZText.setAttribute("type", "text");
        posZ.appendChild(this.posZText);
        // Enter handling
        var enterHandlerPos = function(x,y,z,block,e){
            if(e.keyCode==13){      
                block.update_position(x.value - block.get_position()[0], y.value - block.get_position()[1], z.value - block.get_position()[2]);
            }
        };
        this.posXText.addEventListener('keydown',enterHandlerPos.bind(null,this.posXText,this.posYText,this.posZText,this),false);
        this.posYText.addEventListener('keydown',enterHandlerPos.bind(null,this.posXText,this.posYText,this.posZText,this),false);
        this.posZText.addEventListener('keydown',enterHandlerPos.bind(null,this.posXText,this.posYText,this.posZText,this),false);

        var position = this.get_position();
        this.posXText.value = position[0];
        this.posYText.value = position[1];
        this.posZText.value = position[2];

        // Add scale editor
        var scaleEditor = document.createElement('div');
        scaleEditor.textContent = 'Scale';
        scaleEditor.classList.add('editor-setting-name');
        this.blockEditor.appendChild(scaleEditor);
        scaleEditor.appendChild(document.createElement('br'));
        // X
        var scaleX = document.createElement('div');
        scaleX.textContent="X: ";
        scaleX.classList.add('editor-subsetting-name');
        scaleEditor.appendChild(scaleX);
        this.scaleXText = document.createElement("INPUT");
        this.scaleXText.setAttribute("type", "text");
        scaleX.appendChild(this.scaleXText);
        // Y
        var scaleY = document.createElement('div');
        scaleY.textContent="Y: ";
        scaleY.classList.add('editor-subsetting-name');
        scaleEditor.appendChild(scaleY);
        this.scaleYText = document.createElement("INPUT");
        this.scaleYText.setAttribute("type", "text");
        scaleY.appendChild(this.scaleYText);
        // Z
        var scaleZ = document.createElement('div');
        scaleZ.textContent="Z: ";
        scaleZ.classList.add('editor-subsetting-name');
        scaleEditor.appendChild(scaleZ);
        this.scaleZText = document.createElement("INPUT");
        this.scaleZText.setAttribute("type", "text");
        scaleZ.appendChild(this.scaleZText);
        // Enter handling
        var enterHandlerScale = function(x,y,z,block,e){
            if(e.keyCode==13){   
                block.set_scale(x.value,y.value,z.value);     
            }
        };
        this.scaleXText.addEventListener('keydown',enterHandlerScale.bind(null,this.scaleXText,this.scaleYText,this.scaleZText,this),false);
        this.scaleYText.addEventListener('keydown',enterHandlerScale.bind(null,this.scaleXText,this.scaleYText,this.scaleZText,this),false);
        this.scaleZText.addEventListener('keydown',enterHandlerScale.bind(null,this.scaleXText,this.scaleYText,this.scaleZText,this),false);

        var scale = this.scale;
        this.scaleXText.value = scale[0];
        this.scaleYText.value = scale[1];
        this.scaleZText.value = scale[2];


        // Add rotation editor
        var rotationEditor = document.createElement('div');
        rotationEditor.textContent = 'Rotation';
        rotationEditor.classList.add('editor-setting-name');
        this.blockEditor.appendChild(rotationEditor);
        rotationEditor.appendChild(document.createElement('br'));
        // X
        var rotationX = document.createElement('div');
        rotationX.textContent="X: ";
        rotationX.classList.add('editor-subsetting-name');
        rotationEditor.appendChild(rotationX);
        this.rotationXText = document.createElement("INPUT");
        this.rotationXText.setAttribute("type", "text");
        rotationX.appendChild(this.rotationXText);
        // Y
        var rotationY = document.createElement('div');
        rotationY.textContent="Y: ";
        rotationY.classList.add('editor-subsetting-name');
        rotationEditor.appendChild(rotationY);
        this.rotationYText = document.createElement("INPUT");
        this.rotationYText.setAttribute("type", "text");
        rotationY.appendChild(this.rotationYText);
        // Z
        var rotationZ = document.createElement('div');
        rotationZ.textContent="Z: ";
        rotationZ.classList.add('editor-subsetting-name');
        rotationEditor.appendChild(rotationZ);
        this.rotationZText = document.createElement("INPUT");
        this.rotationZText.setAttribute("type", "text");
        rotationZ.appendChild(this.rotationZText);
        // Enter handling
        var enterHandlerScale = function(x,y,z,block,e){
            if(e.keyCode==13){   
                block.set_rotation(x.value,y.value,z.value);     
            }
        };
        this.rotationXText.addEventListener('keydown',enterHandlerScale.bind(null,this.rotationXText,this.rotationYText,this.rotationZText,this),false);
        this.rotationYText.addEventListener('keydown',enterHandlerScale.bind(null,this.rotationXText,this.rotationYText,this.rotationZText,this),false);
        this.rotationZText.addEventListener('keydown',enterHandlerScale.bind(null,this.rotationXText,this.rotationYText,this.rotationZText,this),false);

        var rotation = this.get_rotation();
        this.rotationXText.value = rotation[0];
        this.rotationYText.value = rotation[1];
        this.rotationZText.value = rotation[2];

        //Diffuse settings
        var diffuseEditor = document.createElement('div');
        diffuseEditor.textContent = 'Diffuse';
        diffuseEditor.classList.add('editor-setting-name');
        this.blockEditor.appendChild(diffuseEditor);
        diffuseEditor.appendChild(document.createElement('br'));

        var diffuseSelector = document.createElement('div');
        diffuseSelector.classList.add('editor-subsetting-name');
        diffuseEditor.appendChild(diffuseSelector);
        var diffuseTypePicker = document.createElement('select');
        diffuseSelector.appendChild(diffuseTypePicker);
        diffuseTypePicker.addEventListener('change',diffuseChange.bind(null,this),false);

        for(var i=0; i<Object.keys(diffuseType).length ; i++){
            var option = document.createElement('option');
            option.setAttribute('value',Object.values(diffuseType)[i]);
            option.textContent = Object.values(diffuseType)[i];
            diffuseTypePicker.appendChild(option);
        }

        diffuseTypePicker.value = this.diffuseType;
        this.diffuseSettings = document.createElement('div');
        this.diffuseSettings.id = 'diffuse-settings';
        diffuseUpdate(this);
        diffuseEditor.appendChild(this.diffuseSettings);

        this.materialEmissionContainer = document.createElement('div');
        this.materialEmissionContainer.classList.add('editor-setting-name');
        this.materialEmissionContainer.textContent = 'Material Emission';
        this.blockEditor.appendChild(this.materialEmissionContainer);
        this.materialEmissionPicker = document.createElement('select');
        this.materialEmissionContainer.appendChild(this.materialEmissionPicker);
        var option = document.createElement('option');
        option.setAttribute('value','No');
        option.textContent = 'No';
        this.materialEmissionPicker.appendChild(option);
        option = document.createElement('option');
        option.setAttribute('value','Yes');  
        option.textContent = 'Yes';
        this.materialEmissionPicker.appendChild(option);
    
        var materialEmissionHandler = function(object, event){
            if(event.target.value == 'No'){
                object.set_materialEmission('No');
                var element = document.getElementById('emitColorPicker');
                if(element) element.remove();
            }else {
                object.set_materialEmission('Yes');
                var watchEmitColorSelector = function (object, event) {
                    var color = hexToRgb(event.target.value,true);
                    color[3] = 255;
                    object.set_emitColor(color);

                };
                createColorPickerSettings(object, object.materialEmissionContainer, watchEmitColorSelector,'Emit Color: ', 'emitColorPicker');
                this.emitColorPicker.value = rgbAToHex( this.get_emitColor(), false);
            }
        };
        
        
        this.materialEmissionPicker.addEventListener('change',materialEmissionHandler.bind(null,this),false);
        this.materialEmissionPicker.value = this.get_materialEmission() ? 'Yes' : 'No';
        if(this.get_materialEmission()){
            var watchEmitColorSelector = function (object, event) {
                var color = hexToRgb(event.target.value,true);
                color[3] = 255;
                object.set_emitColor(color);

            };
            createColorPickerSettings(this, this.materialEmissionContainer, watchEmitColorSelector,'Emit Color: ', 'emitColorPicker');
            this.emitColorPicker.value = rgbAToHex( this.get_emitColor(), false);
        }

        var watchMaterialAmbientPicker = function (object, event) {
            var color = hexToRgb(event.target.value,true);

            color[3] = 255;
            object.set_materialAmbientColor(color);
        };

        createColorPickerSettings(this, this.blockEditor, watchMaterialAmbientPicker, 'Material Ambient Color: ', 'materialAmbientPicker');
        this.materialAmbientPicker.value = rgbAToHex( this.get_materialAmbientColor(), false);

        //specular settings
        var specularEditor = document.createElement('div');
        specularEditor.textContent = 'Specular';
        specularEditor.classList.add('editor-setting-name');
        this.blockEditor.appendChild(specularEditor);
        specularEditor.appendChild(document.createElement('br'));

        var specularSelector = document.createElement('div');
        specularSelector.classList.add('editor-subsetting-name');
        specularEditor.appendChild(specularSelector);
        var specularTypePicker = document.createElement('select');
        specularSelector.appendChild(specularTypePicker);
        specularTypePicker.addEventListener('change',specularChange.bind(null,this),false);

        for(var i=0; i<Object.keys(specularType).length ; i++){
            var option = document.createElement('option');
            option.setAttribute('value',Object.values(specularType)[i]);
            option.textContent = Object.values(specularType)[i];
            specularTypePicker.appendChild(option);
        }

        specularTypePicker.value = this.specularType;
        this.specularSettings = document.createElement('div');
        this.specularSettings.id = 'specular-settings';
        specularUpdate(this);
        specularEditor.appendChild(this.specularSettings);

        // Delete button
        if(this.isDeletable){
            this.delButtonContainer = document.createElement('div');
            this.delButtonContainer.classList.add('editor-setting-name');
            this.blockEditor.appendChild(this.delButtonContainer);
            var delButton = document.createElement("button");
            delButton.setAttribute("type", "button");
            delButton.textContent='Delete';
            this.delButtonContainer.appendChild(delButton);
            var deleteHandler = function(block,e){
                // block.delete_block()
                deleteActiveBlock();
            };
            delButton.addEventListener('click',deleteHandler.bind(null,this),false);
        }        

    }
    
    refreshSpecular(){
        if(this.specularColorPicker!=null) this.specularColorPicker.value = rgbAToHex(RGBAcolor(this.get_specularColor()),true);
        if(this.specularShinePicker!=null) this.specularShinePicker.value = this.get_specularShine();
    
        if(this.toonSpecularThresholdPicker!=null) this.toonSpecularThresholdPicker.value = this.get_toonSpecularThreshold();
    
        if(this.roughnessSpecularPicker!=null) this.roughnessSpecularPicker.value = this.get_roughnessSpecular();
        if(this.anisotropicSpecularPicker!=null) this.anisotropicSpecularPicker.value = this.get_anisotropicSpecular();
        if(this.angleSpecularPicker!=null) this.angleSpecularPicker.value = this.get_angleSpecular();
    
        if(this.specularitySpecularPicker!=null) this.specularitySpecularPicker.value = this.get_specularity();
        if(this.fresnelSpecularPicker!=null) this.fresnelSpecularPicker.value = this.get_fresnel();
    }

    setupPhongOrBlinnSettings(specularSettings){
        var watchSpecularColorPicker = function (object, event) {
            var color = hexToRgb(event.target.value,true);
    
            color[3] = 255;
            object.set_specularColor(color);
            object.refreshSpecular();
        };
        var watchSpecularShineSelector = function (object, event) {
            object.set_specularShine(parseFloat(event.target.value));
            object.refreshSpecular();
        };
    
        createColorPickerSettings(this, specularSettings, watchSpecularColorPicker, 'Color: ', 'specularColorPicker');
        createSliderSettings(this, specularSettings, watchSpecularShineSelector, 'Shin: ',0,1,0.1, 'specularShinePicker');
    
        this.refreshSpecular();
    }

    setupToonSettings(specularSettings){
        var watchColorPicker = function (object, event) {
            var color = hexToRgb(event.target.value,true);
    
            color[3] = 255;
            object.set_specularColor(color);
            object.refreshSpecular();
        };
        var watchToonSpecularThresholdSelector = function (object, event) {
            object.set_toonSpecularThreshold(parseFloat(event.target.value));
            object.refreshSpecular();
        };
    
        createColorPickerSettings(this, specularSettings, watchColorPicker, 'Color: ', 'specularColorPicker');
        createSliderSettings(this, specularSettings, watchToonSpecularThresholdSelector, 'Threshold: ', 0, 1, 0.01, 'toonSpecularThresholdPicker');
    
        this.refreshSpecular();
    }
    
    setupWardSettings(specularSettings){
        var watchSpecularColorPicker = function (object, event) {
            var color = hexToRgb(event.target.value,true);
    
            color[3] = 255;
            object.set_specularColor(color);
            object.refreshSpecular();
        };
        var watchRoughnessSpecularSelector = function (object, event) {
            object.set_roughnessSpecular( parseFloat(event.target.value));
            object.refreshSpecular();
        };
        var watchAnisotropicSpecularSelector = function (object, event) {
            object.set_anisotropicSpecular(parseFloat(event.target.value));
            object.refreshSpecular();
        };
        var watchAngleSpecularSelector = function (object, event) {
            object.set_angleSpecular(parseFloat(event.target.value));
            object.refreshSpecular();
        };
    
        createColorPickerSettings(this, specularSettings, watchSpecularColorPicker, 'Color: ', 'specularColorPicker');
        createSliderSettings(this, specularSettings, watchRoughnessSpecularSelector, 'Roughness: ', 0, 100, 0.1, 'roughnessSpecularPicker');
        createSliderSettings(this, specularSettings, watchAnisotropicSpecularSelector, 'Anisotropic: ',0, 1, 0.01, 'anisotropicSpecularPicker');
        createSliderSettings(this, specularSettings, watchAngleSpecularSelector, 'Angle: ', 'angleSpecularPicker');
    
        this.refreshSpecular();
    }
    
    setupCookTorranceSettings(specularSettings){
        var watchColorPicker = function (object, event) {
            var color = hexToRgb(event.target.value,true);
    
            color[3] = 255;
            object.set_specularColor(color);
            object.refreshSpecular();
        };
        var watchRoughnessSpecularSelector = function (object, event) {
            object.set_roughnessSpecular(parseFloat(event.target.value));
            object.refreshSpecular();
        };
        var watchFresnelSpecularSelector = function (object, event) {
            object.set_fresnel(parseFloat(event.target.value));
            object.refreshSpecular();
        };
        var watchSpecularitySelector = function (object, event) {
            object.set_specularity(parseFloat(event.target.value));
            object.refreshSpecular();
        };
    
        createColorPickerSettings(this, specularSettings, watchColorPicker, 'Color: ', 'specularColorPicker');
        createSliderSettings(this, specularSettings, watchRoughnessSpecularSelector, 'Roughness: ', 0, 100, 0.1, 'roughnessSpecularPicker');
        createSliderSettings(this, specularSettings, watchFresnelSpecularSelector, 'Fresnel: ', 0, 1, 0.01, 'fresnelSpecularPicker');
        createSliderSettings(this, specularSettings, watchSpecularitySelector, 'Specularity: ', 0, 1, 0.01, 'specularitySpecularPicker');
    
        this.refreshSpecular();
    }
    
    
    refreshDiffuse(){
        if(this.diffuseColorPicker!=null) this.diffuseColorPicker.value = rgbAToHex(this.get_diffuseColor(),false);
        if(this.texMixPicker!=null) this.texMixPicker.value = this.get_texMix();
        if(this.materialEmissionPicker!=null){
            this.materialEmissionPicker.value = this.get_materialEmission() ? 'Yes' : 'No';
        }
        if(this.toonThresholdPicker!=null) this.toonThresholdPicker.value = this.get_toonDiffuseThreshold();
        if(this.roughnessPicker!=null) this.roughnessPicker.value = this.get_roughness();
        if(this.emitColorPicker!=null) this.emitColorPicker.value = rgbAToHex(this.get_emitColor(),false);
    }

    setupLambertDiffuse(diffuseSettings){
        var watchColorPicker = function (object, event) {
            var color = hexToRgb(event.target.value,true);
            color[3] = 255;
            object.set_diffuseColor(color);
            object.refreshDiffuse();
        };
        createColorPickerSettings(this,diffuseSettings, watchColorPicker,'Color: ', 'diffuseColorPicker');
    
        var watchTexmixSelector = function (object, event) {
            object.set_texMix(parseFloat(event.target.value));
            object.refreshDiffuse();
        };
    
        createSliderSettings(this, diffuseSettings, watchTexmixSelector, 'Texture Mix: ', 0, 1, 0.01, 'texMixPicker');
    
        this.refreshDiffuse();
    }

    setupToonDiffuse(diffuseSettings){
        this.setupLambertDiffuse(diffuseSettings);
    
        var watchToonThresholdSelector = function (object,event) {
            object.set_toonDiffuseThreshold(parseFloat(event.target.value));
            object.refreshDiffuse();
        };
    
        createSliderSettings(this, diffuseSettings, watchToonThresholdSelector, 'Threshold: ', 0, 1, 0.01, 'toonThresholdPicker');
    
        this.refreshDiffuse();
    }

    setupOrenNayarDiffuse(diffuseSettings){
        this.setupLambertDiffuse(diffuseSettings);
    
        var watchRoughnessSelector = function (object,event) {
            object.set_roughness(parseFloat(event.target.value));
            object.refreshDiffuse();
        };
    
        createSliderSettings(this, diffuseSettings, watchRoughnessSelector, 'Roughness: ', 0, 1, 0.01, 'roughnessPicker');
    
        this.refreshDiffuse();
    }
    

    remove_editor_element(){
        if(this.blockEditor==null) return;
        this.blockEditor.classList.add('not-visible');
        this.blockEditor.classList.remove('visible');
        this.blockEditor.innerHTML="";
        this.blockEditor =  null;
    }

    set_material_uniforms(newMaterialUniforms){
        this.materialUniforms = newMaterialUniforms;
    }

    //Returns the world coordinate of the object 
    get_position(){
        return [this.worldMatrix[3], this.worldMatrix[7], this.worldMatrix[11]];
    }

    get_rotation(){
        // TODO
        return this.rot;
    }

    set_rotation(x,y,z){
        // TODO
        this.rot = [x,y,z];
        this.update_position(0,0,0);
    }

    update_world_matrix(newPos){
        this.worldMatrix = utils.MakeWorldNonUnif(newPos[0],newPos[1],newPos[2],this.rot[0],this.rot[1],this.rot[2],this.scale[0],this.scale[1],this.scale[2]);
        this.refresh_value_editor();
    }

    update_position(dx,dy,dz){
        this.pos[0]+=dx;
        this.pos[1]+=dy;
        this.pos[2]+=dz;

        this.update_world_matrix(this.pos);

        this.children.forEach((element)=>{
            element.update_matrix_from_parent(this);
        });

    }

    refresh_value_editor(){
        if(this.blockEditor==null) return;

        var position = this.get_position();
        var scale = this.scale;
        
        this.posXText = position[0];
        this.posYText = position[1];
        this.posZText = position[2];

        this.scaleXText = scale[0];
        this.scaleYText = scale[1];
        this.scaleZText = scale[2];
    }

    update_matrix_from_parent(parent){
        var relPos = [0.0,0.0,0.0];
        if(parent!=null){
            relPos[0] = this.pos[0] + parent.pos[0];
            relPos[1] = this.pos[1] + parent.pos[1];
            relPos[2] = this.pos[2] + parent.pos[2];
        }else{
            relPos = this.pos;
        }
        this.update_world_matrix(relPos);

        this.children.forEach((element)=>{
            element.update_matrix_from_parent(this);
        });
    }

    set_name(newName){
        this.name = newName;
        this.blockEl.textContent = newName;
        this.blockEl.setAttribute("id",this.name);
    }

    set_scale(x,y,z){
        this.scale = [x,y,z];
        this.update_world_matrix(this.pos);
    }

    delete_block(hard_reset = false){
        if(!this.isDeletable && !hard_reset) return;
        var blockName = this.name;
        blocks = blocks.filter(function(value,index,arr){
            return value.name!=blockName;
          });
        this.children.forEach((element)=>{
            element.delete_block(hard_reset);
        });
        this.blockEl.remove();
    }

    getMaterialUniforms(){
        // return this.oldMaterialUniforms!=null ? this.oldMaterialUniforms : this.materialUniforms;
        return this.materialUniforms;
    }

    get_maxX(withScale = true){
        return withScale ? this.objectBuffer.boundingBox.maxX*this.scale[0] : this.objectBuffer.boundingBox.maxX;
    }

    get_minX(withScale = true){
        return withScale ? this.objectBuffer.boundingBox.minX*this.scale[0] : this.objectBuffer.boundingBox.minX;
    }

    get_maxY(withScale = true){
        return withScale ? this.objectBuffer.boundingBox.maxY*this.scale[1] : this.objectBuffer.boundingBox.maxY;
    }

    get_minY(withScale = true){
        return withScale ? this.objectBuffer.boundingBox.minY*this.scale[1] : this.objectBuffer.boundingBox.minY;
    }

    get_maxZ(withScale = true){
        return withScale ? this.objectBuffer.boundingBox.maxZ*this.scale[2] : this.objectBuffer.boundingBox.maxZ;
    }

    get_minZ(withScale = true){
        return withScale ? this.objectBuffer.boundingBox.minZ*this.scale[2] : this.objectBuffer.boundingBox.minZ;
    }

    set_texture(texture, textureName){
        this.materialUniforms['u_texture'] = texture;
        if(textureName != null){
            this.textureName = textureName;
        }
    }

    get_texture_name(){
        return this.textureName;
    }

    get_texture(){
        return this.materialUniforms['u_texture'];
    }
}

function get_1x1_texture_mono(color = [255,255,255,255]){
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,new Uint8Array(color));
    return texture;
}

class Character extends Block{
    constructor(scale, pos, rot){
        var materialUniforms = {}
        super(scale,pos, rot, materialUniforms, objectsBuffer['ghost'],'ghost', "Character",false, [255,255,255,255]);
        this.grounded = true;
        this.looking_angle =0.0;
        this.speedY = 0;
        this.move_speed = 50;
        this.isDeletable = false;
    }

    reset(){
        this.pos = [0.0,0.0,0.0];
        this.rot = [0.0, -90.0, 0.0];
        this.looking_angle = 0.0;
        while(this.check_collisions(this.pos)){
            this.pos[1] += 1;
        }
        this.update_world_matrix(this.pos);
        this.grounded = true;
        this.speedY = 0;
        this.move_speed = 50;
    }

    //Extension of update world matrix, to avoid character collusion
    update_position(dx,dy,dz){
        var newPos = [this.pos[0] + dx ,this.pos[1] + dy, this.pos[2] + dz]; 
        if(!isConstructModeEnabled && this.check_collisions(newPos)){
            if(dx == 0 && dy > 0 && dz == 0){
                this.speedY = 0;
            }
            dx = 0;
            dy = 0;
            dz = 0;
        }
        super.update_position(dx,dy,dz);
    }

    //Returns true if finds a collision in the passed posiiton
    check_collisions(pos){
        pos.push(1);
        for(i = 1; i < blocks.length; i++){
            var block = blocks[i];   
            var inverseWorldMatrix = utils.invertMatrix(block.worldMatrix);
            var localPos = utils.multiplyMatrixVector(inverseWorldMatrix, pos);
            //block position box         
            var x_bounds = [ block.get_maxX(false), block.get_minX(false)];
            var y_bounds = [ block.get_maxY(false), block.get_minY(false)];
            var z_bounds = [ block.get_maxZ(false), block.get_minZ(false)];
            //Checks if inside
            var x = localPos[0]  < x_bounds[0] && localPos[0] > x_bounds[1];
            var y = localPos[1]  < y_bounds[0] && localPos[1] > y_bounds[1];
            var z = localPos[2]  < z_bounds[0] && localPos[2] > z_bounds[1];
            if(x && y && z){
                if(i == 1){
                    finish_game(true);
                }
                return true;  
            }

        };
        return false;
    }
    //Returns a vector with the looking direction of the object
    get_direction(){
        return normaliseVector([Math.cos(utils.degToRad(this.looking_angle)), 0, Math.sin(utils.degToRad(this.looking_angle))]);

    }

    get_perpendicular_direction(){
      return [this.get_direction()[2], 0.0, -this.get_direction()[0]];

    }

    toggle_jump(){
        if(this.grounded){
            this.speedY = 100;            
            this.grounded = false;
        }
    }

    gravity(dt){
        if(!this.grounded ){
            if(this.speedY > -120){
                this.speedY -= 150*dt;
            }else{
                this.speedY = -120 ;
            }
            this.update_position(0, this.speedY * dt, 0);
        }
        if(this.get_position()[1] < -200){
            this.reset();
            finish_game(false);
        }
    }

    turn(delta = 0.1){
        this.looking_angle += delta * (180 / Math.PI)* 0.5; 
        this.rot[1] += delta * (180 / Math.PI) * 0.5; 
        this.update_world_matrix(this.get_position());
    }

    moveStraight(dt){
        var d =  this.get_direction();
        this.update_position(this.move_speed*d[0]*dt, this.move_speed*d[1]*dt, this.move_speed*d[2]*dt);
    }
    
    moveBackwards(dt){
        var d =  this.get_direction();
        this.update_position(-this.move_speed*d[0]*dt, -this.move_speed*d[1]*dt, -this.move_speed*d[2]*dt);
    }

    moveRight(dt){
        var d = this.get_perpendicular_direction();
        this.update_position(-this.move_speed*d[0]*dt, this.move_speed*d[1]*dt, -this.move_speed*d[2]*dt);
    }

    moveLeft(dt){
        var d = this.get_perpendicular_direction();
        this.update_position(this.move_speed*d[0]*dt, this.move_speed*d[1]*dt, this.move_speed*d[2]*dt);
    }
}

class Platform extends Block{
    constructor(scale,pos, rot, objectBuffer,buffer_name, name = 'Platform',isDeletable = true, color = null, textureName = null){
        var materialUniforms = {};
        if(color == null){
            var rnd = [Math.random(),Math.random(),Math.random(),1];
            color = [rnd[0]* 255, rnd[1] * 255 , rnd[2] * 255, 255];
        }
        super(scale, pos, rot, materialUniforms, objectBuffer,buffer_name, name, isDeletable, color, textureName);
    }


    draw_element_editor(){
        super.draw_element_editor();
        this.blockEditor = document.getElementById('block-editor');

        this.blockEditor.appendChild(document.createElement('br'));

        // Add texture selection button
        var textureSelText = document.createElement('div');
        textureSelText.classList.add('editor-setting-name');
        textureSelText.textContent = 'Texture: ';
        this.blockEditor.appendChild(textureSelText);
        var selectList = document.createElement("select");
        textureSelText.appendChild(selectList);
        var option = document.createElement("option");
        option.value = '';
        option.text = '';
        selectList.appendChild(option);
        for (let [key, value] of textures) {
            var option = document.createElement("option");
            option.value = key;
            option.text = key;
            selectList.appendChild(option);
        }
        if(this.textureName!=null){
            selectList.selected = this.textureName;
        }
        var textureSelListener = function(block,ev){
            var textureName = ev.target.value;
            if(textureName!=''){
                block.set_texture(textures.get(textureName), textureName);
            }
            else{
                block.textureName = null;
                block.change_color(block.get_diffuseColor())
            }
        };
        selectList.addEventListener("change", textureSelListener.bind(null,this), false);


        if(this.delButtonContainer!=null)this.blockEditor.appendChild(this.delButtonContainer);
    }

    refresh_value_editor(){
        super.refresh_value_editor();
        if(this.blockEditor!=null){
            this.diffuseColorPicker.value = rgbAToHex(RGBAcolor(this.get_diffuseColor()) , true);
            //this.opacitySelector = this.get_diffuseColor()[3]*255;
        }
    }

    change_color(color){
        color = RGBAcolor(color);
        this.set_diffuseColor(color);
        if(this.textureName != null){
            this.refresh_value_editor();
            return;
        }
        var texture = get_1x1_texture_mono(color);
        this.set_texture(texture);
        this.refresh_value_editor();
    }
}

function check_if_over(blocks, dt){
    //Character Position
    var c_pos = blocks[0].get_position();
    var new_y = -Infinity;
    for(i = 1; i < blocks.length; i++){
        b = blocks[i];
        b_pos = b.get_position();
        //Check on the surface
        x = (c_pos[0]) <= (b_pos[0] + b.get_maxX())  && (c_pos[0]) >= (b_pos[0] + b.get_minX());
        z = (c_pos[2]) <= (b_pos[2] + b.get_maxZ())  && (c_pos[2]) >= (b_pos[2] + b.get_minZ());
        //Check if at the right height
        var epsilon = 0.2;
        y =  (c_pos[1] + blocks[0].get_minY()) >= (b_pos[1] + b.get_maxY()) - epsilon;
        y = y && (c_pos[1] + blocks[0].get_minY()) <= (b_pos[1] + b.get_maxY()) + epsilon; 
        y = y || ((c_pos[1] + blocks[0].get_minY()) >=  (b_pos[1] + b.get_maxY()) && (c_pos[1] + blocks[0].get_minY() + (blocks[0].speedY*dt)) <= (b_pos[1] + b.get_maxY()));
        //Store the surface level
        var temp_y = b_pos[1] + b.get_maxY();
        if(x && y && z && blocks[0].speedY <= 0 && new_y<temp_y){
            new_y = temp_y;
            if(i == 1){
                finish_game(true);
            }
        }
    }
    if(new_y!=-Infinity){
        blocks[0].grounded = true;
        blocks[0].update_world_matrix([c_pos[0], new_y  - blocks[0].get_minY(),c_pos[2]]);
        blocks[0].speedY = 0.0;
        return 
    }
    blocks[0].grounded = false; 
   
}

class BoundingBox{
    constructor(maxX,minX,maxY,minY,maxZ,minZ){
        this.maxX = maxX;
        this.minX = minX;
        this.maxY = maxY;
        this.minY = minY;
        this.maxZ = maxZ;
        this.minZ = minZ;
    }

    update_value(point){
        if(point[0]>this.maxX) this.maxX = point[0];
        else if(point[0]<this.minX) this.minX = point[0];

        if(point[1]>this.maxY) this.maxY = point[1];
        else if(point[1]<this.minY) this.minY = point[1];

        if(point[2]>this.maxZ) this.maxZ = point[2];
        else if(point[2]<this.minZ) this.minZ = point[2];
    }
}