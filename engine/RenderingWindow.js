

class RenderingWindow {
	constructor(canvas, shaderProgram=0, m_frame=0){
		this.keys = {};
		this.canvas = canvas;
		this.shaderProgram = shaderProgram;
		this.m_frame = m_frame;
		this.camera3D = new Camera3D()
		this.objectManager = null;
		this.backgroundColor = [0.2, 0.3, 0.3];
		
		this.lastFrame = 0;
		this.deltaTime = 0;
		this.lastX = 0;
		this.lastY = 0;
		this.wasActive = false;
		this.rotPlane1 = 0;
		this.rotPlane2 = 1;

		this.isClosing = false;
		this.isAllowingFaceculling = false;

		this.cutLocations = [];
		this.camerasND;

	}

	initialize(){
		this.canvas.setAttribute('tabindex','0');
		this.canvas.focus();

		this.gl = canvas.getContext("webgl2");
		let gl = this.gl;

		if (!gl) {
			alert("Unable to initialize WebGL. Your browser or machine doesn't support it.");
			return;
		}

		gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], 1.0);
		// Clear buffer with color
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//TODO: make cursor invisible

		this.lastX = 0;
		this.lastY = 0;
		this.wasActive = true;

		var vertexShader = gl.createShader(gl.VERTEX_SHADER)
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

		gl.shaderSource(vertexShader, simple_color_shader_vs_text);
		gl.shaderSource(fragmentShader, simple_color_shader_frag_text);

		gl.compileShader(vertexShader);
		if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
			console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
			return;
		}

		gl.compileShader(fragmentShader);
		if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
			console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader))
			return;
		}

		var program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
			console.error('ERROR linking program!', gl.getProgramInfoLog(program));
			return;
		}

		gl.validateProgram(program);
		if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
			console.error('ERROR validating program!', gl.getProgramInfoLog(program))
		}

		gl.detachShader(program, vertexShader);
		gl.detachShader(program, fragmentShader);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);

		this.shaderProgram = program;
		this.inColor_uniform = gl.getUniformLocation(this.shaderProgram, 'inColor');
		this.mvp_uniform = gl.getUniformLocation(this.shaderProgram, 'mvpMatrix');

		canvasController.gl.useProgram(program)

		this.openFile(hypercube_file, OBJECTNDMANAGER_NDP_FORMAT)
		this.asd = true;
	}

	render(){
		this.gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT);

		//Get delta time to check how much to move
		let currentFrame = new Date().getTime();
		this.deltaTime = (currentFrame - this.lastFrame)/1000.0;
		this.lastFrame = currentFrame;

		this.doMovement();

		// Set color of wireframe
		let wireColor = [1, 0, 0, 1];
		this.gl.uniform4fv(this.inColor_uniform, wireColor)

		// Get camera transformation
		let view, projection, model;
		view = this.camera3D.viewMatrix;
		projection = this.camera3D.projectionMatrix(this.canvas.width, this.canvas.height);
		model = this.camera3D.modelMatrix;
		let mvpMatrix = math.multiply(projection, view, model)

		this.gl.uniformMatrix4fv(this.mvp_uniform, false, new Float32Array(math.flatten(math.transpose(mvpMatrix)._data)))

		this.objectManager.render();

		let v = math.add(this.camera3D.position, this.camera3D.front);
		emit('signal3DLocation', 
			this.camera3D.position._data[0][0], 
			this.camera3D.position._data[1][0], 
			this.camera3D.position._data[2][0], 
			v._data[0][0], 
			v._data[1][0], 
			v._data[2][0])
	}

	updateKeys(code, value){
		this.keys[code] = value;
	}

	doMovement(){
		// Camera controls

		// There is probably a much more elegant way of doing this
		// But this will work for now
		const keyMapping = {
			W: 87,
			S: 83,
			A: 65,
			D: 68,
			Q: 81,
			E: 69,
			O: 79,
			SPACE: 32,
			SHIFT: 16,
		}

		const keyboardToMovement = {
			87: CameraMovement.FORWARD,
			83: CameraMovement.BACKWARD,
			65: CameraMovement.LEFT,
			68: CameraMovement.RIGHT,
			32: CameraMovement.UP,
			16: CameraMovement.DOWN,
		}

		for(let key in keyboardToMovement){
			if(this.keys[key]){
				this.camera3D.processKeyboard(keyboardToMovement[key], this.deltaTime);
			}
		}

		if (this.keys[keyMapping.Q] || this.keys[keyMapping.E]) {
			let p1, p2, rotSignal;
			if(this.keys[keyMapping.E]){
				p1 = this.rotPlane1;
				p2 = this.rotPlane2;
				rotSignal = 1
			}else{
				p1 = this.rotPlane2;
				p2 = this.rotPlane1;
				rotSignal = -1
			}

			if (this.objectManager.composingPolytopes.length > 0) {
				for (let i = 0; i < this.objectManager.composingPolytopes[0].length; i++) {
					this.objectManager.composingPolytopes[0][i] = math.multiply(rotateMatrixN(this.objectManager.numberOfDimensions, p1, p2, this.deltaTime), this.objectManager.composingPolytopes[0][i]);
				}
				this.objectManager.updateObjects(this.cutLocations, this.camerasND);
				emit('signalRotation', rotSignal * this.deltaTime);
			}
		}

		if (this.keys[keyMapping.O]) {
			console.log("CurrentVertexes:");
			this.objectManager.printStructure();
		}
	}

	mouseMoveEvent(deltaX, deltaY){
		if(document.pointerLockElement !== canvas){
			return;
		}

		this.camera3D.processMouseMovement(deltaX, deltaY)
	}

	openFile(file, format){
		if(this.objectManager){
			this.objectManager.delete()
			this.objectManager = null;
		}

		this.rotPlane1 = 0;
		this.rotPlane2 = 1;

		this.objectManager = new ObjectNDManager(format, file, this);
		this.isAllowingFaceculling = false;

		this.generateCameras(this.objectManager.numberOfDimensions);

		let maxValue = 0.0;
		if (this.objectManager.composingPolytopes.length) {
			if (this.objectManager.composingPolytopes[0].length) {
				let polyD = this.objectManager.composingPolytopes.length - 1;
				console.log(this.objectManager.composingPolytopes[0][0]+'')
				let spaceD = math.flatten(this.objectManager.composingPolytopes[0][0]).size()[0];
				let maxPossibleCutsByPoly = polyD - 1;
				let numCutsBySpace = spaceD - 3;

				if (maxPossibleCutsByPoly < 0 && numCutsBySpace < 0) {
					emit('signalPossibleNumberOfCuts', 0);
				}
				else {
					console.log('cuts', spaceD, maxPossibleCutsByPoly, numCutsBySpace, maxPossibleCutsByPoly > numCutsBySpace ? numCutsBySpace : maxPossibleCutsByPoly)
					emit('signalPossibleNumberOfCuts', maxPossibleCutsByPoly > numCutsBySpace ? numCutsBySpace : maxPossibleCutsByPoly);
				}
			}

			for (let i = 0; i < this.objectManager.composingPolytopes[0].length; i++) {
				let maxCoeff = math.max(math.norm(this.objectManager.composingPolytopes[0][i]));
				if (math.abs(maxCoeff) > maxValue) {
					maxValue = maxCoeff;
				}
			}
		} else {
			emit('signalPossibleNumberOfCuts', 0);
		}

		console.log('maxValue', maxValue)
		emit('signalGenerateDimensionVieweing', [], this.camerasND, this.camera3D, true, maxValue);

		this.cutLocations = []
		this.objectManager.updateObjects(this.cutLocations, this.camerasND)
	}

	generateCameras(numCameras, xOffset = 2.0){
		if(this.objectManager){
			this.camerasND = [];
			for (let i = numCameras; i > 3; i--){
				let position = math.zeros(i, 1);
				set(position, i-1, 0, xOffset);
				let target = math.zeros(i, 1);
				this.camerasND.push(new CameraND(i, position, target))
			}
		}
	}

	moveCameraOrigin(currentCamera, changedIndex, newValue){
		//Camera should never be smaller than four, 
		//Because it receives the Dimension of the camera and not its index
		if (currentCamera > 3) {
			currentCamera -= 4;
			console.log(this.camerasND[this.camerasND.length - currentCamera - 1].position+'')
			set(this.camerasND[this.camerasND.length - currentCamera - 1].position, changedIndex, 0, newValue);
			console.log(this.camerasND[this.camerasND.length - currentCamera - 1].position+'')
			for(let obj of this.objectManager.currentObjects){
				obj.updateVertexMatrix(this.camerasND);
			}
			this.objectManager.updateObjects(this.cutLocations, this.camerasND);

			console.log("Changing Origin of Dimension", this.camerasND[this.camerasND.length - currentCamera - 1].N);
			console.log("Position", changedIndex, "=", newValue);
		}
	}

	moveCameraTarget(currentCamera, changedIndex, newValue){
		//Camera should never be smaller than four, 
		//Because it receives the Dimension of the camera and not its index
		if (currentCamera > 3) {
			currentCamera -= 4;
			set(this.camerasND[this.camerasND.length - currentCamera - 1].target, changedIndex, 0, newValue);

			for(let obj of this.objectManager.currentObjects){
				obj.updateVertexMatrix(this.camerasND);
			}
			this.objectManager.updateObjects(this.cutLocations, this.camerasND);

			console.log("Changing Target of Dimension", this.camerasND[this.camerasND.length - currentCamera - 1].N);
			console.log("Position", changedIndex, "=", newValue);
		}
	}


  	changeCameraPerspective(currentCamera, newValue){
  		if (currentCamera <= 3) {
			//This should never occur
			console.log('changeCameraPerspective with currentCamera <= 3:', currentCamera);
			return;
		}

		currentCamera -= 4;
		this.camerasND[this.camerasND.length - currentCamera - 1].usePerspective = newValue;
		for (let obj of this.objectManager.currentObjects){
			obj.updateVertexMatrix(this.camerasND);
		}
		this.objectManager.updateObjects(this.cutLocations, this.camerasND);

		console.log("Changing Perspective of Dimension", this.camerasND[this.camerasND.length - currentCamera - 1].N);
		console.log("New Value is ", newValue);
	
  	}
  	
	receiveCutLocationChange(index, newValue){
		console.log("Change Cut", index, "to", newValue);

		this.cutLocations[index] = newValue;
		this.objectManager.updateObjects(this.cutLocations, this.camerasND);
	}

  	receiveNewNumberOfCuts(numberOfCuts){
		this.generateCameras(this.objectManager.numberOfDimensions - numberOfCuts);
		this.cutLocations = math.zeros(numberOfCuts)._data;
		this.objectManager.updateObjects(this.cutLocations, this.camerasND);

		console.log("New Number Of Cuts: ", numberOfCuts);

		let maxValue = 0.0;
		for (let i = 0; i < this.objectManager.composingPolytopes[0].length; i++) {
			let maxCoeff = math.max(math.norm(this.objectManager.composingPolytopes[0][i]));
			if (math.abs(maxCoeff) > maxValue) {
				maxValue = maxCoeff;
			}
		}

		emit('signalGenerateDimensionVieweing', this.cutLocations, this.camerasND, this.camera3D, true, maxValue);
	}

  	receiveChangeFaceCulling(newValue){
  		this.objectManager.setUsingCulling(newValue)
  	}

  	receiveChangeWireframe(newValue){
  		this.objectManager.setRenderingMode(newValue ? OBJECTND_RENDERINGMODE_LINES : OBJECTND_RENDERINGMODE_FACES);
  	}

  	receiveOpenFile(file, format){
  		this.openFile(file, format)
  	}

  	receiveRotationPlaneChange(axis1, axis2){
  		if(typeof axis1 == 'undefined' || typeof axis2 == 'undefined'){return;}

  		console.log("New Planes of Rotation:", axis1, "and", axis2);
		this.rotPlane1 = axis1;
		this.rotPlane2 = axis2;
  	}

  	setBackgroundColor(newRed, newGreen, newBlue){
  		this.backgroundColor[0] = newRed;
		this.backgroundColor[1] = newGreen;
		this.backgroundColor[2] = newBlue;
  	}

  	receiveChangeBackgroundColor(newRed, newGreen, newBlue){
  		this.setBackgroundColor(newRed, newGreen, newBlue);

		console.log("New Background Color:", newRed, ",", newGreen, ", ", newBlue);
  	}

	
}

let hypercube_file = `4 4

16
-0.5 -0.5 -0.5 -0.5
-0.5 -0.5 -0.5  0.5
-0.5 -0.5  0.5 -0.5
-0.5 -0.5  0.5  0.5
-0.5  0.5 -0.5 -0.5
-0.5  0.5 -0.5  0.5
-0.5  0.5  0.5 -0.5
-0.5  0.5  0.5  0.5
 0.5 -0.5 -0.5 -0.5
 0.5 -0.5 -0.5  0.5
 0.5 -0.5  0.5 -0.5
 0.5 -0.5  0.5  0.5
 0.5  0.5 -0.5 -0.5
 0.5  0.5 -0.5  0.5
 0.5  0.5  0.5 -0.5
 0.5  0.5  0.5  0.5

32
 0  1 
 1  3 
 2  3 
 0  2
 4  5 
 5  7 
 6  7 
 4  6 
 0  4 
 1  5 
 2  6 
 3  7
 8  9
 9 11 
10 11
 8 10
12 13 
13 15 
14 15 
12 14 
 8 12 
 9 13 
10 14
11 15
 0  8 
 1  9 
 2 10 
 3 11
 4 12 
 5 13 
 6 14 
 7 15

24
     0     1     2     3
     4     5     6     7
     0     4     8     9
     2     6    10    11
     3     7     8    10 
     1     5     9    11 
    12    13    14    15
    16    17    18    19
    12    16    20    21
    14    18    22    23
    15    19    20    22
    13    17    21    23
     0    12    24    25 
     2    14    26    27
     3    15    24    26
     1    13    25    27
     4    16    28    29
     6    18    30    31
     7    19    28    30
     5    17    29    31
     8    20    24    28
     9    21    25    29
    10    22    26    30
    11    23    27    31 

8
 0  1  2  3  4  5
 6  7  8  9 10 11
 0  6 12 13 14 15
 1  7 16 17 18 19
 2  8 12 16 20 21
 3  9 13 17 22 23
 4 10 14 18 20 22
 5 11 15 19 21 23

 1
 0 1 2 3 4 5 6 7`