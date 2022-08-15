function load_level(event){
   level_file = event.target.files[0]
    var reader = new FileReader();

    reader.onload = onReaderLoad;
    reader.readAsText(level_file);
}

function onReaderLoad(event){
    var data = JSON.parse(event.target.result);
    resetBlocks(true);
    for(i = 0; i< data.length; i++){
        var d = data[i];
        var buffer_name = d['buffer_name'];
        if(i == 0){
            blocks.push(new Character(d['scale'],d['pos'], d['rot']));
        }
        else{   
            blocks.push(new Platform(d['scale'] ,d['pos'], d['rot'], objectsBuffer[buffer_name], buffer_name, d['name'],true, d['color'], d['textureName']));
            blocks[i].set_texMix(d['dTexMix']);
        }

    }
}

function save_level(){
    var json_level = JSON.stringify(blocks);
    download("level.txt", json_level);
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
 }