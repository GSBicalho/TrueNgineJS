const OBJECTNDMANAGER_NO_FORMAT  = 0
const OBJECTNDMANAGER_POL_FORMAT = 1
const OBJECTNDMANAGER_NDP_FORMAT = 2

const OBJECTND_RENDERINGMODE_LINES = 0
const OBJECTND_RENDERINGMODE_FACES = 1

function setTrueIfShared(arrayToSet, v1, v2){
	v1 = new Set(v1)
	v2 = new Set(v2)
	let intersect = new Set([...v1].filter(i => v2.has(i)));
	for (i of intersect){
		arrayToSet.value = true;
	}

	return;

	// Old code to return to if the approach above fails to work
	let count1 = 0;
	let count2 = 0;

	while (count1 < rows(v1) && count2 < rows(v2)){
		if(get(v1, count1, 0) > get(v2, count2, 0)){
			count2++;
		} else if(get(v1, count1, 0) < get(v2, count2, 0)){
			count1++;
		} else {
			arrayToSet.value[get(v1, count1, 0)] = true;
			count1++;
			count2++;
		}
	}
}

function getPolitopesKDThatComposePolytopeND(polytopeLists, N, K, index){
	assert(N > K);
	if(N == K + 1){
		return polytopeLists[N][index];
	} else {
		let searchedPolytope = polytopeLists[N][index];
		let resultSet = Set();
		for(let i = 0; i < searchedPolytope.length; i++){
			let thisPolytopesComponents = getPolitopesKDThatComposePolytopeND(polytopeLists, N - 1, K, searchedPolytope[i]);
			thisPolytopesComponents.forEach(item => resultSet.add(item))
		}

		return resultSet;
	}
}

// function triangulateFaces(){}


class ObjectNDManager{
	readFromNDPFormatStream(fileContent){
		fileContent = fileContent.trim().split("\n");
		let currentLineIndex = 0;

		let [numDimensions, dimensionOfHighestStructure] = fileContent[currentLineIndex++].split(' ').filter(x=>x).map(x => parseInt(x))
		this.numberOfDimensions = numDimensions;

		//Initializing polytope vector
		this.composingPolytopes = []
		for (let i = 0; i < dimensionOfHighestStructure + 1; i++) {
			this.composingPolytopes[i] = []
		}

		for(let currentDimension = 0; currentDimension < dimensionOfHighestStructure + 1; currentDimension++){
			fileContent[currentLineIndex++]
			let numberOfPolytopes = parseInt(fileContent[currentLineIndex++])

			for(let i = 0; i < numberOfPolytopes; i++){
				let currentLine = fileContent[currentLineIndex++];
				currentLine = currentLine.split(' ').filter(x=>x).map(x => parseFloat(x))

				// Add is as vector if it is a point, add it as array if it isn't
				if(currentDimension == 0){
					this.composingPolytopes[currentDimension].push(math.matrix(currentLine))
				} else {
					this.composingPolytopes[currentDimension].push(currentLine.sort(function (a, b) {  return a - b;  }))
				}
			}

			print("Dim " + currentDimension + " -> " + this.composingPolytopes[currentDimension].length)
		}
	}

	readFromPOLFormatStream(fileContent){
		fileContent = fileContent.trim().split("\n");
		let currentLineIndex = 0;

		let [startingDimension, finalDimension] = fileContent[currentLineIndex++].split(' ').filter(x=>x).map(x => parseInt(x));
		console.log("startingDimension:", startingDimension);
		console.log("finalDimension:", finalDimension);

		this.numberOfDimensions = startingDimension;

		let sizeGrid = fileContent[currentLineIndex++].split(' ').filter(x=>x).map(x => parseInt(x));
		console.log("sizeGrid:", sizeGrid);

		currentLineIndex++; //skip an empty line

		let composingPolytopeToIndexMap = [];

		//Initializing the vectors
		for (let i = 0; i < startingDimension - finalDimension + 1; i++) {
			this.composingPolytopes.push([]);
			composingPolytopeToIndexMap.push({});
		}

		let currentPolytope = 0;
		let labelLine = fileContent[currentLineIndex++].split(' ').filter(x=>x).map(x => parseInt(x));
		var currentPolytopeLabel = labelLine.shift();
		console.log("Label ", currentPolytopeLabel);
		while (currentPolytopeLabel !== -1) {
			console.log("Label ", currentPolytopeLabel);

			let currentCube = labelLine
			console.log("Current Cube: ", currentCube);

			let numConvexComponents = parseInt(fileContent[currentLineIndex++]);
			console.log("numConvexComponents ", numConvexComponents);

			for (let currentConvexComponent = 0; currentConvexComponent < numConvexComponents; currentConvexComponent++) {
				let vertexList = this.composingPolytopes[0];
				let vertexMap = composingPolytopeToIndexMap[0];

				// Getting the vertices that compose the Polytope
				let numVertexes = parseInt(fileContent[currentLineIndex++]);
				console.log("numVertexes ", numVertexes);
				let mappingOfCurrentPolytopesToGlobal = [];
				for (let currentVertexIndex = 0; currentVertexIndex < numVertexes; currentVertexIndex++) {
					let componentLine = fileContent[currentLineIndex++].split(' ').filter(x=>x).map(x => parseFloat(x));

					let componentLabel = [];
					for (let i = 0; i < finalDimension + 1; i++) {
						componentLabel.push(componentLine.shift());
					}

					// We don't actually use the component labels for now
					// But maybe someday we will

					//Reads the vertex
					let currentVertex = math.matrix(componentLine);

					let vertexName = currentVertex + ''
					if (!(vertexName in vertexMap)) {
						//Adds it to the list of vertexes, if it isn't there already
						vertexList.push(currentVertex);
						vertexMap[vertexName] = vertexList.length - 1;
						
						//Maps it to the newest position
						mappingOfCurrentPolytopesToGlobal.push(vertexList.length - 1);
					}
					else {
						//Maps it to found position
						mappingOfCurrentPolytopesToGlobal.push(vertexMap[vertexName]);
					}
				}

				//Reading edges and higher dimensional structures
				for (let currentDimensionOfComposingPolytopes = 1; currentDimensionOfComposingPolytopes < startingDimension - finalDimension + 1; currentDimensionOfComposingPolytopes++) {
					let cdocp = currentDimensionOfComposingPolytopes;

					let mappingOfPreviousPolytopesToGlobal = mappingOfCurrentPolytopesToGlobal;
					mappingOfCurrentPolytopesToGlobal = [];

					let numberOfPolytopesOfCurrentDimension = parseInt(fileContent[currentLineIndex++]);;
					for (let i = 0; i < numberOfPolytopesOfCurrentDimension; i++) {
						//Read polytope
						let facesOfPolytope = fileContent[currentLineIndex++].split(' ').filter(x=>x).map(x => parseInt(x));

						//Transform it to its global indexes
						let polytopeAfterMapping = [];
						for (let j = 0; j < facesOfPolytope.length; j++) {
							polytopeAfterMapping.push(mappingOfPreviousPolytopesToGlobal[facesOfPolytope[j] - 1]);
						}

						//Order it
						polytopeAfterMapping.sort(function(lhs, rhs) { return lhs < rhs; })
						
						let polytopeName = polytopeAfterMapping+''
						if (!(polytopeName in composingPolytopeToIndexMap[cdocp])) {
							this.composingPolytopes[cdocp].push(polytopeAfterMapping);
							composingPolytopeToIndexMap[cdocp][polytopeName] = this.composingPolytopes[cdocp].length - 1;
							//Maps it to the newest position
							mappingOfCurrentPolytopesToGlobal.push(this.composingPolytopes[cdocp].length - 1);
						} else {
							//Maps it to found position
							mappingOfCurrentPolytopesToGlobal.push(composingPolytopeToIndexMap[cdocp][polytopeName]);
						}
					}
				}

				// Starts next Polytope
				currentPolytope++;
			}
			currentLineIndex++;
			
			labelLine = fileContent[currentLineIndex++].split(' ').filter(x=>x).map(x => parseInt(x));
			currentPolytopeLabel = labelLine.shift();
		}
	}

	constructor(formatType, fileContent, parent){
		this.parent = parent;
		this.renderingMode = OBJECTND_RENDERINGMODE_LINES;
		this.hasCalculatedCulling = false;
		this.useCulling = false;
		this.currentComposingPolytopes = null;
		this.composingPolytopes = [];

		if(formatType == OBJECTNDMANAGER_NDP_FORMAT){
			console.log("READING NDP");
			this.readFromNDPFormatStream(fileContent);
		} else if(formatType == OBJECTNDMANAGER_POL_FORMAT){
			console.log("READING POL");
			this.readFromPOLFormatStream(fileContent);
		} else {
			this.numberOfDimensions = 0;
		}

		// We shift every point to the same random minimal direction
		if(this.composingPolytopes.length > 0 && rows(this.composingPolytopes[0][0]) > 0){
			let aux = [...Array(rows(this.composingPolytopes[0][0])).keys()].map(x => math.sin(x)*0.0000001)
			aux = math.matrix(aux)
			for(let i = 0; i < this.composingPolytopes[0].length; i++){
				this.composingPolytopes[0][i] = math.add(this.composingPolytopes[0][i], aux)
			}
		}
	}

	printStructure(){
		let s = "";
		for (let i = 0; i < this.currentComposingPolytopes.length; i++){
			s += "LAYER " + i + '\n'
			for(let j = 0; j < this.currentComposingPolytopes[i].length; j++){
				s += j + ": " + this.currentComposingPolytopes[i][j] + "\n"
			}
		}
		console.log(s)
	}

	checkSharedEdgesAndFaces(currentComposingPolytopes, edgeIsShared, faceIsShared){
		
		if(currentComposingPolytopes.length > 3){
			let faceList = currentComposingPolytopes[2];
			let spaceList = currentComposingPolytopes[3];

			// Check to see which edges should be rendered
			// Compare each edge of each space against every edge of every other space
			for(let i = 0; i < spaceList.length; i++){
				let facesOfSpaceA = spaceList[i];

				let otherSpacesFaces = new Set();
				for (let j = i + 1; j < spaceList.length; j++){
					let facesOfSpaceB = spaceList[j];
					for (let k = 0; k < facesOfSpaceB.length; k++){
						otherSpacesFaces.add(facesOfSpaceB[k])
					}
				}

				for(let j = 0; j < facesOfSpaceA.length; j++){
					let edgesA = faceList[facesOfSpaceA]
					for (let edgeB of otherSpacesFaces){
						setTrueIfShared(edgeIsShared, edgesA, faceList[edgeB])
					}
				}
			}

			// Check to see which faces should be rendered
			for(let i = 0; i < spaceList.length; i++){
				let facesOfSpaceA = spaceList[i];
				for(let j = i +1; j < spaceList.length; j++){
					setTrueIfShared(faceIsShared, facesOfSpaceA, spaceList[j])
				}
			}
		}
	}

	generateEdgeAndFaceLists(
		currentComposingPolytopes, 
		edgeListWithoutCulling,
		edgeListWithCulling,
		faceListWithoutCulling,
		faceListWithCulling){
		if(!currentComposingPolytopes || currentComposingPolytopes.length < 2){ return; }

		let edgeList = currentComposingPolytopes[1];

		let edgeIsShared = {value: new Array(edgeList.length).map(_=>false)}
		let sizeFaces = 0;
		if(currentComposingPolytopes.length > 2){
			sizeFaces = currentComposingPolytopes[2].length
		}
		let faceIsShared = {value: new Array(sizeFaces.length).map(_=>false)}

		this.hasCalculatedCulling = false;
		if(this.useCulling){
			this.checkSharedEdgesAndFaces(currentComposingPolytopes, edgeIsShared, faceIsShared) 
			this.hasCalculatedCulling = true;
		}

		// Get size of each list
		let sizeEdgeListWithCulling = 0;
		let sizeFaceListWithCulling = 0;
		let sizeFaceListWithoutCulling = 0;
		for (let i = 0; i < currentComposingPolytopes[1].length; i++) {
			sizeEdgeListWithCulling += !edgeIsShared.value[i] ? 1 : 0;
		}

		//Create lists. Here we create and mantain in memory the list of edges with culling and without,
		//Because it is faster than recalculating it every time we change rendering

		//First we do Edges
		let edgeCullCount = 0;
		edgeListWithoutCulling.value = new Array(edgeList.length)
		edgeListWithCulling.value = new Array(sizeEdgeListWithCulling.length)
		for (let i = 0; i < edgeList.length; i++) {
			edgeListWithoutCulling.value[i] = edgeList[i]
			if (!edgeIsShared.value[i]) {
				edgeListWithCulling[edgeCullCount] = edgeList[i]
				edgeCullCount++;
			}
		}

		// Now we do faces
		if(currentComposingPolytopes.length > 2){
			let faceList = currentComposingPolytopes[2];

			for (let i = 0; i < faceList.length; i++){
				sizeFaceListWithoutCulling += faceList[i].length - 2;
				sizeFaceListWithCulling += (!faceIsShared.value[i] ? 1 : 0) * (faceList[i].length - 2);
			}

			faceListWithoutCulling.value = [];
			faceListWithCulling.value = [];
			for(let i = 0; i < faceList.length; i++){
				let currentFace = faceList[i]

				let numberOfTrianglesInThisFace = currentFace.length - 2;
				let trianglesList = new Array(numberOfTrianglesInThisFace);
				let currentLocationOnTrianglesList = 0;

				let baseVertex = edgeList[currentFace[0]][0];
				for(let j = 1; j < currentFace.length && currentLocationOnTrianglesList != numberOfTrianglesInThisFace; j++){
					let currentEdge = edgeList[currentFace[j]];
					if(!(currentEdge[0] == baseVertex || currentEdge[1] == baseVertex)){
						let auxVec = [baseVertex, currentEdge[0], currentEdge[1]];
						trianglesList[currentLocationOnTrianglesList] = auxVec;
						currentLocationOnTrianglesList++;
					}
				}

				faceListWithoutCulling.value.push(...trianglesList);
				if(!faceIsShared.value[i]){
					faceListWithCulling.value.push(...trianglesList);
				}
			}
		}
	}

	setUsingCulling(value){
		this.useCulling = value;
		if(!this.hasCalculatedCulling && this.useCulling && this.currentObjects.length){
			let edgeListWithoutCulling = {value:[]};
			let edgeListWithCulling = {value:[]};
			let faceListWithoutCulling = {value:[]};
			let faceListWithCulling = {value:[]};

			//after cuts
			this.generateEdgeAndFaceLists(this.currentComposingPolytopes, edgeListWithoutCulling, edgeListWithCulling, faceListWithoutCulling, faceListWithCulling);

			//Create object and add it to render list
			this.currentObjects[0].edgesWithCullingList = edgeListWithCulling;
			this.currentObjects[0].facesWithCullingList = faceListWithCulling;

			this.hasCalculatedCulling = true;
		}

		for(let obj of this.currentObjects){
			obj.setUseCulling(value);
		}
	}

	updateObjects(cutsLocation, camerasND){
		this.currentObjects = [];

		if(this.composingPolytopes.length < 2){ return; }

		let maxDimension = this.composingPolytopes.length - 1;
		let resultingDimension = camerasND.length + 3;

		let currentComposingPolytopes = [];
		for(let i = 0; i < this.composingPolytopes.length; i++){
			let aux = []
			for (let j = 0; j < this.composingPolytopes[i].length; j++){
				aux.push(this.composingPolytopes[i][j])
			}
			currentComposingPolytopes.push(aux)
		}

		//calculate cuts
		for(let currentCutIndex = 0; currentCutIndex < cutsLocation.length; currentCutIndex++){
			let vertexList = currentComposingPolytopes[0]
			let edgeList = currentComposingPolytopes[1]

			if(vertexList.length == 0){ break; }

			let newPoints = []
			let edgeToPointsMapping = [];
			let currentCutLocation = cutsLocation[currentCutIndex];
			// We calculate the cut over every edge
			for(let i = 0; i < edgeList.length; i++){
				edgeToPointsMapping[i] = -1;

				let pointAIndex = edgeList[i][0];
				let pointBIndex = edgeList[i][1];

				let startVertex = vertexList[pointAIndex];
				let endVertex = vertexList[pointBIndex];

				let lastCoordStart = getLast(startVertex);
				let lastCoordEnd = getLast(endVertex);

				let maxLastCoord, minLastCoord;

				if (lastCoordStart > lastCoordEnd) {
					maxLastCoord = startVertex;
					minLastCoord = endVertex;
				} else {
					maxLastCoord = endVertex;
					minLastCoord = startVertex;
				}


				let crossesCut = getLast(minLastCoord) < currentCutLocation && currentCutLocation < getLast(maxLastCoord);

				if(crossesCut){
					let newPoint = math.subtract(startVertex, endVertex);
					newPoint = math.divide(newPoint, getLast(newPoint));
					newPoint = math.multiply(newPoint, currentCutLocation - getLast(minLastCoord));
					newPoint = math.add(newPoint, minLastCoord);
					newPoint.resize([rows(newPoint) - 1, cols(newPoint)]);

					edgeToPointsMapping[i] = newPoints.length;
					newPoints.push(newPoint);
				}
			}
		

			//Now we have every single point that our collection of polytopes contains
			//Every edge has generated either 0 or 1 point

			//We create the structure that will hold our new polytopes
			let newComposingPolytopes = []
			//The first line shall be our newly found points
			newComposingPolytopes.push(newPoints);
			//The rest are initialized empty, and will be built in the next step
			for (let i = 1; i < currentComposingPolytopes.length - 1; i++) {
				newComposingPolytopes.push([]);
			}

			let newDimension = vertexList[0].length - 1;

			//We start building the structure from the bottom up
			let previousPolytopeLayerMapping = edgeToPointsMapping;
			let currentPolytopeLayerMapping;
			edgeToPointsMapping  = null;

			for(let currentPolitopeDimension = 1; currentPolitopeDimension < newComposingPolytopes.length; currentPolitopeDimension++) {
				let previousPolytopeList = currentComposingPolytopes[currentPolitopeDimension];
				let currentPolytopeList = currentComposingPolytopes[currentPolitopeDimension + 1];

				currentPolytopeLayerMapping = new Array(currentPolytopeList.length);
				for (let currentPolytopeIndex = 0; currentPolytopeIndex < currentPolytopeList.length; currentPolytopeIndex++) {
					let listOfLowerDimensionPolitopesFound = [];
					let currentPolytope = currentPolytopeList[currentPolytopeIndex];

					currentPolytopeLayerMapping[currentPolytopeIndex] = -1;
					for (let i = 0; i < currentPolytope.length; i++) {
						let aux = previousPolytopeLayerMapping[currentPolytope[i]];
						if (previousPolytopeLayerMapping[currentPolytope[i]] != -1) {
							listOfLowerDimensionPolitopesFound.push(previousPolytopeLayerMapping[currentPolytope[i]]);
						}
					}

					if (listOfLowerDimensionPolitopesFound.length != 0 && listOfLowerDimensionPolitopesFound.length > currentPolitopeDimension) {
						if (currentPolitopeDimension == 1 && listOfLowerDimensionPolitopesFound.length > 2) {

							while (listOfLowerDimensionPolitopesFound.length > 2) {
								listOfLowerDimensionPolitopesFound.shift();
							}
						}

						let aux = new Array(listOfLowerDimensionPolitopesFound.length);
						for (let i = 0; i < listOfLowerDimensionPolitopesFound.length; i++) {
							aux[i] = listOfLowerDimensionPolitopesFound[i];
						}
						currentPolytopeLayerMapping[currentPolytopeIndex] = newComposingPolytopes[currentPolitopeDimension].length;
						newComposingPolytopes[currentPolitopeDimension].push(aux);
					}

					//delete listOfLowerDimensionPolitopesFound;
				}

				//delete previousPolytopeLayerMapping;
				previousPolytopeLayerMapping = currentPolytopeLayerMapping;
			}

			currentComposingPolytopes = newComposingPolytopes;
		}

		let edgeListWithoutCulling = {value:[]}
		let edgeListWithCulling = {value:[]}
		let faceListWithoutCulling = {value:[]}
		let faceListWithCulling = {value:[]}

		//after cuts
		this.hasCalculatedCulling = false;
		this.generateEdgeAndFaceLists(currentComposingPolytopes, edgeListWithoutCulling, edgeListWithCulling, faceListWithoutCulling, faceListWithCulling);

		//Create Vertex Matrix
		let vertexMatrix = currentComposingPolytopes[0].map(x=>math.matrix(math.flatten(x)).clone());
		vertexMatrix = vertexMatrix.map(x=>x.clone())
		
		this.currentComposingPolytopes = currentComposingPolytopes;

		let newObj = new ObjectND(this.numberOfDimensions, vertexMatrix, edgeListWithoutCulling, edgeListWithCulling, faceListWithoutCulling, faceListWithCulling, camerasND, this.parent, this.renderingMode);
		this.currentObjects.push(newObj)
	}

	render(){
		for(let o of this.currentObjects){
			o.render()
		}
	}

	setRenderingMode(value){
		this.renderingMode = value;
		for(let o of this.currentObjects){
			o.setRenderingMode(value);
		}
	}

	delete(){
		// TODO: Delete objects
	}
}
