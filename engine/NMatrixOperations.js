function print(a){console.log(a)}

function resultOrDefault(v, d){
	if(typeof v == 'undefined'){
		return d;
	}
	return v;
}

function rows(m){ return resultOrDefault(m.size()[0], 1); }
function cols(m){ return resultOrDefault(m.size()[1], 1); }

function getBlockIndex(i, j, p, q){
	let lines = math.range(i, p+i)
	let rangeWithinLine = math.range(j, q+j)
	return math.index(lines, rangeWithinLine)
}


function getBlock(mTarget, i, j, p, q){
	if(p == 0 || q == 0){
		return math.matrix()
	}
	return mTarget.subset(getBlockIndex(i, j, p, q))
}

function setBlockInplace(mTarget, i, j, p, q, mSource){
	if(p == 0 || q == 0){
		return mTarget
	}
	return mTarget.subset(getBlockIndex(i, j, p, q), mSource)
}

function getCol(m, i){return m.subset(getBlockIndex(0, i, rows(m), 1))}
function setColInplace(m, i, t){return m.subset(getBlockIndex(0, i, rows(m), 1), t)}

function getRow(m, i){return m.subset(getBlockIndex(i, 0, 1, cols(m)))}
function setRowInplace(m, i, t){return m.subset(getBlockIndex(i, 0, 1, cols(m)), t)}

function get(m, i, j){return m.subset(math.index(i, j));}
function set(m, i, j, v){return m.subset(math.index(i, j), v);}

function getLast(v){
	if(v.size().length == 1){
		return v.subset(math.index(v.size()[0] - 1))
	}

	if(rows(v) == 1){
		return get(v, 0, cols(v) - 1)
	}else{
		return get(v, rows(v)-1, 0)
	}
}

function normalized(v){
	v = math.flatten(v)
	v = math.divide(v,math.norm(v))
	return math.resize(v, [v.size()[0], 1])
}

function getNormalVector(vectors) {
	assert(rows(vectors) == cols(vectors) + 1);
	const N = rows(vectors);

	let pM = math.transpose(vectors);
	pM.resize([rows(pM)+1, cols(pM)]);
	setRowInplace(pM, N-1, math.zeros(N));

	let baseVectors = math.identity(N, N);

	let result = math.zeros(1,N);

	let signal = 1;
	for (let i = 0; i < N; i++){
		let pS = math.zeros(N - 1, N - 1);

		for (let j = 0; j < (N - 1); j++){
			setBlockInplace(pS, j, 0, 1, i, getBlock(pM, j, 0, 1, i));
			setBlockInplace(pS, j, i, 1, N - i - 1, getBlock(pM, j, i + 1, 1, N - i -1));
		}

		let aux = math.multiply(signal, getRow(baseVectors, i), math.det(pS));
		result = math.add(result, aux);
		signal *= -1;
	}

	return result;
}

function translateMatrixN(N, point) {
	assert(N > 0);

	let m = math.identity(N + 1, N + 1);
	setColInplace(m, N, math.concat(math.flatten(point), [1]));
	return m;
}

// This was based on https://ef.gy/linear-algebra:perspective-projections
// However, he makes this in a different way than every other LookAt I could find
// Therefore it has been silightly adjusted to conform to the others
function lookAtMatrixN(N, from, to, ups){
	assert(N > 2);

	let m = math.zeros(N, N);

	let toMinusFrom = math.subtract(to, from);
	setColInplace(m, N-1, normalized(toMinusFrom));

	let numLoops = 0;
	for(let currentColumn = N - 2; currentColumn > 0; currentColumn--){
		vectorsToCross = math.zeros(N, N - 1);
		currentColumnOnVectorsToCross = 1;

		//First, cross product all ups, in order
		setColInplace(vectorsToCross, 0, getCol(ups, numLoops))
		for(let i = 1; i < currentColumn; i++){
			setColInplace(vectorsToCross, currentColumnOnVectorsToCross, getCol(ups, numLoops+i));
			currentColumnOnVectorsToCross++;
		}

		numLoops++;
		for(let i = 0; i < numLoops; i++){
			setColInplace(vectorsToCross, currentColumnOnVectorsToCross, getCol(m, currentColumn + i + 1));
			currentColumnOnVectorsToCross++;
		}

		let normal = math.flatten(getNormalVector(vectorsToCross));
		setColInplace(m, currentColumn, normalized(normal));
	}

	setColInplace(m, 0, math.transpose(getNormalVector(getBlock(m, 0, 1, rows(m), cols(m)-1))));
	m.resize([N+1, N+1]);
	m.subset(math.index(N, N), 1);

	return math.transpose(m);
}

function perspectiveMatrixN(N, eyeRadiansAngle, nearPlane, farPlane, aspectRatio){
	assert(N > 2);

	if(N == 3) {
		let m = math.zeros(N + 1, N + 1);
		f_tan = 1 / math.tan(eyeRadiansAngle/2);
		m.subset(math.index(0, 0), f_tan / aspectRatio);
		m.subset(math.index(1, 1), f_tan);
		m.subset(math.index(2, 2), (nearPlane + farPlane) / (nearPlane - farPlane));
		m.subset(math.index(2, 3), -1.0);
		m.subset(math.index(3, 2), 2 * (nearPlane*farPlane) / (nearPlane - farPlane));

		return math.transpose(m);
	} else {
		let m = math.identity(N + 1, N + 1);

		f_tan = 1 / math.tan(eyeRadiansAngle / 2);
		m = math.multiply(m, f_tan);
		m.subset(math.index(N - 1, N - 1), 1);
		m.subset(math.index(N, N), 1);

		return m;
	}
}

function viewMatrixN(N, from, to, ups, eyeRadiansAngle, nearPlane, farPlane, aspectRatio){
	assert(N > 3)

	let tr = translateMatrixN(N, math.multiply(-1, from));
	let la = lookAtMatrixN(N, from, to, ups);
	let pm = perspectiveMatrixN(N, eyeRadiansAngle, nearPlane, farPlane, aspectRatio);

	let result = math.multiply(pm, la, tr)

	//Axis direction correction
	let aux = math.identity(N + 1, N + 1);
	//X correction
	aux.subset(math.index(0, 0), -1);
	//Z correction
	aux.subset(math.index(2, 2), N != 4 ? -1 : 1);

	//Apply corrections
	result = math.multiply(aux, result);

	return result
}

//This assumes that point is an N+1 dimensional vector and that point(N) == 1
function projectPointLosingDimension(point, m){
	let pointWith1 = math.resize(point, [rows(point)+1, 1], 1);

	let v = math.multiply(m, pointWith1);
	v = math.divide(v, v.subset(math.index(rows(v) - 2, 0)))

	let result = math.resize(math.flatten(getCol(v, 0)), [v.size()[0]-1])
	return result
}

//This assumes that each point is an N+1 dimensional column in a matrix and that point(N) == 1
function projectPointsLosingDimension(points, m, usePerspective){
	if(points.length == 0){
		return points;
	}
	
	const nearlyZero = 0.000001;
	console.log('projectPointsLosingDimension')
	console.log('points', points)
	console.log('m', m)
	points = math.transpose(math.matrix([...points.map(x=> math.transpose(math.flatten(x)._data))]))
	console.log('points', points)
	let pointsWith1 = math.resize(points, [rows(points) + 1, cols(points)], 1);
	console.log('pointsWith1', pointsWith1)



	let v = math.multiply(m, pointsWith1);
	let indexDivider = usePerspective ? 2 : 1

	for(let i = 0; i < cols(v); i++){
		if(get(v, rows(v)-indexDivider, i) == 0 || get(v, rows(v)-indexDivider, i) == -0){
			setColInplace(v, i, math.divide(getCol(v, i), nearlyZero));
		} else {
			setColInplace(v, i, math.divide(getCol(v, i), get(v, rows(v) - indexDivider, i)))
		}
	}

	let result = math.transpose(getBlock(v, 0, 0, rows(v) - 2, cols(v)))._data;
	result = result.map(x=>math.matrix(x))
	console.log('result', result)
	result = result.map(x=>x)
	return result;
}

// Generates the rotation matrix in the planes defines by axis1 and axis2
function rotateMatrixN(N, axis1, axis2, radiansAngle){
	assert(axis1 != axis2);

	rotAA = math.identity(N, N);
	set(rotAA, axis1, axis1, math.cos(radiansAngle))
	set(rotAA, axis1, axis2, math.sin(radiansAngle))
	set(rotAA, axis2, axis1, -math.sin(radiansAngle))
	set(rotAA, axis2, axis2, math.cos(radiansAngle))

	return math.transpose(rotAA)
}

//This assumes that each point is an N dimensional column vector in the matrix
function makeVectorsHomogeneous(points){
	return points.resize([rows(points) + 1, cols(points)], 1)
}

//This assumes a square matrix
function makeMatrixHomogeneous(m){
	m.resize([rows(m) + 1, cols(m) + 1], 0);
	set(m, rows(m)-1, cols(m)-1, 1);

	return m;
}

//function rotateShapeToLowerDimension(){}