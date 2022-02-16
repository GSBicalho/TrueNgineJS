// Defines several possible options for camera movement. Used as abstraction to stay away from window-system specific input methods
const CameraMovement = {
	FORWARD: 0,
	BACKWARD: 1,
	LEFT: 2,
	RIGHT: 3,
	UP: 4,
	DOWN: 5
}

// Default camera values
const YAW = -90.0;
const PITCH = 0.0;
const SPEED = 3.0;
const SENSITIVTY = 0.25;
const ZOOM = 45.0;

// An abstract camera class that processes input and calculates the corresponding Eular Angles, Vectors and Matrices for use in OpenGL
class Camera3D {
	constructor(position = math.matrix([[0],[0],[2]]), up = math.matrix([[0],[1],[0]]), yaw=YAW, pitch=PITCH, movementSpeed=SPEED, mouseSensitivity=SENSITIVTY, zoom=ZOOM){
		this.position = position;
		this.worldUp = up;
		this.yaw = yaw;
		this.pitch = pitch;
		this.movementSpeed=movementSpeed;
		this.mouseSensitivity=mouseSensitivity;
		this.zoom=zoom;
		this.updateCameraVectors();
	}

	get viewMatrix(){
		let lookAt = math.zeros(4,4);
		set(lookAt, 0, 0, this.right._data[0][0])
		set(lookAt, 0, 1, this.right._data[1][0])
		set(lookAt, 0, 2, this.right._data[2][0])

		set(lookAt, 1, 0, this.up._data[0][0])
		set(lookAt, 1, 1, this.up._data[1][0])
		set(lookAt, 1, 2, this.up._data[2][0])
		
		set(lookAt, 2, 0, this.front._data[0][0])
		set(lookAt, 2, 1, this.front._data[1][0])
		set(lookAt, 2, 2, this.front._data[2][0])

		set(lookAt, 3, 0, this.position._data[0][0])
		set(lookAt, 3, 1, this.position._data[1][0])
		set(lookAt, 3, 2, this.position._data[2][0])

		return lookAt
	}

	projectionMatrix(w, h){
		let near = 0;
		let far = 100000

		let one_over_tan_eyeangle = 1/math.tan(math.unit(this.zoom, 'deg'));
		let aspect = w/h;

		let projection = math.zeros(4,4);
		set(projection, 0, 0, one_over_tan_eyeangle / aspect)
		set(projection, 1, 1, one_over_tan_eyeangle)
		set(projection, 2, 2, (near + far) / (near - far))
		set(projection, 2, 3, 2 * (near * far) / (near - far))
		set(projection, 3, 2, -1)

		return projection;
	}

	get modelMatrix(){
		return translateMatrixN(3, this.position)
	}

	processKeyboard(direction, deltaTime){
		let velocity = this.movementSpeed * deltaTime;

		if (direction == CameraMovement.FORWARD){
			this.position = math.add(this.position, math.multiply(this.front, velocity));
		}
		if (direction == CameraMovement.BACKWARD){
			this.position = math.subtract(this.position, math.multiply(this.front, velocity));
		}
		if (direction == CameraMovement.LEFT){
			this.position = math.subtract(this.position, math.multiply(this.right, -velocity));
		}
		if (direction == CameraMovement.RIGHT){
			this.position = math.add(this.position, math.multiply(this.right, -velocity));
		}
		if (direction == CameraMovement.UP){
			this.position = math.add(this.position, math.multiply(this.up, -velocity));
		}
		if (direction == CameraMovement.DOWN){
			this.position = math.subtract(this.position, math.multiply(this.up, -velocity));
		}
	}

	// Processes input received from a mouse input system. Expects the offset value in both the x and y direction.
	processMouseMovement(xoffset, yoffset, constrainPitch=true){
		xoffset *= this.mouseSensitivity;
		yoffset *= this.mouseSensitivity;

		this.yaw -= xoffset;
		this.pitch += yoffset;

		// Make sure that when pitch is out of bounds, screen doesn't get flipped
		if (constrainPitch) {
			if (this.pitch > 89.0)
				this.pitch = 89.0;
			if (this.pitch < -89.0)
				this.pitch = -89.0;
		}

		// Update Front, Right and Up Vectors using the updated Eular angles
		this.updateCameraVectors();
	}

	processMouseScroll(yoffset) {
		if (this.zoom >= 1.0 && this.zoom <= 45.0)
			this.zoom -= yoffset;
		if (this.zoom <= 1.0)
			this.zoom = 1.0;
		if (this.zoom >= 45.0)
			this.zoom = 45.0;
	}

	updateCameraVectors() {
		// Calculate the new Front vector
		let front = [];
		front[0] = math.cos(math.unit(this.yaw, "deg")) * math.cos(math.unit(this.pitch, "deg"))
		front[1] = math.sin(math.unit(this.pitch, "deg"))
		front[2] = math.sin(math.unit(this.yaw, "deg")) * math.cos(math.unit(this.pitch, "deg"))
		front = math.matrix(front)
		this.front = normalized(front)

		// Also re-calculate the Right and Up vector
		// Normalize the vectors, because their length gets closer to 0 the more you look up or down which results in slower movement.
		this.right = normalized(math.flatten(math.cross(this.front, this.worldUp)))
		this.up = normalized(math.flatten(math.cross(this.right, this.front)))
	}
}
