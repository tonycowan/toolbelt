let loadMapButton;
let saveMapButton;
let mapText;
let diagramP;

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
    let mapArray = [...mapText.matchAll(/(.*)\n/g)];
    let mapName = mapNameInput.value;

    map = {name: mapName, nodes: [
        { name:"Feature 1", value:"30", nodes:[  
            {name:"Feature 2", value: "10", nodes:[]},
            {name:"Feature 3", value: "15"}
            ]
        },
        { name:"Feature 4", value:"40", nodes:[  
            {name:"Feature 5", value: "10", nodes:[
                {name:"Feature 6", value: "9", nodes:[]},
                {name:"Feature 7", value: "23"}
            ]},
            {name:"Feature 8", value: "10"}
            ]
        }
    ]};

    return map;
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
