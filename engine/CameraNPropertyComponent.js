

class CameraNPropertyComponent{
	generateInputOnchange(signal, dimensonCamera, dim){
		return function(e){
			console.log(e)
			let isValidDouble = /^\-?[0-9]+(e[0-9]+)?\.?([0-9]+)?$/.test(e.srcElement.value);
			if(isValidDouble){
				console.log(signal, dimensonCamera, dim, parseFloat(e.srcElement.value))
				emit(signal, dimensonCamera, dim, parseFloat(e.srcElement.value))
			}
			return isValidDouble;
		}
	}

	constructor(N, originPosition, targetPosition, isEditable, parent){
		const cartesianDimensions = "XYZWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqponmlkjihgfedcba";

		this.N = N;
		this.firstThreeEye = []
		this.firstThreeTarget = []

		var mainDiv = document.createElement('div');
		mainDiv.appendChild(document.createTextNode('Dimension ' + N + ' Camera'));
		br(mainDiv)

		if(isEditable){
			checkbox(mainDiv, 'camera'+N+'Perspective', 'Perspective', true, false, function(e){emit('signalCameraChangedPerspective', N, e.srcElement.checked)});
			br(mainDiv);
		}

		var table = document.createElement('table');
		var titleTr = document.createElement('tr');
		var eyeTitle = document.createElement('th');
		var targetTitle = document.createElement('th');

		eyeTitle.innerHTML = 'Eye Point';
		targetTitle.innerHTML = 'Target Point';
		titleTr.appendChild(eyeTitle);
		titleTr.appendChild(targetTitle);
		table.appendChild(titleTr)

		for(let i = 0; i < N; i++){
			var lineTr = document.createElement('tr');
			
			var eyeTd = document.createElement('td');
			var labelEye = document.createElement('label');
			var inputEye = document.createElement('input');
			inputEye.id = 'camera'+N+'EyeInput'+i;
			inputEye.disabled = !isEditable;
			inputEye.value = originPosition[i];
			inputEye.size = 6;
			inputEye.style = 'text-align: right; float: right;'
			inputEye.onchange = this.generateInputOnchange('signalCameraOriginMovement', N, i);

		    labelEye.htmlFor = inputEye.id;
		    labelEye.appendChild(document.createTextNode(getNameOfDimension(i)));
		    labelEye.style = 'text-align: left; float: left;'

		    eyeTd.appendChild(labelEye);
		    eyeTd.appendChild(inputEye);
		    lineTr.appendChild(eyeTd);

		    var targetTd = document.createElement('td');
			var labelTarget = document.createElement('label');
			var inputTarget = document.createElement('input');
			inputTarget.id = 'camera'+N+'TargetInput'+i;
			inputTarget.disabled = !isEditable;
			inputTarget.value = targetPosition[i];
			inputTarget.size = 6;
			inputTarget.style = 'text-align: right; float: right;'
			inputTarget.onchange = this.generateInputOnchange('signalCameraTargetMovement', N, i);

		    labelTarget.htmlFor = inputTarget.id;
		    labelTarget.appendChild(document.createTextNode(getNameOfDimension(i)));

		    targetTd.appendChild(labelTarget);
		    targetTd.appendChild(inputTarget);
		    lineTr.appendChild(targetTd);

		    table.appendChild(lineTr)

		    if (i < 3) { 
				this.firstThreeEye.push(inputEye); 
				this.firstThreeTarget.push(inputTarget); 
			}
		}

		mainDiv.appendChild(table);
		parent.appendChild(mainDiv);
	}

	changedFirstThreePositions(ox, oy, oz, tx, ty, tz) {
		this.firstThreeEye[0].value = ox;
		this.firstThreeEye[1].value = oy;
		this.firstThreeEye[2].value = oz;

		this.firstThreeTarget[0].value = tx;
		this.firstThreeTarget[1].value = ty;
		this.firstThreeTarget[2].value = tz;
	}
}