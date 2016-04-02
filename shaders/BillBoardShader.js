/// <reference path="../webgl-frameworks/Three.js" />
/**
 * @author mrdoob / http://www.mrdoob.com
 *
 * Simple test shader
 */

THREE.BillBoardShader = {
    uniforms: {
        color: { type: "c", value: new THREE.Color().setHex(0x0000ff) }
    },
	vertexShader: [

		"void main() {",

			"gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0) + vec4(position.x, position.y, 0.0, 0.0));",
		"}"

	].join("\n"),
	fragmentShader: [
		"uniform vec3 color;",
		"void main() {",
			"gl_FragColor = vec4(color,1);",
		"}"

	].join("\n")
};
