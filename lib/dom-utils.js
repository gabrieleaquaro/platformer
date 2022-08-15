function createPositionSettings(creator, settings, handler, fieldX, fieldY, fieldZ){
    // Add position editor
    var positionEditor = document.createElement('div');
    positionEditor.textContent = 'Position';
    positionEditor.classList.add('editor-setting-name');
    settings.appendChild(positionEditor);
    positionEditor.appendChild(document.createElement('br'));
    // X
    var posX = document.createElement('div');
    posX.textContent="X: ";
    posX.classList.add('editor-subsetting-name');
    positionEditor.appendChild(posX);
    creator[fieldX] = document.createElement("INPUT");
    creator[fieldX].setAttribute("type", "text");
    posX.appendChild(creator[fieldX]);
    // Y
    var posY = document.createElement('div');
    posY.textContent="Y: ";
    posY.classList.add('editor-subsetting-name');
    positionEditor.appendChild(posY);
    creator[fieldY] = document.createElement("INPUT");
    creator[fieldY].setAttribute("type", "text");
    posY.appendChild(creator[fieldY]);
    // Z
    var posZ = document.createElement('div');
    posZ.textContent="Z: ";
    posZ.classList.add('editor-subsetting-name');
    positionEditor.appendChild(posZ);
    creator[fieldZ] = document.createElement("INPUT");
    creator[fieldZ].setAttribute("type", "text");
    posZ.appendChild(creator[fieldZ]);

    creator[fieldX].addEventListener('keydown',handler.bind(null,creator),false);
    creator[fieldY].addEventListener('keydown',handler.bind(null,creator),false);
    creator[fieldZ].addEventListener('keydown',handler.bind(null,creator),false);
}

function createColorPickerSettings(creator, settings, handler, name, colorField){
    if(creator == null) var creator = {};

    var colorPickerContainer = document.createElement('div');
    colorPickerContainer.id = colorField;
    colorPickerContainer.classList.add('editor-setting-name');
    colorPickerContainer.textContent = name;
    settings.appendChild(colorPickerContainer);
    creator[colorField] = document.createElement('INPUT');
    creator[colorField].setAttribute("type", "color");
    colorPickerContainer.appendChild(creator[colorField]);

    creator[colorField].addEventListener("change", handler.bind(null,creator), false);

    return creator[colorField];
}

function createSliderSettings(creator, settings, handler, name, min, max, step, sliderField){
    if(creator==null) creator = {};
    var sliderContainer = document.createElement('div');
    sliderContainer.id = sliderField;
    sliderContainer.classList.add('editor-setting-name');
    sliderContainer.textContent = name;
    settings.appendChild(sliderContainer);
    creator[sliderField] = document.createElement('INPUT');
    creator[sliderField].setAttribute("type", "range");
    creator[sliderField].classList.add('slider');
    creator[sliderField].setAttribute("min", min);
    creator[sliderField].setAttribute("step", step);
    creator[sliderField].setAttribute("max", max);
    sliderContainer.appendChild(creator[sliderField]);

    creator[sliderField].addEventListener("change", handler.bind(null,creator), false);

    return creator[sliderField];
}
