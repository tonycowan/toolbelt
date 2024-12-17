let loadMapButton;
let saveMapButton;
let mapText;
let heatmapDiagramBodyDiv;
let heatmapDiagramTitle;
let heatmapTextDiv;
let mapNameInput;
let heatmapDiv;
let defaultMapName = 'Default Map.hmap';

let defaultMap = {
    "name": "Default Map",
    "nodes": [
      {
        "name": "Develop Product / Service",
        "value": 0,
        "performance": 1,
        "nodes": []
      },
      {
        "name": "Market Solutions",
        "value": 2,
        "performance": 3,
        "nodes": [
          {
            "name": "Analyze Market",
            "value": 4,
            "performance": 0,
            "nodes": [
              {
                "name": "Research Market",
                "value": 0,
                "nodes": []
              }
            ]
          },
          {
            "name": "Plan Go To Market Strategy",
            "value": 1,
            "performance": 2,
            "nodes": []
          },
          {
            "name": "Manage Marketing Portfolio",
            "value": 3,
            "performance": 4,
            "nodes": []
          },
          {
            "name": "Manage Telemarketing",
            "value": 0,
            "performance": 1,
            "nodes": []
          },
          {
            "name": "Manage Partner Chanel",
            "value": 2,
            "performance": 1,
            "nodes": [
              {
                "name": "Manage Partner Recruitment",
                "value": 3,
                "performance": 3,
                "nodes": []
              },
              {
                "name": "Register Partner",
                "value": 2,
               "performance": 4,
               "nodes": []
              }
            ]
          }
        ]
      },
      {
        "name": "Sell Solutions",
        "value": 0,
        "performance": 0,
        "nodes": []
      },
      {
        "name": "Plan and Manage Enterprise (ERP)",
        "value": 0,
        "performance": 0,
        "nodes": []
      },
      {
        "name": "Manage Collaboration",
        "value": 0,
        "performance": 0,
        "nodes": []
      }
    ]
  };

let map = {};

let loadFileHandle;
let startInFileHandle;

function initialize() {
    loadMapButton = document.getElementById("loadMapBtn");
    saveMapButton = document.getElementById("saveMapBtn");
    printButton = document.getElementById("printBtn");
    mapText = document.getElementById("heatmapText");
    heatmapDiv = document.getElementById("heatmapDiv");
    heatmapDiagramBodyDiv = document.getElementById("heatmapDiagramBodyDiv");
    heatmapDiagramTitle = document.getElementById("heatmapDiagramTitle");
    mapNameInput = document.getElementById("mapNameInput");
    heatmapTextDiv = document.getElementById("heatmapTextDiv");

    loadMapButton.addEventListener('click', async () => {
        // Destructure the one-element array.
        [loadFileHandle] = await window.showOpenFilePicker({
            suggestedName: 'github/toolbelt/default.hmap',
            types: [{
                description: 'Heat Map documents',
                accept: {
                    'text/plain': ['.hmap'],
                    },
                }],
            });
        // Do something with the file handle.
        const file = await loadFileHandle.getFile();
        const contents = await file.text();
        startInFileHandle = loadFileHandle;
        jsonToDiagram(contents);
    });
    
    saveMapButton.addEventListener('click', async () => {
        saveFileHandle = await self.showSaveFilePicker({
            startIn: startInFileHandle,
            suggestedName:map.name,
            types: [{
              description: 'Text documents',
              accept: {
                'text/plain': ['.hmap'],
              },
            }],
          });

        startInFileHandle = saveFileHandle;

        await writeFile(saveFileHandle, JSON.stringify(map,null,2));
    });

    printButton.addEventListener('click', async (ev) => {
        heatmapTextDiv.classList.add("printMode");
        ev.stopPropagation();
    });

    heatmapDiv.addEventListener('click', async () => {
        heatmapTextDiv.classList.remove("printMode");
    });

    mapNameInput.addEventListener('input', (e) => {
        map.name = e.target.value;
        heatmapDiagramTitle.innerText = map.name;
    });

    mapText.addEventListener('input', (e) => {
        map = textToMap(e.target.value);
        renderMapDiagram(map);
    });

    if(window.location.protocol.substring(0,4) == 'http') {
        let defaultMapURL = window.location.protocol 
            + "//" + window.location.host 
            + window.location.pathname.split('/').slice(0,-1).join('/')
            + "/" + defaultMapName;
        fetch(defaultMapURL)
        .then((response) => response.json())
        .then((json) => jsonToDiagram(JSON.stringify(json)));
    } else {
        jsonToDiagram(JSON.stringify(defaultMap));
    }
}

function jsonToDiagram(contents) {
    map = JSON.parse(contents);

    mapText.value = mapToText(map).nodes;
    mapNameInput.value = map.name;
    renderMapDiagram(map);
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
        nodesAsText += depth + value.name + " [" + value.value + ":" + value.performance + "]" + "\n"
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

    let featureReg = /( *)(.*)/;

    let i = 0;
    let mapText = mapTextArray[mapTextArrayIndex];
    let nodeDetails = mapText.match(featureReg);
    if(!nodeDetails || nodeDetails.length < 2 ) return mapTextArrayIndex + 1; // skip this one.
    if(nodeDetails[1].length < currentLevel) return mapTextArrayIndex; // someone else needs to process this one.

    while(mapText[i] == " ") {
        if(i >= currentLevel){
            let newNode = {name:"No Label", value:0, performance:0, nodes: []};
            map.nodes.push(newNode);
            map = newNode;
            }
            i++;
        }
    currentLevel = i;
    let newNode = {name:nodeDetails[2], value: 0, nodes: []};
    map.nodes.push(newNode);
    mapTextArrayIndex++;
    let processingSubNodes = mapTextArrayIndex < mapTextArray.length;
    

    while(processingSubNodes && mapTextArrayIndex < mapTextArray.length) {
        mapText = mapTextArray[mapTextArrayIndex];
        nodeDetails = mapText.match(featureReg);
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

    renderNodes(map, heatmapDiagramBodyDiv, [1]);
}

function renderNodes(map, mapDiv, featureNumbers) {
    map.nodes.forEach((value, index, array) => {
        const node = document.createElement("Div");
        node.innerHTML = "<p>" + featureNumbers.reduce((accu, curr, i, a)=>{
            accu += curr;
            (i!=a.length-1)?accu+=".":accu+=" ";
            return accu
            },"")
            + value.name + "</p>";
        node.className = "mapNode";
        if( value.nodes) renderNodes(value, node, [...featureNumbers,1]);
        mapDiv.appendChild(node);
        featureNumbers[featureNumbers.length - 1] += 1;
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
