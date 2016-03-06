/// <reference path="../webgl-frameworks/Three.js" />
/// <reference path="../Graph.js" />
/// <reference path="../utils/TrackballControls.js" />
/// <reference path="../utils/ObjectSelection.js" />
/**
  @author AhmadAboBakr

  WIP

 */

var Drawing = Drawing || {};
Drawing.Minorb = function (options) {
    /// <summary>Create the MindOrb.</summary>
    /// <param name="options" type="Object">An object contains  the initialization data for the graph</param>
    /// <field name='showStats' type='Boolean'>Whether or not to show stats</field>
    /// <field name='selectedHull' type='THREE.Object3D'>The currently selected hull</field>
    /// <field name='limit' type='Number'>The maximum number of allowed nodes</field>
    /// <field name='edgeMaterial' type='THREE.Material'>The material used to draw edges</field>
    /// <field name='nodeMaterial' type='THREE.Material'>The material used to draw nodes</field>
    /// <field name='hullMaterial' type='THREE.Material'>The material used to draw hulls</field>
    
    var options = options || {};
    
    this.show_stats = options.showStats || false;
    this.show_info = options.showInfo || false;
    this.show_labels = options.showLabels || false;
    this.limit = options.limit || 1000;
    this.edgeMaterial = options.edgeMaterial || new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 1, linewidth: 50 });
    this.nodeMaterial = options.nodeMaterial || new THREE.MeshBasicMaterial({ color: 0x0000ff, opacity: 0.5 });
    this.hullMaterial = options.hullMaterial || new THREE.MeshBasicMaterial({ color: 0xff00ff, opacity: 0.1, transparent: true })
    var camera, controls, scene, renderer, interaction, geometry, object_selection;
    var stats;
    var id = 1;
    var info_text = {};
    var graph = new Graph({ limit: this.limit });
    var selectedHull = null;    
    var edges = [];
    var hulls;
    var that = this;
    init();
    createGraph();
    animate();

    function init() {
        /// <summary>Initialize the MindOrb.</summary>

        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000000);
        //        camera = new THREE.OrthographicCamera(0, window.innerWidth ,0, window.innerHeight, 1, 1000000);
        camera.position.z = 5000;
        var nodes = [];
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

        // Create node selection, if set
        object_selection = new THREE.ObjectSelection({
            domElement: renderer.domElement,
            selected: function (obj) {
                // display info
                if (obj != null) {
                    if (obj.type == "node") {
                        info_text.select = "Object " + obj.id;
                    }
                } else {
                    delete info_text.select;
                }
            },
            clicked: function (obj) {
                if (obj != null && !controls.enabled) {
                    if (obj.type == "node") {
                        //graph.nodes[obj.nodeID].haveAHull = true;
                        graph.nodes[obj.nodeID].data.drawObject.add(graph.nodes[obj.nodeID].data.hullDrawObject);
                    }
                    else if (obj.type == "hull") {
                        parent = graph.getNode(obj.nodeID);
                        node = new Node(id++);
                        node.position = obj.intersectionPoint.clone();
                        drawNode(node, obj);
                        //node.data.drawObject.scale = new THREE.Vector3(1 / obj.scale.x, 1 / 1 / obj.scale.y, 1 / 1 / obj.scale.z);

                        graph.addNode(node);
                        edge = graph.addEdge(parent, node);
                        drawEdge(edge);

                    }
                }

            },
            mouseDown: function (obj, event) {
                /// <param name="event" type="MouseEvent">clickEvent</param>
                if (obj != null && obj.type == "hull") {
                        selectedHull = obj;
                }
            },
            mouseUp: function (obj, event) {
                if (event.button == 2) {
                    selectedHull = null;

                }
            }
        });
        document.addEventListener("mousemove", mouseMove);
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
    }


    
    function createGraph() {
        /// <summary>Create a graph with an initial node at the center of the world.</summary>

        var node = new Node(0);
        node.position.x = node.position.y = node.position.z = 0;
        node.data.title = "This is node " + node.id;
        graph.addNode(node);
        drawNode(node);
        selectableContainer = node.data.drawObject;
        //nodes.push(node);
    }


    function drawNode(node, parentObject) {
        /// <summary>Create a node object and add it to the scene.</summary>
        /// <param name="node" type="Node">The node to Insert to the scen.</param>
        /// <param name="parentObject" type="THREE.Object3D">The parent in the scene hierarchy </param>
        
        parentObject = parentObject || scene;
        var drawObject = new THREE.Mesh(geometry, that.nodeMaterial);
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
        var hull = new THREE.Mesh(hullGeometry, that.hullMaterial);
        hull.type = "hull";
        hull.position = new THREE.Vector3(0, 0, 0);
        hull.nodeID = node.id;
        node.data.hullDrawObject = hull;
        node.data.drawObject = drawObject;
        drawObject.position = new THREE.Vector3(node.position.x, node.position.y, node.position.z);
        //        drawObject.position.sub(parentObject.position);
        var position = new THREE.Vector3();
        var quaternion = new THREE.Quaternion();
        var scale = new THREE.Vector3();
        parentObject.matrixWorld.decompose(position, quaternion, scale);
        drawObject.position = parentObject.worldToLocal(drawObject.position);
        drawObject.scale = new THREE.Vector3(1 / scale.x, 1 / scale.y, 1 / scale.z);
        parentObject.add(node.data.drawObject);
        //

    }



    function drawEdge(edge) {
        /// <summary>draw an edge between two Nodes</summary>
        /// <param name="edge" type="Edge">The edge between the two nodes</param>
        
        source = new THREE.Vector3(0,0,0);edge.source.data.drawObject.position.clone();
        target = edge.target.data.drawObject.position.clone();
        var controlPoint1 = source.clone();
        var controlPoint2 = target.clone();
        deltax = Math.abs(source.x - target.x);
        deltay = Math.abs(source.y - target.y);
        deltaz = Math.abs(source.z - target.z);
        if (deltax > deltay && deltax > deltaz) {
            controlPoint1.x = target.x;
            controlPoint2.x = source.x;
        }
        if (deltaz > deltay && deltaz > deltay) {
            controlPoint1.z = target.z;
            controlPoint2.z = source.z;
        }
        if (deltay > deltaz && deltay > deltax) {
            controlPoint1.z = target.z;
            controlPoint2.z = source.z;
        }
        var direction = target.sub(source);
        var distance = direction.length();
        var curve = new THREE.CubicBezierCurve3(source, controlPoint1, controlPoint2, target);
        var edgeGeometry = new THREE.Geometry();
        edgeGeometry.vertices = curve.getPoints(20);

        var cylinderGeometry = new THREE.CylinderGeometry(.1, 10, 20, 3, 20, false);
        for (var i = 0; i < cylinderGeometry.vertices.length; i++) {
            var index = cylinderGeometry.vertices[i].y + 10;
            if (index == 0) {
                cylinderGeometry.vertices[i].y=source.y;
            }
            if (index == 20) {
                cylinderGeometry.vertices[i] = target;
            }
            else {
                cylinderGeometry.vertices[i].add(edgeGeometry.vertices[index]);
            }
        }
        cylinder = new THREE.Mesh(cylinderGeometry, that.edgeMaterial);
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
        object_selection.render(selectableContainer, camera);
        

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

    /**
     *  Prints info from the attribute info_text.
     */
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


    function mouseMove(event) {
        if (selectedHull && !controls.enabled && that.scale) { // to make sure the camera controls are not enabled when scaling the hull
            diff = event.movementX * 0.01;
            ScaleHull(selectedHull, diff);
        }
    }
    function keyDownHandler(event) {

        key = String.fromCharCode(event.keyCode).toLowerCase()[0];
        switch (key) {
            case 'z':
            case 'd':
            case 'r':
                controls.enabled = true;
            case 's':
                that.scale = true;
        }

    }
    function ScaleHull(hull,scale) {
        /// <param name="hull" type="THREE.Object3D">The Hull to scale</param>
        /// <param name="scale" type="Number">The scale to add</param>  
        if (scale < 0) {
            hull.scale.addScalar(scale);
            scale = Math.max(1, hull.scale.x);
            hull.scale = new THREE.Vector3(scale, scale, scale);            
        }
        else if ( hull.parent.parent.type == "hull") {
            parentHull = hull.parent.parent;
            if (hull.scale.length() > parentHull.scale.length() / 3) {
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
    function keyUpHandler(event) {
        key = String.fromCharCode(event.keyCode).toLowerCase()[0];
        switch (key) {
            case 'z':
            case 'd':
            case 'r':
                controls.enabled = false;
            case 's':
                that.scale = false;
        }

    } 
}
