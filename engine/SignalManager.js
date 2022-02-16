let signalRegistry = {}

function connect(signalName, obj, f){
	if(signalName in signalRegistry){
		signalRegistry[signalName].push({obj:obj, f:f})
	}else{
		signalRegistry[signalName] = [{obj:obj, f:f}]
	}
}

function emit(signalName, ...fParams){
	if(signalName in signalRegistry){
		for(let p of signalRegistry[signalName]){
			p.f.call(p.obj, ...fParams)
		}
	}
}