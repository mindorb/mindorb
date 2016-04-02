/// <reference path="../webgl-frameworks/Three.js" />
/**
  @author David Piegza

  Implements a selection for objects in a scene.

  It invokes a callback function when the mouse enters and when it leaves the object.
  Based on a Three.js selection example.

  Parameters:
    domElement: HTMLDomElement
    selected: callback function, passes the current selected object (on mouseover)
    clicked: callback function, passes the current clicked object
 */

var mouse = { x: 0, y: 0, moved : false, shift : false};
THREE.ObjectSelection = function (parameters) {
    var parameters = parameters || {};
    this.point = null;
    this.domElement = parameters.domElement || document;
    this.projector = new THREE.Projector();
    this.INTERSECTED;
    this.mask = ['node','hull'];
    var _this = this;
    var base = null;
    var callbackSelected = parameters.selected;
    var callbackClicked = parameters.clicked;
    var callbackMouseDown = parameters.mouseDown;
    var callbackMouseUp = parameters.mouseUp;

    this.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    function onDocumentMouseMove(event) {
        mouse.moved=true;
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    this.domElement.addEventListener('click', onDocumentMouseClick, false);
    function onDocumentMouseClick(event) {
        if (_this.INTERSECTED) {
            if (typeof callbackClicked === 'function') {
                
                callbackClicked(_this.INTERSECTED);
            }
        }
    }
    this.domElement.addEventListener('mousedown', onMouseDown, false);

    function onMouseDown(event) {
        mouse.moved=false;
		
        if (mouse.shift==false) { controls.enabled=true; }
        if (_this.INTERSECTED) {
            if (typeof callbackMouseDown === 'function') {
                callbackMouseDown(_this.INTERSECTED, event);
            }
        }
    }
    this.domElement.addEventListener('mouseup', onMouseUp, false);
    function onMouseUp(event) {
    	controls.enabled=false;
        if (typeof callbackMouseUp === 'function') {
            callbackMouseUp(_this.INTERSECTED, event);
        }
    }
    i = 0;
    this.render = function (scene, camera) {
        base = scene;
        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        this.projector.unprojectVector(vector, camera);

        var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

        var intersects = raycaster.intersectObject(scene, true);
        var i = 1;
        while (intersects.length > 0 && intersects[0].object && this.mask.indexOf(intersects[0].object.type)<0) {            
            intersects.splice(0, 1);
        }
        if (intersects.length > 0) {
            if (this.INTERSECTED) {
                this.INTERSECTED.intersectionPoint = intersects[0].point;
                /*  this is put here to make sure the point of intersection is alwaays correct 
                    since the intersection point was only updated on entry of the hull
                */
            }
            if (this.INTERSECTED != intersects[0].object && this.mask.indexOf(intersects[0].object.type) >= 0) {
                if (this.INTERSECTED) {
                    this.INTERSECTED.material.color.setHex(this.INTERSECTED.currentHex);
                }

                this.INTERSECTED = intersects[0].object;
                console.log(this.INTERSECTED.material.color); debugger;
                this.INTERSECTED.currentHex = this.INTERSECTED.material.color.getHex();
                this.INTERSECTED.material.color.setHex(0xff00ff);
                if (typeof callbackSelected === 'function') {
                    callbackSelected(this.INTERSECTED);
                }
            }
        } else {

            if (this.INTERSECTED) {
                this.INTERSECTED.material.color.setHex(this.INTERSECTED.currentHex);
            }
            this.INTERSECTED = null;
            if (typeof callbackSelected === 'function') {
                callbackSelected(this.INTERSECTED);
            }
        }

    }
}
