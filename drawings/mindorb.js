/// <reference path="../webgl-frameworks/Three.js" />
/// <reference path="../Graph.js" />
/// <reference path="../utils/TrackballControls.js" />
/// <reference path="../utils/ObjectSelection.js" />
/// <reference path="../utils/Stats.js" />
/**
  @author AhmadAboBakr

  WIP

 */
var Drawing = Drawing || {};
var controls;
Drawing.Minorb = function (options) {
    /// <summary>Create the MindOrb.</summary>
    /// <param name="options" type="Object">An object contains  the initialization data for the graph</param>
    /// <field name='showStats' type='Boolean'>Whether or not to show stats</field>
    /// <field name='selectedObject' type='THREE.Object3D'>The currently selected hull</field>
    /// <field name='limit' type='Number'>The maximum number of allowed nodes</field>
    /// <field name='edgeMaterial' type='THREE.Material'>The material used to draw edges</field>
    /// <field name='nodeMaterial' type='THREE.Material'>The material used to draw nodes</field>
    /// <field name='hullMaterial' type='THREE.Material'>The material used to draw hulls</field>
    /// <field name='text' type='Array' elementType="THREE.Object3D">Objects that faces the camera</field>
    Modes = {
        graph: 0,
        text: 1
    }
    options = options || {};

    this.show_stats = options.showStats || false;
    this.show_info = options.showInfo || false;
    this.show_labels = options.showLabels || false;
    this.limit = options.limit || 1000;
    this.edgeMaterial = options.edgeMaterial || new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 1, linewidth: 50 });
    this.nodeMaterial = options.nodeMaterial || new THREE.MeshBasicMaterial({ color: 0x0000ff, opacity: 0.5 });
    this.hullMaterial = options.hullMaterial || new THREE.MeshBasicMaterial({ color: 0xff00ff, opacity: 0.1, transparent: true })
    this.textMaterial = options.textMaterial || new THREE.MeshBasicMaterial({ color: 0x0000ff, opacity: 1, transparent: true })
    this.scaleEnabled = false;
	this.zoomEnabled = false;
    this.mode = Modes.graph;
    this.currentColor = null;
    this.keys = [];
    this.selectedObject = null;

    this.TextEntry = document.createElement("input");
    this.TextEntry.type = "Text";
    this.TextEntry.id = "TextEntry";
    this.TextEntry.onkeypress
    this.TextEntry.addEventListener("keypress", handleText);
    this.TextEntry.addEventListener("paste", handleText);
    this.TextEntry.addEventListener("change", handleText);

    this.dummyObject = new THREE.Object3D();


    this.text = [];

    document.body.appendChild(this.TextEntry);
    var camera, scene, renderer, geometry, object_selection;
    var stats;
    var id = 1;
    var info_text = {};
    var graph = new Graph({ limit: this.limit });
    var edges = [];
    var that = this;
    init();
    createGraph();
    animate();

    function init() {
        /// <summary>Initialize the MindOrb.</summary>

        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000000);
        // camera = new THREE.OrthographicCamera(0, window.innerWidth ,0, window.innerHeight, 1, 1000000);
        camera.position.z = 1000;

        controls = new THREE.TrackballControls(camera);
        controls.rotateSpeed = 0.5;
        controls.zoomSpeed = 5.2;
        controls.panSpeed = 1;

        controls.noZoom = false;
        controls.noPan = false;

        controls.staticMoving = false;

        controls.dynamicDampingFactor = 0.3;

        controls.keys = [65, 83, 68];
        controls.enabled = false;
        controls.addEventListener('change', render);
        //controls.enabled = false;

        scene = new THREE.Scene();

        geometry = new THREE.CubeGeometry(50, 50, 50);
        window.addEventListener('keydown', keyDownHandler, false);
        window.addEventListener('keyup', keyUpHandler, false);
        document.addEventListener("mousemove", mouseMove);
        document.addEventListener("keypress", keyPressHandler);
        // Create node selection, if set
        object_selection = new THREE.ObjectSelection({
            domElement: renderer.domElement,
            selected: function (obj) {
                // display info
                if (obj != null) {
                    if (obj.type == "node") {
                        info_text.select = "Object " + obj.id;
                    }
                }
                else {
                    delete info_text.select;
                }
            },
            clicked: function (obj) {
                if (that.mode == Modes.text) {
                    if (obj != null && !controls.enabled) {
                        obj.text = obj.text || "";
                        that.TextEntry.value = obj.text;
                        if (obj.type == "node" || obj.type == "edge") {
                            that.TextEntry.focus();
                            if (obj.type == "node") {
                                if (that.selectedObject) {
                                    that.selectedObject.material.color.setHex(that.currentColor)
                                }
                                that.currentColor = object_selection.INTERSECTED.currentHex;
                                that.selectedObject = obj;
                            }
                            else if (obj.type == "edge") {
                                if (that.selectedObject) {
                                    that.selectedObject.material.color.setHex(that.currentColor)
                                }
                                that.currentColor = object_selection.INTERSECTED.currentHex;
                                that.selectedObject = obj;
                            }
                        }
                    }

                }
                else if (that.mode == Modes.graph) {
                    if (obj != null && !that.scaleEnabled && !mouse.moved) { // && !controls.enabled
                        if (obj.type == "node") {
                            graph.nodes[obj.nodeID].data.drawObject.add(graph.nodes[obj.nodeID].data.hullDrawObject);
                        }
                        else if (obj.type == "hull") {
                            parent = graph.getNode(obj.nodeID);
                            var node = new Node(id++);
                            node.position = obj.intersectionPoint.clone();
                            drawNode(node, obj);

                            graph.addNode(node);
                            var edge = graph.addEdge(parent, node);
                            drawEdge(edge);

                        }
                    }
                }

            },
            mouseDown: function (obj, event) {
                /// <param name="event" type="MouseEvent">clickEvent</param>
                if (obj != null && obj.type == "hull" && that.scaleEnabled) {
                    if (that.selectedObject) {
                        that.selectedObject.material.color.setHex(0x8800ff);
                    }
                    that.selectedObject = obj;
                }
            },
            mouseUp: function (obj, event) {

            }
        });
        document.body.appendChild(renderer.domElement);

        // Stats.js
        if (that.show_stats) {
            stats = new Stats();
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.top = '0px';
            document.body.appendChild(stats.domElement);
        }

        // Create info box
        if (that.show_info) {
            var info = document.createElement("div");
            var id_attr = document.createAttribute("id");
            id_attr.nodeValue = "graph-info";
            info.setAttributeNode(id_attr);
            document.body.appendChild(info);
        }
        for (var i = 0; i < length; i++) {
            that.keys[i] = false;
        }
    }

    function createGraph() {
        /// <summary>Create a graph with an initial node at the center of the world.</summary>

        var node = new Node(0);
        node.position.x = node.position.y = node.position.z = 0;
        node.data.title = "This is node " + node.id;
        graph.addNode(node);
        drawNode(node);
        //nodes.push(node);
    }

    function drawNode(node, parentObject) {
        /// <summary>Create a node object and add it to the scene.</summary>
        /// <param name="node" type="Node">The node to Insert to the scen.</param>
        /// <param name="parentObject" type="THREE.Object3D">The parent in the scene hierarchy </param>

        parentObject = parentObject || scene;
        var drawObject = new THREE.Mesh(geometry, that.nodeMaterial.clone());
        if (that.show_labels) {
            if (node.data.title != undefined) {
                var label_object = new THREE.Label(node.data.title);
            } else {
                var label_object = new THREE.Label(node.id);
            }
            node.data.label_object = label_object;
            scene.add(node.data.label_object);
        }

        drawObject.nodeID = node.id;
        drawObject.type = "node";

        var hullGeometry = new THREE.SphereGeometry(100, 20, 20, 0, 2 * Math.PI, 0, 2 * Math.PI);
        var hull = new THREE.Mesh(hullGeometry, that.hullMaterial.clone());
        hull.type = "hull";
        hull.position = new THREE.Vector3(0, 0, 0);
        hull.nodeID = node.id;
        node.data.hullDrawObject = hull;
        node.data.drawObject = drawObject;
        drawObject.position = new THREE.Vector3(node.position.x, node.position.y, node.position.z);

        var position = new THREE.Vector3();
        var quaternion = new THREE.Quaternion();
        var scale = new THREE.Vector3();
        parentObject.matrixWorld.decompose(position, quaternion, scale);
        drawObject.position = parentObject.worldToLocal(drawObject.position);
        drawObject.scale = new THREE.Vector3(1 / scale.x, 1 / scale.y, 1 / scale.z);
        parentObject.add(node.data.drawObject);

    }

    function drawEdge(edge) {
        /// <summary>draw an edge between two Nodes</summary>
        /// <param name="edge" type="Edge">The edge between the two nodes</param>

        var source = new THREE.Vector3(0, 0, 0);
        edge.source.data.drawObject.position.clone();
        var target = edge.target.data.drawObject.position.clone();
        var controlPoint = target.clone();
        var deltax = Math.abs(source.x - target.x);
        var deltay = Math.abs(source.y - target.y);
        var deltaz = Math.abs(source.z - target.z);
        if (deltax > deltay && deltax > deltaz) {
            controlPoint.x = 0.7 * target.x;
        }
        if (deltaz > deltay && deltaz > deltay) {
            controlPoint.z = .7 * target.z;
        }
        if (deltay > deltaz && deltay > deltax) {
            controlPoint.y = .7 * target.y;
        }


        var curve = new THREE.CubicBezierCurve3(source, controlPoint, controlPoint, target);
        //console.log(curve.getPoints(20));
        var edgeGeometry = new THREE.Geometry();
        edgeGeometry.vertices = curve.getPoints(20);

        var cylinderGeometry = new THREE.CylinderGeometry(.1, 5, 20, 3, 20, false);
        for (var i = 0; i < cylinderGeometry.vertices.length; i++) {
            cylinderGeometry.vertices[i].index = cylinderGeometry.vertices[i].y + 10;
            cylinderGeometry.vertices[i].y = 0;
        }
        var linematerial = that.edgeMaterial.clone();
        var cylinder = new THREE.Mesh(cylinderGeometry, linematerial);

        for (var i = 0; i < cylinderGeometry.vertices.length; i++) {
            cylinderGeometry.vertices[i].add(edgeGeometry.vertices[cylinderGeometry.vertices[i].index]);
        }
        cylinder.type = "edge";

        edges.push(cylinder);
        edge.source.data.hullDrawObject.add(cylinder);
        //line = new THREE.Geometry();
        //line.vertices.push(source,target);
        //edge.source.data.hullDrawObject.add(line,new THREE.LineBasicMaterial({color: 0xff00ff}));


    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        render();
        if (that.show_info) {
            printInfo();
        }
    }

    function render() {

        // render selection
        object_selection.render(scene, camera);
        if (that.selectedObject) {
            that.selectedObject.material.color.setHex(0x4400ff);
        }
        if (controls.rotationChanged) {
            controls.rotationChanged = false;
            for (var i = 0; i < that.text.length; i++) {
                if (that.text[i].children[0]) {
                    that.text[i].children[0].rotation = (camera.rotation);
                }
            }
        }
        // update stats
        if (that.show_stats) {
            stats.update();
        }

        // render scene
        try {
            renderer.render(scene, camera);
        }
        catch (e) {
            debugger;
        }
    }

    function mouseMove(event) {
		
		if (that.zoomEnabled)
		{
		camera.translateZ( -event.movementX*100);
		} else
        if (that.selectedObject && !controls.enabled && that.scaleEnabled) { // to make sure the camera controls are not enabled when scaling the hull
            ScaleHull(that.selectedObject, event.movementX * 0.01);
        }
    }

    function keyDownHandler(event) {
        that.keys[event.keyCode] = true;
        if (that.mode == Modes.graph) {
            var key = String.fromCharCode(event.keyCode).toLowerCase()[0];

            switch (key) {
                case 'z':
					  that.zoomEnabled = true;
					 break;
                case 'd':
                case 'r':
                    controls.enabled = true;
                    break;
                case String.fromCharCode(16)://Shift
                    that.scaleEnabled = true;
                    mouse.shift=true;
                    break;
            }
        }
    }

    function keyUpHandler(event) {
        that.keys[event.keyCode] = false;

        if (that.mode == Modes.graph) {
            var key = String.fromCharCode(event.keyCode).toLowerCase()[0];

            switch (key) {
                case 'z':
					that.zoomEnabled = false;
                case 'd':
                case 'r':
                    controls.enabled = false;
                case String.fromCharCode(16):
                    if (that.selectedObject) {
                        that.selectedObject.material.color.setHex(0xff00ff);
                        that.selectedObject = null;
                    }
                    that.scaleEnabled = false;
                    mouse.shift=false;
            }
        }

    }

    function keyPressHandler(event) {
    }
    function ScaleHull(hull, scale) {
        /// <param name="hull" type="THREE.Object3D">The Hull to scale</param>
        /// <param name="scale" type="Number">The scale to add</param>  
        if (scale < 0) {
            hull.scale.addScalar(scale);
            scale = Math.max(1.5, hull.scale.x);
            hull.scale = new THREE.Vector3(scale, scale, scale);
        }
        else if (hull.parent.parent.type == "hull") {
            var parentHull = hull.parent.parent;
            if (hull.scale.length() > parentHull.scale.length() / 2 ) {
                ScaleHull(parentHull, scale);
            }
            else {
                hull.scale.addScalar(scale);
            }
        }
        else {
            hull.scale.addScalar(scale);
        }
        //scale=hull.scale.x;
        for (var i = 0; i < hull.children.length; i++) {
            if (hull.children[i].type == "node") {
                hull.children[i].scale = new THREE.Vector3(1 / hull.scale.x, 1 / hull.scale.x, 1 / hull.scale.x);

            }
        }
    }

    function printInfo(text) {
        var str = '';
        for (var index in info_text) {
            if (str != '' && info_text[index] != '') {
                str += " - ";
            }
            str += info_text[index];
        }
        document.getElementById("graph-info").innerHTML = str;
    }

    this.changeMode = function (mode) {
        mode = mode.selectedIndex;
        that.selectedObject = null;
        switch (mode) {
            case Modes.graph:
                that.mode = Modes.graph;
                object_selection.mask = ['node', 'hull'];
                console.log("g");
                break;
            case Modes.text:
                that.mode = Modes.text;
                object_selection.mask = ['node', 'edge'];
                console.log("t");
                break;
            default:

        }

    }
    function handleText() {
        if (that.selectedObject && that.selectedObject.type=="node") {
            if (that.TextEntry.value != that.selectedObject.text) {
                var text = null;
                that.selectedObject.text = that.TextEntry.value;
                if (!that.selectedObject.textDrawObject) {

                    that.selectedObject.textDrawObject = new THREE.Object3D();
                    that.text.push(that.selectedObject.textDrawObject);
                    that.selectedObject.add(that.selectedObject.textDrawObject);

                }
                if (that.TextEntry.value.length > 0) {
                    while (that.selectedObject.textDrawObject.children.length > 0) {
                        that.selectedObject.textDrawObject.remove(that.selectedObject.textDrawObject.children[0]);
                    }
                    text = new THREE.Mesh();
                    that.text.push(text);
                    text.type = "text";
                    text.name = "text";
                    text.material = that.nodeMaterial;
                    var textGeom = new THREE.TextGeometry(that.TextEntry.value, {
                        font: 'helvetiker',
                        weight: 'normal',
                        curveSegments: 2,
                        size: 100, height: 1
                    });
                    textGeom.computeBoundingBox();
                    THREE.GeometryUtils.center(textGeom);
                    //text.position.z -= 100;
                    text.geometry = textGeom;
                    that.text.push(text);
                    text.lookAt(camera.position);
                    that.selectedObject.textDrawObject.add(text);
                }
            }
        }
    }

}
