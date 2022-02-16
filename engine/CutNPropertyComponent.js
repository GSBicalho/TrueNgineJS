class CutNPropertyComponent{
	textboxOnChange(cutRange, multiplier, dimension){
		return function(e){
			let newValue = parseFloat(e.srcElement.value);
			cutRange.value = newValue * multiplier;
			emit('signalCutLocationChange', dimension, newValue);
		}
	}

	rangeOnChange(cutTextbox, multiplier, dimension){
		return function(e){
			let newValue = parseFloat(e.srcElement.value);
			cutTextbox.value = Math.round(newValue / multiplier * 100) / 100;
			emit('signalCutLocationChange', dimension, newValue / multiplier);
		}
	}

	constructor(N, relativeN, startingValue, maxValue, parent){
		this.N = N;
		this.relativeN = relativeN;
		const sliderMultiplier = 100;

		console.log('cut', N, startingValue, maxValue)

		var mainDiv = document.createElement('div');
		mainDiv.appendChild(document.createTextNode('Dimension ' + N + ' Cut'));
		br(mainDiv)

		let locationDiv = document.createElement('div');
		mainDiv.appendChild(locationDiv)

		var cutTextbox = labeledTextbox(locationDiv, 'cut'+N+'Textbox', 'Location:', startingValue, 10, false, false)
		br(mainDiv)
		var cutRange = range(mainDiv, 'cut'+N+"Range", -maxValue* sliderMultiplier, maxValue*sliderMultiplier, startingValue)

		cutTextbox.onchange = this.textboxOnChange(cutRange, sliderMultiplier, this.relativeN)
		onRangeChange(cutRange, this.rangeOnChange(cutTextbox, sliderMultiplier, this.relativeN))

		parent.appendChild(mainDiv)
	}
}