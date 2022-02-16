class ObjectND{
	constructor(
		N, vertices, 
		edges, edgesWithCulling, 
		faces, facesWithCulling, 
		camerasND, parent, 
		renderingMode){
		this.N = N;
		this.originalVertices = vertices.map(x=>x.clone());
		this.currentVertices = this.originalVertices;

		this.edgesList = edges;
		this.edgesWithCullingList = edgesWithCulling;
		this.facesList = faces;
		this.facesWithCullingList = facesWithCulling;

		this.parent = parent;
		this.requiresUpdate = false;

		this.updateVertexMatrix(camerasND, false);

		this.initializeOpenGL();

		this.useCulling = false;
		this.renderingMode = -1;
		this.setRenderingMode(renderingMode)
	}

	onDelete(){
		this.parent.gl.deleteBuffer(this.VAO);
		this.parent.gl.deleteBuffer(this.VBO);
		this.parent.gl.deleteBuffer(this.EBO);
	}

	initializeOpenGL(){
		let gl = this.parent.gl;

		this.vertices = math.flatten(math.matrix(this.currentVertices))._data;
		this.indices = math.flatten(this.edgesList.value)
		this.indicesFaces = math.flatten(this.facesList.value)

		// Create VAO, VBO and EBO
		this.VAO = gl.createVertexArray();
		gl.bindVertexArray(this.VAO);

		this.VBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.DYNAMIC_DRAW);
		let positionAttLocation = gl.getAttribLocation(this.parent.shaderProgram, 'position')
		gl.enableVertexAttribArray(positionAttLocation);
		gl.vertexAttribPointer(positionAttLocation, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

		this.EBO = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.EBO);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW, 0);

	}

	getRenderingMode(){ return this.renderingMode; }
	setRenderingMode(newRenderingMode){
		if(this.renderingMode == newRenderingMode){return;}
		this.renderingMode = newRenderingMode;
		this.updateEBO();
	}

	getUseCulling(){ return this.useCulling; }
	setUseCulling(newUseCulling){
		if(this.useCulling == newUseCulling){return;}
		this.useCulling = newUseCulling;
		this.updateEBO();
	}

	updateEBO(){

		return;

		let gl = this.parent.gl;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.EBO);
		if(this.renderingMode == OBJECTND_RENDERINGMODE_LINES){
			if(this.useCulling){
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(math.flatten(math.matrix(this.edgesWithCullingList.value))._data), gl.STATIC_DRAW, 0);
			}else{
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW, 0);
			}
		} else if(this.renderingMode == OBJECTND_RENDERINGMODE_FACES){
			if(this.useCulling){
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(math.flatten(math.matrix(this.facesWithCullingList.value))._data), gl.STATIC_DRAW, 0);	
			}else{
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indicesFaces), gl.STATIC_DRAW, 0);	
			}
		}
	}

	render() {
		let gl = this.parent.gl;

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.bindVertexArray(this.VAO);
		if(this.renderingMode == OBJECTND_RENDERINGMODE_LINES){
			if (this.useCulling) {
				gl.drawElements(gl.LINES, this.edgesWithCullingList.value.length*2, gl.UNSIGNED_SHORT, 0);
			} else {
				gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_SHORT, 0);
			}
		} else if(this.renderingMode == OBJECTND_RENDERINGMODE_FACES){
			if (this.useCulling) {
				gl.drawElements(gl.TRIANGLES, this.facesWithCullingList.value.length*3, gl.UNSIGNED_SHORT, 0);
			} else {
				gl.drawElements(gl.TRIANGLES, this.facesList.value.length*3, gl.UNSIGNED_SHORT, 0);
			}
		} else {
			console.log("Invalid renderingMode!")
		}
		gl.bindVertexArray(null);
	}

	updateVertexMatrix(camerasND, doUpdateVBO){
		this.currentVertices = this.originalVertices;

		console.log('cameras', camerasND.length, camerasND)
		for (let c of camerasND){
			this.currentVertices = projectPointsLosingDimension(this.currentVertices, c.viewProjectionModelMatrix, c.usePerspective);
		}

		if(doUpdateVBO){
			updateVBO();
		}
	}

	updateVBO(){
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
		gl.bufferData(gl.ARRAY_BUFFER, this.currentVertices.map(x=>math.flatten(math.transpose(x))._data), gl.DYNAMIC_DRAW, 0);
	}
}