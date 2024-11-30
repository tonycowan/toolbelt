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
    diagramP = document.getElementById("diagramP");


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
        mapText.value = contents;
        map = parseMap(contents);
        diagramP.innerText = JSON.stringify(map);
    });
    
    saveMapButton.addEventListener('click', async () => {
        await writeFile(fileHandle, mapText.value);
    });

    mapText.addEventListener('input', (e) => {
        map = parseMap(e.target.value);
        diagramP.innerText = "xxx" + JSON.stringify(map);
    });
}

function parseMap(mapText) {
    let mapArray = [...mapText.matchAll(/(.*)\n/g)];
    console.log(mapArray);

    map = {name: "Default Map", nodes: [
        { name:"Feature 1", value:"30", children:[  
            {name:"Feature 2", value: "10", children:[]},
            {name:"Feature 3", value: "15"}
            ]
        },
        { name:"Feature 4", value:"40", children:[  
            {name:"Feature 5", value: "10", children:[
                {name:"Feature 6", value: "9", children:[]},
                {name:"Feature 7", value: "23"}
            ]},
            {name:"Feature 8", value: "10"}
            ]
        }
    ]};

    return map;
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
