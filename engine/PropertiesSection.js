function getNameOfDimension(i){
	const cartesianDimensions = "XYZWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqponmlkjihgfedcba";

	if (i < 52) {
		return cartesianDimensions[i];
	} else {
		return i+'';
	}
}

function hexToColorArray(hexStr){
	hexStr = hexStr.substr(1);
	let chunks = [hexStr[0]+hexStr[1], hexStr[2]+hexStr[3], hexStr[4]+hexStr[5]];
	return chunks.map(x=>parseInt(x, 16));
}

class PropertiesSection{
	constructor(widgetsArea){
		this.camerasCutsArea = widgetsArea;
	}

	generateDimensionViewing(cutLocations, camerasND, camera3D, disallowFaceculling, maxValue){
		// This is a dumb workaround for the fact I'm reinstantiating this part every time
		// Should be simple to extract
		let oldColor = '#334C4C';
		if(document.querySelector("#inputTextarea")){
			oldText = document.querySelector("#inputTextarea").value
			oldColor = document.querySelector("#backgroundColorpicker").value
		}

		while (this.camerasCutsArea.firstChild) {
			this.camerasCutsArea.removeChild(this.camerasCutsArea.firstChild);
		}

		let area = this.camerasCutsArea;
		this.numberOfCameras = camerasND.length;
		this.currentNumberOfCuts = cutLocations.length;

		//General settings (are the same every time, but we recreate them anyway)

		let filePicker = document.createElement('input');
		filePicker.type = 'file'
		filePicker.id = 'filepicker'
		filePicker.onchange = function(e){
			var file = e.target.files[0];
			console.log(file.name)
			if (!file) {
				return;
			}
			var reader = new FileReader();
			reader.onload = function(e) {
				if(file.name.toLowerCase().endsWith('.pol')){
					emit('signalOpenFile', e.target.result, OBJECTNDMANAGER_POL_FORMAT);
				} else if(file.name.toLowerCase().endsWith('.ndp')){
					emit('signalOpenFile', e.target.result, OBJECTNDMANAGER_NDP_FORMAT);
				} else {
					alert('Error poening file! File needs to end either in ".ndp" or ".pol"');
				}
			};
			reader.readAsText(file);
		}
		area.appendChild(filePicker)
		br(area)

		// Background colorpicker
		area.appendChild(document.createTextNode("Background: "));
		colorpicker(area, 'backgroundColorpicker', oldColor).addEventListener("input",(event)=>{
		   emit('signalChangeBackgroundColor', ...hexToColorArray(event.target.value).map(x=>x/255));
		});
		br(area);
		hr(area);

		// Cut selection
		let cutsLabels = []
		for (let i = 0; i < this.maxNumberOfCuts+1; i++){
			cutsLabels.push({label:i, value:i})
		}
		let cutSelect = select(area, 'cutSelect', 'Number of Cuts:', cutsLabels, false, onchange=function(e){
			let newNumCuts = parseInt(e.srcElement.value)
			this.currentNumberOfCuts = newNumCuts;
			emit('signalNewNumberOfCuts', newNumCuts)
		})
		cutSelect.value = this.currentNumberOfCuts
		br(area);
		

		// Basic options/rotation display
		checkbox(area, 'faceCullingCheckbox', 'Face Culling (Experimental)', false, disallowFaceculling, onchange=function(e){emit('signalFaceCullingChange', e.srcElement.checked)});
		br(area);
        checkbox(area, 'wireframeCheckbox', 'Wireframe (not working)', true, true, onchange=function(e){emit('signalWireframeChange', e.srcElement.checked)});
        br(area);

        let numberOfDimensions = cutLocations.length + camerasND.length + 3;

        let rotationPlaneLabels = [];
        for (let i = 0; i < numberOfDimensions; i++) {
			let nameDim1 = getNameOfDimension(i);
			for (let j = i + 1; j < numberOfDimensions; j++) {
				let nameDim2 = getNameOfDimension(j);
				let str = (nameDim1 + "-" + nameDim2);

				rotationPlaneLabels.push({label:str, value:i+','+j});
			}
		}

        select(area, 'rotationSelect', 'Rotation Plane:', rotationPlaneLabels, false, onchange=function(e){
        	let rots = e.srcElement.value.split(',').map(x=>parseInt(x));
        	emit('signalRotationPlaneChange', rots[0], rots[1]);
        });
        br(area);

        this.rotationAmountTextbox = labeledTextbox(area, 'degreesRotatedInput', 'Degrees Rotated:', '0.0', 5, false, true)
        br(area)
        hr(area)

        {
        	console.log(camera3D)
        	let p = camera3D.position._data.map(x=>x[0]);
			let t = math.add(camera3D.position, camera3D.front)._data.map(x=>x[0]);
        	this.firstPropertyComponent = new CameraNPropertyComponent(3, p, t, false, area);
        	hr(area);
        }

        for(let i = 0; i < this.numberOfCameras; i++){
        	let p = camerasND[camerasND.length - i - 1].position._data.map(x=>x[0]);
			let t = camerasND[camerasND.length - i - 1].target._data.map(x=>x[0]);
        	new CameraNPropertyComponent(i + 4, p, t, true, area);
        	hr(area);
        }

        for(let i = 0; i < cutLocations.length; i++){
        	new CutNPropertyComponent(this.numberOfCameras + i + 4, i, 0, maxValue + 0.1, area);
        	hr(area);
        }
	}

	receiveChangedFirstThreePositions(ox, oy, oz, tx, ty, tz){
		if (this.firstPropertyComponent) {
			this.firstPropertyComponent.changedFirstThreePositions(ox, oy, oz, tx, ty, tz);
		}
	}

	receiveGenerateDimensionVieweing(cutLocations, cameras, camera3D, allowFaceculling, maxValue){
		this.generateDimensionViewing(cutLocations, cameras, camera3D, allowFaceculling, maxValue);
	}

	receiveNewMaxNumberOfCuts(num){
		this.maxNumberOfCuts = num;
	}

	receiveAddRotation(amount){
		let angle = parseFloat(this.rotationAmountTextbox.value) + amount * (180/Math.PI);
		if (angle > 360.0) {
			angle -= 360.0;
		} else if (angle < 0) {
			angle += 360.0;
		}

		this.rotationAmountTextbox.value = angle;
	}
}
