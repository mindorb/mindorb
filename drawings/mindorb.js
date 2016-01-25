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
    var options = options || {};

    this.show_stats = options.showStats || false;
    this.show_info = options.showInfo || false;
    this.show_labels = options.showLabels || false;
    this.selection = options.selection || false;

    var camera, controls, scene, renderer, interaction, geometry, object_selection;
    var stats;
    var info_text = {};
    var graph = new Graph({ limit: options.limit });
    var selectedHull = null;
    
    var geometries = [];
    var nodes = [];
    var that = this;
    init();
    createGraph();
    animate();

    function init() {
        // Three.js initialization
        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000000);
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


        // Create node selection, if set
        if (that.selection) {
            object_selection = new THREE.ObjectSelection({
                domElement: renderer.domElement,
                selected: function (obj) {
                    // display info
                    if (obj != null) {
                        info_text.select = "Object " + obj.id;
                    } else {
                        delete info_text.select;
                    }
                },
                clicked: function (obj) {
                    if (obj != null) {
                        if (obj.type == "node") {
                            graph.getNode(obj.id).haveAHull = true;
                        }
                        else if(obj.type=="hull"){
                            //TODO create new Node at intersection
                        }
                    }
                    
                },
                mouseDown: function (obj, event) {
                    /// <param name="event" type="MouseEvent">clickEvent</param>
                    if (obj != null && obj.type == "hull") {
                        if (event.button == 2) { //right mouse button to start scaling
                            selectedHull = obj;
                        }   
                    }
                },
                mouseUp: function (obj, event) {
                    console.log(event.button);
                    if (event.button == 2) {
                        selectedHull = null;
                    }
                }


            });
        }
        document.addEventListener("mousemove",scaleHandler);
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


    /**
     *  Creates a graph with random nodes and edges.
     *  Number of nodes and edges can be set with
     *  numNodes and numEdges.
     */
    function createGraph() {
        var node = new Node(0);
        node.position.x = node.position.y = node.position.z= 0;
        node.data.title = "This is node " + node.id;
        graph.addNode(node);
        drawNode(node);
        
        nodes.push(node);
    }


    /**
     *  Create a node object and add it to the scene.
     */
    function drawNode(node) {
        var draw_object = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x0000ff, opacity: 0.5 }));
        if (that.show_labels) {
            if (node.data.title != undefined) {
                var label_object = new THREE.Label(node.data.title);
            } else {
                var label_object = new THREE.Label(node.id);
            }
            node.data.label_object = label_object;
            scene.add(node.data.label_object);
        }
       
        draw_object.id = node.id;
        draw_object.type = "node";

        var hullGeometry = new THREE.SphereGeometry(100, 20, 20, 0, 2*Math.PI, 0, 2 * Math.PI);
        var hull = new THREE.Mesh(hullGeometry, new THREE.MeshBasicMaterial({ color: 0xff00ff, opacity: 0.1, transparent:true }));
        hull.type = "hull";
        hull.position = node.position;
        node.data.hullDrawObject = hull;
        node.data.draw_object = draw_object;
        node.position = draw_object.position;
        scene.add(node.data.draw_object);
    }


    /**
     *  Create an edge object (line) and add it to the scene.
     */
    function drawEdge(source, target) {
        material = new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 1, linewidth: 5 });

        var tmp_geo = new THREE.Geometry();
        tmp_geo.vertices.push(source.data.draw_object.position);
        tmp_geo.vertices.push(target.data.draw_object.position);

        line = new THREE.Line(tmp_geo, material, THREE.LinePieces);
        line.scale.x = line.scale.y = line.scale.z = 1;
        line.originalScale = 1;

        geometries.push(tmp_geo);

        scene.add(line);
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
        // Generate layout if not finished

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].haveAHull) {
                scene.add(nodes[i].data.hullDrawObject);
            }
            else {
                scene.remove(nodes[i].hullDrawObject);
            }
        }
        // Update position of lines (edges)
        for (var i = 0; i < geometries.length; i++) {
            geometries[i].verticesNeedUpdate = true;
        }

        // render selection
        if (that.selection) {
            object_selection.render(scene, camera);
        }

        // update stats
        if (that.show_stats) {
            stats.update();
        }
        // render scene
        renderer.render(scene, camera);
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

    // Generate random number
    function randomFromTo(from, to) {
        return Math.floor(Math.random() * (to - from + 1) + from);
    }

    // Stop layout calculation
    function scaleHandler(event) {
        if (selectedHull && !controls.enabled) { // to make sure the camera controls are not enabled when scaling the hull
            diff = event.movementX*0.01;
            selectedHull.scale.add(new THREE.Vector3(diff,diff,diff));
        }
    }
}
