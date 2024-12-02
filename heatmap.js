let loadMapButton;
let saveMapButton;
let mapText;
let heatmapDiagramBodyDiv;
let heatmapDiagramTitle;
let mapNameInput;
let timeOfLastTextKeystroke;
const gracePeriodAfterLastKeystroke = 1000; // ms of no keystrokes before the diagram will update;

let map = {};

let fileHandle;

function initialize() {
    loadMapButton = document.getElementById("loadMapBtn");
    saveMapButton = document.getElementById("saveMapBtn");
    mapText = document.getElementById("heatmapText");
    heatmapDiagramBodyDiv = document.getElementById("heatmapDiagramBodyDiv");
    heatmapDiagramTitle = document.getElementById("heatmapDiagramTitle");
    mapNameInput = document.getElementById("mapNameInput");

    loadMapButton.addEventListener('click', async () => {
        // Destructure the one-element array.
        [fileHandle] = await window.showOpenFilePicker({
            suggestedName: 'github/toolbelt/default.hmap',
            types: [{
                description: 'Heat Map documents',
                accept: {
                    'text/plain': ['.hmap'],
                    },
                }],
            });
        // Do something with the file handle.
        const file = await fileHandle.getFile();
        const contents = await file.text();
        map = JSON.parse(contents)

        mapText.value = mapToText(map).nodes;
        mapNameInput.value = map.name;
        renderMapDiagram( map);
    });
    
    saveMapButton.addEventListener('click', async () => {
        await writeFile(fileHandle, mapText.value);
    });

    mapNameInput.addEventListener('input', (e) => {
        map.name = e.target.value;
        heatmapDiagramTitle.innerText = map.name;
    });

    mapText.addEventListener('input', (e) => {
        map = textToMap(e.target.value);
        renderMapDiagram(map);
    });
}

/**
 * parses the JSON map and returns a text tuple of (name, diagram nodes)
 *
 * @param {json} mapJSON - the map as JSON.
 * @returns {tuple} (map name, map nodes as text)
 */
function mapToText(mapJSON) {
    let mapNodesText = textifyNodes(mapJSON.nodes, "");
    
    return {"name": mapJSON.name, "nodes":mapNodesText};
}

function textifyNodes(nodes, depth) {
    if( !nodes ) return;
    let nodesAsText = "";

    nodes.forEach((value, index, array) => {
        nodesAsText += depth + value.name + " (" + value.value + ")" + "\n"
        if(value.nodes) {
            nodesAsText += textifyNodes(value.nodes, depth + " ");
        }
    });

    return nodesAsText;
}

function textToMap(mapText) {
    let mapTextArray = mapText.split('\n');
    let mapName = mapNameInput.value;
    let currentLevel = 0;
    let currentNode = {};
    let map = {name:mapName, nodes:[]};

    let mapTextArrayIndex = 0;

    while(mapTextArrayIndex < mapTextArray.length) {
        mapTextArrayIndex = addNode(map, mapTextArray, mapTextArrayIndex, currentLevel);
    }

    return map;
}

function addNode(map, mapTextArray, mapTextArrayIndex, currentLevel){
    if(mapTextArray.length == 0 || mapTextArrayIndex >= mapTextArray.length) return mapTextArrayIndex;

    let i = 0;
    mapText = mapTextArray[mapTextArrayIndex];
    nodeDetails = mapText.match(/( *)([^\(]*)\(([0-9]*)\)/);
    if(!nodeDetails || nodeDetails.length < 2 ) return mapTextArrayIndex + 1; // skip this one.
    if(nodeDetails[1].length < currentLevel) return mapTextArrayIndex; // someone else needs to process this one.

    while(mapText[i] == " ") {
        if(i >= currentLevel){
            newNode = {name:"No Label", value:0, nodes: []};
            map.nodes.push(newNode);
            map = newNode;
            }
            i++;
        }
    currentLevel = i;
    newNode = {name:nodeDetails[2], value: nodeDetails[3], nodes: []};
    map.nodes.push(newNode);
    mapTextArrayIndex++;
    let processingSubNodes = mapTextArrayIndex < mapTextArray.length;
    

    while(processingSubNodes && mapTextArrayIndex < mapTextArray.length) {
        mapText = mapTextArray[mapTextArrayIndex];
        nodeDetails = mapText.match(/( *)([^\(]*)\(([0-9]*)\)/);
        if(!nodeDetails || nodeDetails.length < 2 ) return mapTextArrayIndex + 1;
        if(nodeDetails[1].length > currentLevel) {
            mapTextArrayIndex = addNode(newNode, mapTextArray, mapTextArrayIndex, currentLevel + 1);
        } else {
            processingSubNodes = false;
        }
    }
    

    return mapTextArrayIndex;
}

function renderMapDiagram( map) {
    heatmapDiagramBodyDiv.innerText = '';
    heatmapDiagramTitle.innerHTML = map.name;

    renderNodes(map, heatmapDiagramBodyDiv);
}

function renderNodes(map, mapDiv) {
    map.nodes.forEach((value, index, array) => {
        const node = document.createElement("Div");
        node.innerHTML = "<p>" + value.name + "</p>";
        node.className = "mapNode";
        if( value.nodes) renderNodes(value, node);
        mapDiv.appendChild(node);
    });
}

function parseNodesAtLevel(mapArray, level) {
    thisLevel = [];
    mapArray.forEach((value, index, array) => {
        // if value doesn't start with level spaces break

    });
}

async function writeFile(fileHandle, contents) {
    // Create a FileSystemWritableFileStream to write to.
    const writable = await fileHandle.createWritable();
    // Write the contents of the file to the stream.
    await writable.write(contents);
    // Close the file and write the contents to disk.
    await writable.close();
}
