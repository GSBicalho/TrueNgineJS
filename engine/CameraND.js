const CAMERA_N_EYE_ANGLE = 45.0;

class CameraND {
	constructor(N, position, target, usePerspective = true,	eyeAngle = CAMERA_N_EYE_ANGLE){
		assert(rows(position) == N);
		assert(N >= 4);

		this.N = N;

		this.position = position;
		this.target = target;
		this.eyeAngle = eyeAngle;
		this.usePerspective = usePerspective;

		this.ups = math.zeros(N, N - 2);
		set(this.ups, N - 1, N - 3, 1);
		for(let i = 0; i < N - 3; i++){
			set(this.ups, N - 3 - i, i, 1)
		}

		//This is added so the user is able to look from the Up axes
		//It is a minimal perturbation, which does not affect the rendering
		setRowInplace(this.ups, 0, math.multiply(0.0000001, math.ones(N - 2)))
	}

	get viewProjectionModelMatrix(){
		return viewMatrixN(this.N, this.position, this.target, this.ups, this.eyeAngle, 0, 0, 0);
	}
}
