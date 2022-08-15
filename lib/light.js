var lightCounter = 0;

var lights = [];
var selectedLight = -1;

const defaultValues = {
    ambientType: "ambient",
	diffuseType: "lambert",
	specularType: "phong",
	ambientLightColor: "#222222",
	diffuseColor: [255,255,255,255],
	specularColor: [255,255,255,255],
	ambientLightLowColor: "#002200",
	SHLeftLightColor: "#550055",
	SHRightLightColor: "#005555",
	ambientMatColor: "#00ffff",
	emitColor: [255,255,255,255],

    pos: [20,30,50],
	dirTheta: 60,
	dirPhi: 45,
	coneOut: 30,
	coneIn: 80,
	decay: 0,
	target: 61,

	aDirTheta: 0,
	aDirPhi: 0,
	dTexMix: 0.9,
	specShine: 1,
    specRoughness: 1, // The same as specShine
	dToonTh: 0.5,
    ONroughness: 0.5, // The same as dToonTh
	sToonTh: 0.9,
    fresnel: 0.9, //The same as sToonTh
	// sspecKwAng: 0.8,
    angleWard: 0.8, // The same as sspecKwAng
    anisotropicAmount: 0.9, //The same as sToonTh
    specularity: 0.8, // The same as sspeckwang
	
}

const lightType = {
    NONE: "none",
    SPOT: "spot",
    POINT: "point",
    DIRECT: "direct",
}

const ambientType = {
    NONE: "none",
    AMBIENT: "ambient",
    HEMISPHERIC: "hemispheric",
    SPHERICAL_HARMONIC: "SH",
}

const diffuseType = {
    NONE: "none",
    LAMBERT: "lambert",
    TOON: "toon",
    OREN_NAYAR: "orenNayar",
}

const specularType = {
    NONE: "none",
    PHONG: "phong",
    BLINN: "blinn",
    TOON_PHONG: "toonP",
    TOON_BLINN: "toonB",
    WARD: "ward",
    COOK_TORRANCE_MFS: "cookTorrance",
    COOK_TORRANCE_GGX: "cookTorranceGGX",
}

const emissionType = {
    NO : "No",
    YES : "Yes"
}

valTypeDecoder = {
	lightType:{
		none: [0,0,0,0],
		direct: [1,0,0,0],
		point: [0,1,0,0],
		spot: [0,0,1,0]
	},
	ambientType:{
		none: [0,0,0,0],
		ambient: [1,0,0,0],
		hemispheric: [0,1,0,0],
		SH: [0,0,1,0]
	},
	diffuseType:{
		none: [0,0,0,0],
		lambert: [1,0,0,0],
		toon: [0,1,0,0],
		orenNayar: [0,0,1,0]
	},
	specularType:{
		none:  [0,0,0,0],
		phong: [1,0,0,0],
		blinn: [0,1,0,0],
		toonP: [1,0,1,0],
		toonB: [0,1,1,0],
		ward:         	 [0,1,0,1],
		cookTorrance: 	 [1,0,0,1],
		cookTorranceGGX: [1,0,1,1]
	},
    emissionType:{
        No : [0,0,0,0],
        Yes : [1,0,0,0]
    }
}

class Light{
    constructor(type=lightType.NONE, color=[255,255,255,255]){
        this.name = 'Light-'+lightCounter;
        lightCounter+=1;
        this.type = type
        this.color = color;
        this.position = defaultValues['pos'];
        this.thetaDir = defaultValues['dirTheta'];
        this.phiDir = defaultValues['dirPhi'];
        this.coneOut = defaultValues['coneOut'];
        this.coneIn = defaultValues['coneIn'];
        this.decay = defaultValues['decay'];
        this.targetDistance = defaultValues['target'];
    }

    getPosition(){
        return this.position
    }

    setPosition(position){
        this.position = position;
        this.refreshSettingsValue();
    }

    setColor(newColor){
        this.color = newColor;
        this.refreshSettingsValue();
    }

    getColor(){
        return this.color;
    }

    refreshSettingsValue(){
        if(this.lightTypeSettings==null) return;

        if(this.colorPicker!=null) this.colorPicker.value = rgbAToHex(this.getColor(), true);

        var position = this.getPosition();
        if(this.posXText!=null && this.posYText!=null && this.posZText!=null){
            this.posXText.value = position[0];
            this.posYText.value = position[1];
            this.posZText.value = position[2];
        }
        
        if(this.thetaPicker!=null && this.phiPicker!=null){
            this.thetaPicker.value = this.thetaDir;
            this.phiPicker.value = this.phiDir; 
        }


        if(this.decayPicker!=null) this.decayPicker.value = this.decay;
        if(this.targetDistancePickerText!=null) this.targetDistancePickerText.value = this.targetDistance;
    }

    setupPositionSettings(){
        // Enter handling
        var enterHandlerPos = function(light,e){
            if(e.keyCode==13){      
                light.setPosition([parseFloat(light.posXText.value), parseFloat(light.posYText.value), parseFloat(light.posZText.value)]);
            }
        };

        createPositionSettings(this, this.lightTypeSettings, enterHandlerPos, 'posXText', 'posYText', 'posZText');
    }

    setupColorPicker(){
        // Handle color change
        var watchColorPicker = function (light,event) {
            var color = hexToRgb(event.target.value,true);

            color[3] = 255;
            light.setColor(color);
        };

        createColorPickerSettings(this,this.lightTypeSettings,watchColorPicker, 'Color: ', 'colorPicker');
    }

    addDecaySetting(){
        var watchDecaySelector = function (light,event) {
            light.setDecay(parseFloat(event.target.value));
        };

        createSliderSettings(this,this.lightTypeSettings, watchDecaySelector, 'Decay: ', 0, 2, 0.01, 'decayPicker');
    }

    addTargetDistanceSetting(){
        var targetDistanceHandler = function (light,ev) {
            light.setTargetDistance(parseFloat(ev.target.value));
        };

        createSliderSettings(this,this.lightTypeSettings, targetDistanceHandler, 'Target Distance: ', 0, 10, 0.01, 'targetDistancePickerText');
    }

    setupLightSettings(lightTypeSettings){
        this.lightTypeSettings = lightTypeSettings;

        this.setupColorPicker();
        
        this.refreshSettingsValue();
    }

    getDecay(){
        return this.decay;
    }

    addDirectionSettings(){
        // Add Dir Theta and Phi
        var directionContainer = document.createElement('div');
        directionContainer.classList.add('editor-setting-name');
        directionContainer.textContent = 'Direction:'
        this.lightTypeSettings.appendChild(directionContainer);

        var watchThetaSelector = function (light,event) {
            light.setTheta(parseFloat(event.target.value));
        };
        var watchPhiSelector = function (light,event) {
            light.setPhi(parseFloat(event.target.value));
        };

        createSliderSettings(this, directionContainer, watchThetaSelector, 'Theta: ', 0, 180, 0.5, 'thetaPicker');
        createSliderSettings(this, directionContainer, watchPhiSelector, 'Phi: ', -180, 180, 0.5, 'phiPicker');
    }

    setDecay(decay){
        this.decay = decay;
        this.refreshSettingsValue();
    }

    removeActiveLight(){
        if(this.lightTypeSettings==null) this.lightTypeSettings = document.getElementById('light-type-settings');
        this.lightTypeSettings.innerHTML='';
        this.lightTypeSettings = null;
    }

    getTheta(){
        return this.thetaDir;
    }

    setTheta(thetaDir){
        this.thetaDir = thetaDir;
        this.refreshSettingsValue();
    }

    getPhi(){
        return this.phiDir;
    }

    setPhi(phiDir){
        this.phiDir = phiDir;
        this.refreshSettingsValue();
    }

    getTargetDistance(){
        return this.targetDistance;
    }

    setTargetDistance(targetDistance){
        this.targetDistance = targetDistance;
        this.refreshSettingsValue();
    }

    getLightType(){
        return this.type;
    }

    getConeIn(){
        return this.coneIn;
    }

    setConeIn(coneIn){
        this.coneIn = coneIn;
        this.refreshSettingsValue();
    }

    getConeOut(){
        return this.coneOut;
    }

    setConeOut(coneOut){
        this.coneIn = coneOut;
        this.refreshSettingsValue();
    }
}

class NoneLight extends Light{
    constructor(){
        super(lightType.NONE);
    }

    setupLightSettings(lightTypeSettings){
        return;
    }

}

class PointLight extends Light{
    constructor(color, position=defaultValues['pos'], decay=defaultValues['decay'], targetDistance=defaultValues['target']){
        super(lightType.POINT,color);
        this.decay = decay;
        this.targetDistance = targetDistance;
        this.position = position;
    }

    refreshSettingsValue(){
        super.refreshSettingsValue();
    }

    setupLightSettings(lightTypeSettings){
        this.lightTypeSettings = lightTypeSettings;

        this.addDecaySetting();
        
        this.addTargetDistanceSetting();

        this.setupPositionSettings();

        super.setupLightSettings(lightTypeSettings);

        // NOTE: not needed the refresh since done by the parent
        // this.refreshSettingsValue();
    }
}

class DirectLight extends Light{
    constructor(color){
        super(lightType.DIRECT,color);
    }

    refreshSettingsValue(){
        super.refreshSettingsValue();
    }

    setupLightSettings(lightTypeSettings){
        this.lightTypeSettings = lightTypeSettings;

        this.addDirectionSettings();

        super.setupLightSettings(lightTypeSettings);

        // NOTE: not needed the refresh since done by the parent
        // this.refreshSettingsValue();
    }
}

class SpotLight extends Light{
    constructor(color, position=defaultValues['pos'], thetaDir=defaultValues['dirTheta'], phiDir=defaultValues['dirPhi'], decay=defaultValues['decay'], targetDistance=defaultValues['target'], coneIn=defaultValues['coneIn'], coneOut=defaultValues['coneOut']){
        super(lightType.SPOT,color);
        this.thetaDir = thetaDir;
        this.phiDir = phiDir;
        this.decay = decay;
        this.targetDistance = targetDistance;
        this.coneIn = coneIn;
        this.coneOut = coneOut;
        this.position = position;
    }

    refreshSettingsValue(){
        super.refreshSettingsValue();

        if(this.inPicker) this.inPicker.value = this.coneIn;
        if(this.outPicker) this.outPicker.value = this.coneOut;
    }

    setupLightSettings(lightTypeSettings){
        this.lightTypeSettings = lightTypeSettings;

        this.addDirectionSettings();

        this.addDecaySetting();

        this.addTargetDistanceSetting();

        this.addConeSetting();

        this.setupPositionSettings();

        super.setupLightSettings(lightTypeSettings);

        // NOTE: not needed the refresh since done by the parent
        // this.refreshSettingsValue();
    }

    addConeSetting(){
        // Add cone settings
        var coneEditor = document.createElement('div');
        coneEditor.textContent = 'Cone';
        coneEditor.classList.add('editor-setting-name');
        this.lightTypeSettings.appendChild(coneEditor);
        // coneEditor.appendChild(document.createElement('br'));

        var watchOutPicker = function (light,event) {
            light.setConeOut(parseFloat(event.target.value));   
        };
        var watchInPicker = function (light,event) {
            light.setConeIn(parseFloat(event.target.value));   
        };

        createSliderSettings(this, coneEditor, watchOutPicker, 'Out: ', 0, 150, 0.5, 'outPicker');
        createSliderSettings(this, coneEditor, watchInPicker, 'In: ', 0, 1, 0.1, 'inPicker');
    }
}

function updateLightSettings(light){
    var lightSettings = document.getElementById('light-settings');

    switchVisibility(lightSettings,true);

    var typeSelection = document.getElementById('light-type');
    typeSelection.innerHTML='';
    for(var i=0; i<Object.keys(lightType).length ; i++){
        var option = document.createElement('option');
        option.setAttribute('value',Object.values(lightType)[i]);
        option.textContent = Object.values(lightType)[i];
        typeSelection.appendChild(option);
    }
    typeSelection.value = light.type;

    var lightTypeSettings = document.getElementById('light-type-settings');
    light.setupLightSettings(lightTypeSettings);
}


function setupLightTypeSettings(type){
    var lightTypeSettings = document.getElementById('light-type-settings');
    var oldLight = selectedLight!=-1 ? lights[selectedLight] : new NoneLight();

    var newLight;
    switch (type){
        case lightType.NONE:
            newLight = new NoneLight();
            break;
        case lightType.SPOT:
            newLight = new SpotLight(oldLight.getColor(), oldLight.getPosition(),oldLight.getTheta(), oldLight.getPhi(), oldLight.getDecay(), oldLight.getTargetDistance(), null, null);
            break;
        case lightType.POINT:
            newLight = new PointLight(oldLight.getColor(), oldLight.getPosition(), oldLight.getDecay(), oldLight.getTargetDistance());
            break;
        case lightType.DIRECT:
            newLight = new DirectLight(oldLight.getColor());
            break;
        default:
            console.log('Wrong light type');
            break;
    }
    newLight.setupLightSettings(lightTypeSettings);
    lights[selectedLight] = newLight;
}


function setupLight(){
    var lightSelection = document.getElementById('light-selection');

    var option = document.createElement('option');
    option.setAttribute('value',-1);
    option.textContent = '';
    lightSelection.appendChild(option);

    for(var i=0; i<lights.length ; i+=1){
        addNewLightVoice(i);
    }
    add_light(true);

    //Initial SEtup of ambient light
    load_ambientSettings()
}

function addNewLightVoice(i){
    var lightSelection = document.getElementById('light-selection');

    var option = document.createElement('option');
    option.setAttribute('value',i);
    option.textContent = lights[i].name;
    lightSelection.appendChild(option);
}

function lightSelection(ev){
    if(selectedLight!=-1) lights[selectedLight].removeActiveLight();

    selectedLight = ev.target.value;
    if(selectedLight!=-1)
        updateLightSettings(lights[selectedLight]);
    else{
        var lightSettings = document.getElementById('light-settings');
        switchVisibility(lightSettings,false);
    }
};

function updateLightType(ev){
    if(selectedLight!=-1) lights[selectedLight].removeActiveLight();

    var newType = ev.target.value;
    updateType(newType);
}

function add_light(light0 = false){
    if(lights.length==100) return;
    if(light0){
        lights.push(new DirectLight([50,50,50,255]));
    }else{
        lights.push(new Light());
    }    
    addNewLightVoice(lights.length-1);
}

function updateType(type){
    var typeSelection = document.getElementById('light-type');
    typeSelection.value = type;

    setupLightTypeSettings(type);
}

// Ambient section
var ambientSelected = ambientType.HEMISPHERIC;

document.addEventListener('DOMContentLoaded', (event) => {
    var ambientSelection = document.getElementById('ambient-selection');

    for(var i=0; i<Object.keys(ambientType).length ; i++){
        var option = document.createElement('option');
        option.setAttribute('value',Object.values(ambientType)[i]);
        option.textContent = Object.values(ambientType)[i];
        ambientSelection.appendChild(option);
    }
    ambientSelection.value = ambientSelected;
});


var colorPickerAmbient = null;
var materialAmbientPicker = null;
var upperColorPicker = null;
var lowerColorPicker = null;
var rightColorPicker = null;
var leftColorPicker = null;
var frontColorPicker = null;
var thetaPicker = null;
var phiPicker = null;

var ambientColor = [255,255,255,255];
var materialAmbientColor = [0,0,0,255];
var upperColor = [150,150,150,255];
var lowerColor = [0,0,0,255];
var rightColor = [255,255,255,255];
var leftColor = [255,255,255,255];
var frontColor = [255,255,255,255];
var ambientDirTheta = defaultValues['aDirTheta'];
var ambientDirPhi = defaultValues['aDirPhi'];

function ambientChange(event){
    ambientSelected = event.target.value;

    var ambientSettings = document.getElementById('ambient-settings');

    // Reset
    colorPickerAmbient = null;
    materialAmbientPicker = null;
    upperColorPicker = null;
    lowerColorPicker = null;
    thetaPicker = null;
    phiPicker = null;

    ambientSettings.innerHTML='';
    switch(ambientSelected){
        case ambientType.NONE:
            break;
        case ambientType.AMBIENT:
            setupAmbientTypeSettings(ambientSettings);
            break;
        case ambientType.HEMISPHERIC:
            setupHemisphericTypeSettings(ambientSettings);
            break;
        case ambientType.SPHERICAL_HARMONIC:
            setupSphericHarmonicTypeSettings(ambientSettings);
            break;
        default:
            console.log("Wrong ambient type!");
            break;
    }
}

function load_ambientSettings(){
    var ambientSettings = document.getElementById('ambient-settings');
    ambientSettings.innerHTML='';

    // Reset
    colorPickerAmbient = null;
    materialAmbientPicker = null;
    upperColorPicker = null;
    lowerColorPicker = null;
    thetaPicker = null;
    phiPicker = null;

    switch(ambientSelected){
        case ambientType.NONE:
            break;
        case ambientType.AMBIENT:
            setupAmbientTypeSettings(ambientSettings);
            break;
        case ambientType.HEMISPHERIC:
            setupHemisphericTypeSettings(ambientSettings);
            break;
        case ambientType.SPHERICAL_HARMONIC:
            setupSphericHarmonicTypeSettings(ambientSettings);
            break;
        default:
            console.log("Wrong ambient type!");
            break;
    }
}

function refreshAmbient(){
    if(colorPickerAmbient!=null) colorPickerAmbient.value = rgbAToHex(ambientColor,true);
    if(materialAmbientPicker!=null) materialAmbientPicker.value = rgbAToHex(materialAmbientColor,true);

    if(upperColorPicker!=null) upperColorPicker.value = rgbAToHex(upperColor,true);
    if(lowerColorPicker!=null) lowerColorPicker.value = rgbAToHex(lowerColor,true);
    if(rightColorPicker!=null) rightColorPicker.value = rgbAToHex(rightColor,true);
    if(leftColorPicker!=null) leftColorPicker.value = rgbAToHex(leftColor,true);
    if(frontColorPicker!=null) frontColorPicker.value = rgbAToHex(frontColor,true);

    if(thetaPicker!=null) thetaPicker.value = ambientDirTheta;
    if(phiPicker!=null) phiPicker.value = ambientDirPhi;
}

function addColorSetting(ambientSettings){
    // Handle color change
    var watchColorPicker = function (object, event) {
        var color = hexToRgb(event.target.value,true);

        color[3] = 255;
        ambientColor = color;
        refreshAmbient();
    };

    colorPickerAmbient = createColorPickerSettings(null, ambientSettings, watchColorPicker, 'Ambient Color: ', 'colorPickerAmbient');
}

function addMaterialAmbientSetting(ambientSettings){
    // Handle color change
    var watchColorPicker = function (object, event) {
        var color = hexToRgb(event.target.value,true);

        color[3] = 255;
        materialAmbientColor = color;
        refreshAmbient();
    };

    materialAmbientPicker = createColorPickerSettings(null, ambientSettings, watchColorPicker, 'Material Ambient Color: ', 'materialAmbientPicker');
}


function setupAmbientTypeSettings(ambientSettings){
    addColorSetting(ambientSettings);

    // addMaterialAmbientSetting(ambientSettings);

    refreshAmbient();
}

function addLowerAndUpperColorSetting(ambientSettings){
    // Handle color change
    var watchUpperColorPicker = function (object, event) {
        var color = hexToRgb(event.target.value,true);

        color[3] = 255;
        upperColor = color;
        refreshAmbient();
    };
    // Handle color change
    var watchLowerColorPicker = function (object, event) {
        var color = hexToRgb(event.target.value,true);

        color[3] = 255;
        lowerColor = color;
        refreshAmbient();
    };

    upperColorPicker = createColorPickerSettings(null, ambientSettings, watchUpperColorPicker, 'Upper Color: ', 'upperColorPicker');
    lowerColorPicker = createColorPickerSettings(null, ambientSettings, watchLowerColorPicker, 'Lower Color: ', 'lowerColorPicker');
}

function addAmbientDirectionPicker(ambientSettings){

    // Add Dir Theta and Phi
    var directionContainer = document.createElement('div');
    directionContainer.classList.add('editor-setting-name');
    directionContainer.textContent = 'Direction:'
    ambientSettings.appendChild(directionContainer);

    var watchThetaSelector = function (light,event) {
        ambientDirTheta = parseFloat(event.target.value);
        refreshAmbient();
    };
    var watchPhiSelector = function (light,event) {
        ambientDirPhi = parseFloat(event.target.value);
        refreshAmbient();
    };

    thetaPicker = createSliderSettings(null, ambientSettings, watchThetaSelector, 'Theta: ', 0, 180, 0.5, 'thetaPicker');
    phiPicker = createSliderSettings(null, ambientSettings, watchPhiSelector, 'Phi: ', -180, 180, 0.5, 'phiPicker');
}

function setupHemisphericTypeSettings(ambientSettings){

    addLowerAndUpperColorSetting(ambientSettings);

    addAmbientDirectionPicker(ambientSettings);

    // addMaterialAmbientSetting(ambientSettings);

    refreshAmbient();

}

function addColorHarmonicSetting(ambientSettings,name,picker,variable){
    var watchColorPicker = function (object, event) {
        var color = hexToRgb(event.target.value,true);

        color[3] = 255;
        variable = color;
        refreshAmbient();
    };

    picker = createColorPickerSettings(null, ambientSettings, watchColorPicker, name, 'picker');
}

function setupSphericHarmonicTypeSettings(ambientSettings){
    var watchUpperColorPicker = function (object, event) {
        var color = hexToRgb(event.target.value,true);

        color[3] = 255;
        upperColor = color;
        refreshAmbient();
    };
    upperColorPicker = createColorPickerSettings(null, ambientSettings, watchUpperColorPicker, 'Upper Color: ', 'upperColorPicker');

    var watchRightColorPicker = function (object, event) {
        var color = hexToRgb(event.target.value,true);

        color[3] = 255;
        rightColor = color;
        refreshAmbient();
    };
    rightColorPicker = createColorPickerSettings(null, ambientSettings, watchRightColorPicker, 'Right Color: ', 'rightColorPicker');

    var watchLeftColorPicker = function (object, event) {
        var color = hexToRgb(event.target.value,true);

        color[3] = 255;
        leftColor = color;
        refreshAmbient();
    };
    leftColorPicker = createColorPickerSettings(null, ambientSettings, watchLeftColorPicker, 'Left Color: ', 'leftColorPicker');

    var watchFrontColorPicker = function (object, event) {
        var color = hexToRgb(event.target.value,true);

        color[3] = 255;
        frontColor = color;
        refreshAmbient();
    };
    frontColorPicker = createColorPickerSettings(null, ambientSettings, watchFrontColorPicker, 'Front Color: ', 'frontColorPicker');

    // addMaterialAmbientSetting(ambientSettings);

    refreshAmbient();
}

// Event listener helper

function diffuseChange(object,event){
    object.set_diffuseType(event.target.value);

    // Reset
    object.diffuseColorPicker = null;
    object.texMixPicker = null;
    object.materialEmissionPicker = null;
    object.toonThresholdPicker = null;
    object.roughnessPicker = null;
    object.emitColorPicker = null;

    diffuseUpdate(object);
}

function diffuseUpdate(object){
    object.diffuseSettings.innerHTML='';
    switch(object.get_diffuseType()){
        case valTypeDecoder['diffuseType'][diffuseType.NONE]:
            break;
        case valTypeDecoder['diffuseType'][diffuseType.LAMBERT]:
            object.setupLambertDiffuse(object.diffuseSettings);
            break;
        case valTypeDecoder['diffuseType'][diffuseType.TOON]:
            object.setupToonDiffuse(object.diffuseSettings);
            break;
        case valTypeDecoder['diffuseType'][diffuseType.OREN_NAYAR]:
            object.setupOrenNayarDiffuse(object.diffuseSettings);
            break;
        default:
            console.log("Wrong diffuse type!");
            break;
    }
}

function specularChange(object,event){
    object.set_specularType(event.target.value);

    // Reset
    object.specularColorPicker = null;
    object.specularShinePicker = null;
    object.toonSpecularThresholdPicker = null;
    object.roughnessSpecularPicker = null;
    object.anisotropicSpecularPicker = null;
    object.angleSpecularPicker = null;
    object.fresnelSpecularPicker = null;
    object.specularitySpecularPicker = null;

    specularUpdate(object);
}

function specularUpdate(object){
    object.specularSettings.innerHTML='';
    switch(object.get_specularType()){
        case valTypeDecoder['specularType'][specularType.NONE]:
            break;
        case valTypeDecoder['specularType'][specularType.PHONG]:
        case valTypeDecoder['specularType'][specularType.BLINN]:
            object.setupPhongOrBlinnSettings(object.specularSettings);
            break;
        case valTypeDecoder['specularType'][specularType.TOON_PHONG]:
          
        case valTypeDecoder['specularType'][specularType.TOON_BLINN]:
            object.setupToonSettings(object.specularSettings);
            break;
        case valTypeDecoder['specularType'][specularType.WARD]:
            object.setupWardSettings(object.specularSettings);
            break;
        case valTypeDecoder['specularType'][specularType.COOK_TORRANCE_MFS]:
        case valTypeDecoder['specularType'][specularType.COOK_TORRANCE_GGX]:
            object.setupCookTorranceSettings(object.specularSettings);
            break;
        default:
            console.log("Wrong specular type!");
            break;
    }
}