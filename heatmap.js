let loadMapButton;
let saveMapButton;
let mapText;
let heatmapDiagramBodyDiv;
let heatmapDiagramTitle;
let heatmapTextDiv;
let textNumbersArea;
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
              "performance": 2,
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

let performanceLookup = {
  0: "undefinedPerformance",
  1: "lowestPerformance",
  2: "lowPerformance",
  3: "mediumPerformance",
  4: "highPerformance",
  5: "highestPerformance"
};

let valueLookup = {
  0: "undefinedValue",
  1: "lowestValue",
  2: "lowValue",
  3: "mediumValue",
  4: "highValue",
  5: "highestValue"
};

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
  textNumbersArea = document.getElementById("textNumbers");

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
      suggestedName: map.name,
      types: [{
        description: 'Text documents',
        accept: {
          'text/plain': ['.hmap'],
        },
      }],
    });

    startInFileHandle = saveFileHandle;

    await writeFile(saveFileHandle, JSON.stringify(map, null, 2));
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

  if (window.location.protocol.substring(0, 4) == 'http') {
    let defaultMapURL = window.location.protocol
      + "//" + window.location.host
      + window.location.pathname.split('/').slice(0, -1).join('/')
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
  let textLineNumber = { number: 1 };
  let mapNodesText = textifyNodes(mapJSON.nodes, "", textLineNumber);

  return { "name": mapJSON.name, "nodes": mapNodesText };
}

function textifyNodes(nodes, depth, textLineNumber) {
  if (!nodes) return;
  let nodesAsText = "";

  nodes.forEach((value, index, array) => {
    nodesAsText += depth + value.name + " [" + value.value + ":" + value.performance + "]" + "\n"
    value.textLineNumber = textLineNumber.number++;
    if (value.nodes) {
      nodesAsText += textifyNodes(value.nodes, depth + " ", textLineNumber);
    }
  });

  return nodesAsText;
}

function textToMap(mapText) {
  let mapTextArray = mapText.split('\n');
  let mapName = mapNameInput.value;
  let currentLevel = 0;
  let currentNode = {};
  let map = { name: mapName, nodes: [] };

  let mapTextArrayIndex = 0;

  while (mapTextArrayIndex < mapTextArray.length) {
    mapTextArrayIndex = addNode(map, mapTextArray, mapTextArrayIndex, currentLevel);
  }

  return map;
}

function addNode(map, mapTextArray, mapTextArrayIndex, currentLevel) {
  if (mapTextArray.length == 0 || mapTextArrayIndex >= mapTextArray.length) return mapTextArrayIndex;

  let featureReg = /( *)([^\[\r\n]+) *(?:\[([^:\]]*):?([^\]]*)\])?/;

  let i = 0;
  let mapText = mapTextArray[mapTextArrayIndex];
  let nodeDetails = mapText.match(featureReg);
  if (!nodeDetails || nodeDetails.length < 2) return mapTextArrayIndex + 1; // skip this one.
  if (nodeDetails[1].length < currentLevel) return mapTextArrayIndex; // someone else needs to process this one.

  while (mapText[i] == " ") {
    if (i >= currentLevel) {
      let newNode = { name: "No Label", value: 0, performance: 0, textLineNumber: mapTextArrayIndex + 1, nodes: [] };
      map.nodes.push(newNode);
      map = newNode;
    }
    i++;
  }
  currentLevel = i;
  let newNode = { name: nodeDetails[2].trim(), value: nodeDetails[3] ? nodeDetails[3] : 0, performance: nodeDetails[4] ? nodeDetails[4] : 0, textLineNumber: mapTextArrayIndex + 1, nodes: [] };
  map.nodes.push(newNode);
  mapTextArrayIndex++;
  let processingSubNodes = mapTextArrayIndex < mapTextArray.length;


  while (processingSubNodes && mapTextArrayIndex < mapTextArray.length) {
    mapText = mapTextArray[mapTextArrayIndex];
    nodeDetails = mapText.match(featureReg);
    if (!nodeDetails || nodeDetails.length < 2) return mapTextArrayIndex + 1;
    if (nodeDetails[1].length > currentLevel) {
      mapTextArrayIndex = addNode(newNode, mapTextArray, mapTextArrayIndex, currentLevel + 1);
    } else {
      processingSubNodes = false;
    }
  }


  return mapTextArrayIndex;
}

function getLevelFont(featureNumbers) {
  // define as many levels as desired in the CSS using .mapNode.Levelx where x is 1, 2, 3, ...
  // e.g.: 
  // .mapNode.Level1 {
  //   font-size : 20px;
  //   font-weight : 550;
  // }
  // All levels that are not defined inherit from the containing box.

  let depth = featureNumbers.length;
  return "Level" + depth;
}

function clearTextNumbers() {
  textNumbersArea.value = "";
}

function addTextNumber(numbersArray) {
  textNumbersArea.value = textNumbersArea.value + numbersArray.join('.') + '\n';
}

function renderMapDiagram(map) {
  heatmapDiagramBodyDiv.innerText = '';
  heatmapDiagramTitle.innerHTML = map.name;

  clearTextNumbers();

  renderNodes(map, heatmapDiagramBodyDiv, [1]);
}

function renderNodes(map, mapDiv, featureNumbers) {
  map.nodes.forEach((value, index, array) => {
    const node = document.createElement("Div");
    node.innerHTML = "<p>" + featureNumbers.reduce((accu, curr, i, a) => {
      accu += curr;
      (i != a.length - 1) ? accu += "." : accu += " ";
      return accu
    }, "")
      + value.name + "</p>";
    node.classList.add("mapNode", valueLookup[value.value], performanceLookup[value.performance], getLevelFont(featureNumbers));
    // event listener to set text position
    node.addEventListener('click', async (e) => {
      if (!e.alreadyRepositionedTextCursor) {
        // find the value.textLineNumber-th \n in the textarea
        setMapTextCursor(value);
        e.alreadyRepositionedTextCursor = true;
      }
    });

    addTextNumber(featureNumbers);

    if (value.nodes) renderNodes(value, node, [...featureNumbers, 1]);
    mapDiv.appendChild(node);
    featureNumbers[featureNumbers.length - 1] += 1;
  });
}

function setMapTextCursor(value) {
  let cursorPosition = mapText.value.split('\n', value.textLineNumber).join('\n').length;
  // textarea.selectionEnd = ??
  mapText.selectionStart = cursorPosition;
  mapText.selectionEnd = cursorPosition;
  mapText.focus();
  let cursorPos = getCursorXY(mapText, cursorPosition);
  sparkleAt(cursorPos);
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

function sparkleAt(pos) {
  let sparkleOffset = 7;
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";
  const sparkleParent = document.body;
  sparkle.style.position = 'absolute';
  sparkle.style.top = pos.y - sparkleOffset;
  sparkle.style.left = pos.x;
  sparkleParent.appendChild(sparkle);

  removeFadeOut(sparkle, 1000);
}

function removeFadeOut(el, speed) {
  setTimeout(function () {
    el.style.opacity = 0;
  }, 1);
  setTimeout(function () {
    el.parentNode.removeChild(el);
  }, speed);
}

/**
 * returns x, y coordinates for absolute positioning of a span within a given text input
 * at a given selection point
 * @param {object} input - the input element to obtain coordinates for
 * @param {number} selectionPoint - the selection point for the input
 */
const getCursorXY = (input, selectionPoint) => {
  const {
    offsetLeft: inputX,
    offsetTop: inputY,
  } = input
  // create a dummy element that will be a clone of our input
  const div = document.createElement('div')
  // get the computed style of the input and clone it onto the dummy element
  const copyStyle = getComputedStyle(input)
  for (const prop of copyStyle) {
    div.style[prop] = copyStyle[prop]
  }
  div.style.position = 'absolute';
  // we need a character that will replace whitespace when filling our dummy element if it's a single line <input/>
  const swap = '.'
  const inputValue = input.tagName === 'INPUT' ? input.value.replace(/ /g, swap) : input.value
  // set the div content to that of the textarea up until selection
  const textContent = inputValue.substr(0, selectionPoint)
  // set the text content of the dummy element div
  div.textContent = textContent
  if (input.tagName === 'TEXTAREA') div.style.height = 'auto'
  // if a single line input then the div needs to be single line and not break out like a text area
  if (input.tagName === 'INPUT') div.style.width = 'auto'
  // create a marker element to obtain caret position
  const span = document.createElement('span')
  // give the span the textContent of remaining content so that the recreated dummy element is as close as possible
  span.textContent = inputValue.substr(selectionPoint) || '.'
  // append the span marker to the div
  div.appendChild(span)
  // append the dummy element to the body
  document.body.appendChild(div)
  // get the marker position, this is the caret position top and left relative to the input
  const { offsetLeft: spanX, offsetTop: spanY } = span
  // lastly, remove that dummy element
  // NOTE:: can comment this out for debugging purposes if you want to see where that span is rendered
  document.body.removeChild(div)
  // return an object with the x and y of the caret. account for input positioning so that you don't need to wrap the input
  return {
    x: inputX + spanX,
    y: inputY + spanY,
  }
}