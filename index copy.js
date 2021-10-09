// (() => {

    var _scene;
    const _baseColumns = 3;
    const _baseRows = 2;
    var _scale = 2;
    var _solved = false;
    var _selectedCube = null;
    var _animating = 0;
    var _imageLoadCounter = 0;
    const _image = new Array(6);
    const _imageSrc = ["./images/falls.jpg", "./images/lake-1.jpg", "./images/lake-2.jpg", "./images/lake-3.jpg", "./images/cheesman.jpg", "./images/dunes.jpg"];
    const _imageWidth = 2046;
    const _imageHeight = 1364;
    
    const _renderCanvas = document.getElementById("renderCanvas");
    const _engine = new BABYLON.Engine(_renderCanvas, true);
    
    var _columns, _rows, _cube, _cubeData, _selector, _textureBlockSize;

    const initialize = () => {
        _columns = _baseColumns * _scale;
        _rows = _baseRows * _scale;
        _cube = new Array(_columns * _rows);
        _cubeData = new Array(_columns * _rows);
        _textureBlockSize = Math.min(Math.floor(_imageWidth / (_columns)), Math.floor(_imageHeight / (_rows)));
    }

    const fixDpi = (p_canvas) => {
        const dpi = window.devicePixelRatio;
        const styles = window.getComputedStyle(p_canvas);
        const style = {
            height() {
                return +styles.height.slice(0, -2);
            },
            width() {
                return +styles.width.slice(0, -2);
            }
        };
        p_canvas.setAttribute('width', (style.width() * dpi).toString());
        p_canvas.setAttribute('height', (style.height() * dpi).toString());
    }

    const loadImage = (p_index) => {
        _image[p_index] = new Image(_imageWidth, _imageHeight);
        _image[p_index].src = _imageSrc[p_index];
        _image[p_index].alt = "Source image for puzzle";
        _image[p_index].onload = () => imageHandler(_image[p_index]);
    }

    // creates the scene and invokes runRenderLoop AFTER all the images are loaded
    const imageHandler = (p_img) => {
        // document.body.appendChild(p_img);
        if (++_imageLoadCounter === 6) {
            _scene = createScene();
            _engine.runRenderLoop(() => {
                fixDpi(_renderCanvas);
                _scene.render();
            });
        }
    }

    const createCubes = (p_scene) => {
        // create the custom UV mapping for the new dynamic texture
        const _faceUV = new Array(6);
        for (let face = 0; face < 6; face++)
            _faceUV[face] = new BABYLON.Vector4(face / 6, 0, (face + 1) / 6, 1);

        const options = {
            width: 1 / _scale,
            height: 1 / _scale,
            depth: 1 / _scale,
            wrap: true,
            faceUV: _faceUV
        };

        _selector = BABYLON.MeshBuilder.CreateBox('selector', {
            width: 1 / _scale + .01,
            height: 1 / _scale + .01,
            depth: 1 / _scale + .01
        }, p_scene);
        _selector.position.x = -500;

        let sMat = new BABYLON.StandardMaterial("sMat", p_scene);
        sMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        sMat.alpha = 0.25;
        _selector.material = sMat;

        for (let row = _rows, boxID = 0; row > 0; row--)
            for (let column = 0; column < _columns; column++, boxID++) {
                // create each block sending in the custom UV mapping
                let mat = new BABYLON.StandardMaterial("mat" + boxID + "("+column+","+row+")", p_scene);
                _cube[boxID] = BABYLON.MeshBuilder.CreateBox('box' + boxID + "("+column+","+row+")", options, p_scene);
                _cube[boxID].material = mat;
                _cube[boxID].position.x = column / _scale - _columns / 2 / _scale + .5 / _scale;
                _cube[boxID].position.y = row / _scale - _rows / 2 / _scale - .5 / _scale;
                _cube[boxID].originalIndex = boxID;
                _cube[boxID].userData = {
                    originalIndex: boxID,
                    worldRotation: {
                        x:0,
                        y:0,
                        z:0
                    }
                };

                // create each dynamic texture from the loaded images foe each specific cube
                let dynTexture = new BABYLON.DynamicTexture("dynamicTexture" + boxID + "("+column+","+row+")", {
                    width: _textureBlockSize * 6,
                    height: _textureBlockSize
                }, p_scene, true);
                let dynTextureCtx = dynTexture.getContext();

                for (let index = 0; index < 6; index++)
                    dynTextureCtx.drawImage(_image[index], _textureBlockSize * column, _textureBlockSize * (_rows - row), _textureBlockSize, _textureBlockSize, _textureBlockSize * index, 0, _textureBlockSize, _textureBlockSize);

                dynTexture.update();
                _cube[boxID].material.diffuseTexture = dynTexture;

                saveVertexData(_cube[boxID]);
            }
    }

    const createScene = () => {
        const scene = new BABYLON.Scene(_engine);
        scene.clearColor = new BABYLON.Color3(0, 0, 0);

        const camera = new BABYLON.ArcRotateCamera("arcCamera1", 0, 0, 3, BABYLON.Vector3.Zero(), scene);
        camera.lowerRadiusLimit = camera.upperRadiusLimit = camera.radius;
        camera.setPosition(new BABYLON.Vector3(0, 0, -3));
        camera.target = new BABYLON.Vector3.Zero;
        scene.activeCameras.push(camera);

        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 1), scene);
        light.intensity = 0.7;

        const pl = new BABYLON.PointLight("pl", BABYLON.Vector3.Zero(), scene);
        pl.intensity = 0.5;
        pl.parent = camera;

        _animating++;
        createCubes(scene);

        var id = setTimeout(() => {
            // console.log("swapping cubes");
            swapCubesHorizontal(0, 1);
            swapCubesVertical(2, 8);
        }, 1000);

        var id2 = setTimeout(() => {
            // console.log("swapping cubes");
            swapCubesHorizontal(0, 1);
            swapCubesVertical(2, 8);
        }, 3500);

        // var id3 = setTimeout(() => {
        //     _animating--;
        // }, 6000);

        var id4;
        // _animating++;
        setTimeout(()=>{
            id4 = setInterval(() => {
                // console.log("randomizing cubes");
                randomizeCubeRotations(scene);
            }, 500); 
        }, 6000);

        // id4 = setInterval(() => {
        //     // console.log("randomizing cubes");
        //     randomizeCubeRotations(scene);
        // }, 500);
        
        setTimeout(() => {
            // console.log("clearing interval");
            clearInterval(id4);
            _animating--;
        // }, 11100);
    }, 9600);
    // }, 11100*20);

        scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    // console.log("POINTER DOWN");
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    // console.log("POINTER UP");
                    break;
                case BABYLON.PointerEventTypes.POINTERMOVE:
                    // console.log("POINTER MOVE");
                    break;
                case BABYLON.PointerEventTypes.POINTERWHEEL:
                    // console.log("POINTER WHEEL");
                    break;
                case BABYLON.PointerEventTypes.POINTERPICK:
                    // console.log("POINTER PICK");
                    break;
                case BABYLON.PointerEventTypes.POINTERTAP:
                    // console.log("POINTER TAP");
                    clickEvent();
                    break;
                case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
                    // console.log("POINTER DOUBLE-TAP");
                    break;
            }
        });

        scene.onKeyboardObservable.add((kbInfo) => {
            if (_selectedCube === null || _animating > 0) return;
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    // console.log("KEY DOWN: ", kbInfo.event.key);
                    switch (kbInfo.event.key) {
                        case 'ArrowDown':
                            // rotateCubeDown(_selectedCube);
                            rotateCube(_selectedCube,"rotation.x", -1);
                            break;
                        case 'ArrowUp':
                            // rotateCubeUp(_selectedCube);
                            rotateCube(_selectedCube,"rotation.x", 1);
                            break;
                        case 'ArrowRight':
                            // rotateCubeRight(_selectedCube);
                            rotateCube(_selectedCube,"rotation.y", -1);
                            break;
                        case 'ArrowLeft':
                            // rotateCubeLeft(_selectedCube);
                            rotateCube(_selectedCube,"rotation.y", 1);
                            break;
                        default:
                            break;
                    }
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    // console.log("KEY UP: ", kbInfo.event.keyCode);
                    break;
            }
        });

        return scene;
    }

    const clickEvent = () => {
        if (_animating > 0) return;

        const dpi = window.devicePixelRatio;
        var pickResult = _scene.pick(_scene.pointerX * dpi, _scene.pointerY * dpi);

        if (pickResult.hit === true) {
            // console.log(pickResult);

            if (pickResult.pickedMesh.name === 'selector') {
                _selector.position.x = -500;
                _selectedCube = null;
            } else {
                _selectedCube = pickResult.pickedMesh;

                _selector.rotation.x = pickResult.pickedMesh.rotation.x;
                _selector.rotation.y = pickResult.pickedMesh.rotation.y;
                _selector.rotation.z = pickResult.pickedMesh.rotation.z;
                _selector.position.x = pickResult.pickedMesh.position.x;
                _selector.position.y = pickResult.pickedMesh.position.y;
                _selector.position.z = pickResult.pickedMesh.position.z;
            }
        } else {
            _selector.position.x = -500;
            _selector.rotation = new BABYLON.Vector3.Zero();
            _selectedCube = null;
        }
    }

    const checkCompletion = () => {
        let result = true;
        let rx = Math.round(_cube[0].rotation.x);
        let ry = Math.round(_cube[0].rotation.y);
        let rz = Math.round(_cube[0].rotation.z);

        _cube.forEach( (c,i) => {
            if (Math.round(c.rotation.x) != rx || Math.round(c.rotation.y) != ry || Math.round(c.rotation.z) != rz || c.originalIndex != i)
                result = false;
        });
        if (result) console.log("!!! Completed !!!");
        return result;
    }

    const swapCubesHorizontal = (index_1, index_2) => {
        // console.log("In swapCubes");
        // console.log(_cube[index_1].position);
        // console.log(_cube[index_2].position);

        let startz1 = _cube[index_1].position.z
        let endz1 = _cube[index_1].position.z-1/_scale/2;        
        let startz2 = _cube[index_2].position.z
        let endz2 = _cube[index_2].position.z+1/_scale/2;

        let startx1 = _cube[index_1].position.x
        let endx1 = _cube[index_2].position.x;        
        let startx2 = _cube[index_2].position.x
        let endx2 = _cube[index_1].position.x; 

        BABYLON.Animation.CreateAndStartAnimation("moveUp", _cube[index_1], "position.z", 240, 120, startz1, endz1, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
            BABYLON.Animation.CreateAndStartAnimation("moveOver", _cube[index_1], "position.x", 240, 120, startx1, endx1, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
                BABYLON.Animation.CreateAndStartAnimation("moveDown", _cube[index_1], "position.z", 240, 120, endz1, startz1, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
                });
            });
        });

        BABYLON.Animation.CreateAndStartAnimation("moveDown", _cube[index_2], "position.z", 240, 120, startz2, endz2, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
            BABYLON.Animation.CreateAndStartAnimation("moveOver", _cube[index_2], "position.x", 240, 120, startx2, endx2, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
                BABYLON.Animation.CreateAndStartAnimation("moveUp", _cube[index_2], "position.z", 240, 120, endz2, startz2, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
                    let tmp1 = _cube[index_1];
                    let tmp2 = _cube[index_2];
                    _cube[index_1] = tmp2;
                    _cube[index_2] = tmp1;
                    _solved = checkCompletion();
                });
            });
        });
    }

    const swapCubesVertical = (index_1, index_2) => {
        // console.log("In swapCubes");
        // console.log(_cube[index_1].position);
        // console.log(_cube[index_2].position);

        let startz1 = _cube[index_1].position.z
        let endz1 = _cube[index_1].position.z-1/_scale/2;        
        let startz2 = _cube[index_2].position.z
        let endz2 = _cube[index_2].position.z+1/_scale/2;

        let starty1 = _cube[index_1].position.y
        let endy1 = _cube[index_2].position.y;        
        let starty2 = _cube[index_2].position.y;
        let endy2 = _cube[index_1].position.y; 

        BABYLON.Animation.CreateAndStartAnimation("moveUp", _cube[index_1], "position.z", 240, 120, startz1, endz1, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
            BABYLON.Animation.CreateAndStartAnimation("moveOver", _cube[index_1], "position.y", 240, 120, starty1, endy1, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
                BABYLON.Animation.CreateAndStartAnimation("moveDown", _cube[index_1], "position.z", 240, 120, endz1, startz1, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
                });
            });
        });

        BABYLON.Animation.CreateAndStartAnimation("moveDown", _cube[index_2], "position.z", 240, 120, startz2, endz2, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
            BABYLON.Animation.CreateAndStartAnimation("moveOver", _cube[index_2], "position.y", 240, 120, starty2, endy2, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
                BABYLON.Animation.CreateAndStartAnimation("moveDown", _cube[index_2], "position.z", 240, 120, endz2, startz2, 0, BABYLON.EasingFunction.easeInOutCubic, () => { 
                    let tmp1 = _cube[index_1];
                    let tmp2 = _cube[index_2];
                    _cube[index_1] = tmp2;
                    _cube[index_2] = tmp1;
                    _solved = checkCompletion();
                });
            });
        });
    }

    const randomizeCubeRotations = (p_scene) => {
        _cube.forEach(c => {
            let randomDir = Math.floor(Math.random() * 4);
            switch (randomDir) {
                case 0:
                    // rotateCubeDown(c);
                    rotateCube(c,"rotation.x", -1);
                    break;
                case 1:
                    // rotateCubeLeft(c);
                    rotateCube(c,"rotation.y", 1);
                    break;
                case 2:
                    // rotateCubeRight(c);
                    rotateCube(c,"rotation.y", -1);
                    break;
                case 3:
                    // rotateCubeUp(c);
                    rotateCube(c,"rotation.x", 1);
                    break;
                default:
                    break;
            }
        });
    }

    const resetCube = (p_rcube, p_startPos) => {
        p_rcube.position = new BABYLON.Vector3.Zero();
        p_rcube.bakeCurrentTransformIntoVertices();
        p_rcube.position = p_startPos;
        p_rcube.rotation = new BABYLON.Vector3.Zero();
        restoreVertexData(p_rcube);
    }

    const rotateCube = (p_cube, p_axis, p_dir) => { // right/down is -,  "rotation.x", "rotation.y"
        _animating++;
        let startPos = p_cube.position.clone();
        const start = p_axis === "rotation.x" ?  p_cube.rotation.x : p_cube.rotation.y;
        const end = start + p_dir*Math.PI / 2;
        BABYLON.Animation.CreateAndStartAnimation("rotateRight", p_cube, p_axis, 240, 60, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
            resetCube(p_cube, startPos);
            _animating--;
            _solved = checkCompletion();
        });
        BABYLON.Animation.CreateAndStartAnimation("rotateRight", _selector, p_axis, 240, 60, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => _selector.rotation = new BABYLON.Vector3.Zero());
    }

/*
    const rotateCubeUp = (p_cube) => {
        _animating++;
        let startPos = p_cube.position.clone();
        // console.log("Rotate Down");
        const start = p_cube.rotation.x;
        const end = start + Math.PI / 2;
        BABYLON.Animation.CreateAndStartAnimation("rotateUp", p_cube, "rotation.x", 240, 60, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
            resetCube(p_cube, startPos);
            _animating--;
            _solved = checkCompletion();
        });
        BABYLON.Animation.CreateAndStartAnimation("rotateUp", _selector, "rotation.x", 240, 60, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => _selector.rotation = new BABYLON.Vector3.Zero());
    }

    const rotateCubeDown = (p_cube) => {
        _animating++;
        let startPos = p_cube.position.clone();
        // console.log("Rotate Down");
        const start = p_cube.rotation.x;
        const end = start - Math.PI / 2;
        BABYLON.Animation.CreateAndStartAnimation("rotateDown", p_cube, "rotation.x", 60, 15, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
            resetCube(p_cube, startPos);
            _animating--;
            _solved = checkCompletion();
        });
        BABYLON.Animation.CreateAndStartAnimation("rotateDown", _selector, "rotation.x", 60, 15, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => _selector.rotation = new BABYLON.Vector3.Zero());
    }

    const rotateCubeLeft = (p_cube) => {
        _animating++;
        let startPos = p_cube.position.clone();
        // console.log("Rotate Left");
        const start = p_cube.rotation.y;
        const end = start + Math.PI / 2;
        BABYLON.Animation.CreateAndStartAnimation("rotateLeft", p_cube, "rotation.y", 240, 60, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
            resetCube(p_cube, startPos);
            _animating--;
            _solved = checkCompletion();
        });
        BABYLON.Animation.CreateAndStartAnimation("rotateLeft", _selector, "rotation.y", 240, 60, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => _selector.rotation = new BABYLON.Vector3.Zero());
    }

    const rotateCubeRight = (p_cube) => {
        _animating++;
        let startPos = p_cube.position.clone();
        // console.log("Rotate Right");
        const start = p_cube.rotation.y;
        const end = start - Math.PI / 2;
        BABYLON.Animation.CreateAndStartAnimation("rotateRight", p_cube, "rotation.y", 240, 60, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
            resetCube(p_cube, startPos);
            _animating--;
            _solved = checkCompletion();
        });
        BABYLON.Animation.CreateAndStartAnimation("rotateRight", _selector, "rotation.y", 240, 60, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => _selector.rotation = new BABYLON.Vector3.Zero());
    }
*/

    const saveVertexData = (p_mesh) => {
        let col = Math.round(p_mesh.position.x);
        let row = Math.round(p_mesh.position.y);
        let index = (_columns - 1) * col + (_rows - 1) * row;

        let dataNode = {
            positions: p_mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind),
            normals: p_mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind),
            colors: p_mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind),
            uvs: p_mesh.getVerticesData(BABYLON.VertexBuffer.UVKind)
        }
        _cubeData[index] = dataNode;
    }

    const restoreVertexData = (p_mesh) => {
        let col = Math.round(p_mesh.position.x);
        let row = Math.round(p_mesh.position.y);
        let index = (_columns - 1) * col + (_rows - 1) * row;

        p_mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, _cubeData[index].positions);
        p_mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, _cubeData[index].normals);
        p_mesh.updateVerticesData(BABYLON.VertexBuffer.ColorKind, _cubeData[index].colors);
        p_mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, _cubeData[index].uvs);
    }

    window.addEventListener("resize", () => {
        _engine.resize();
        // console.log("resizing");
        let windowW, windowH;
        windowW = window.innerWidth;
        windowH = window.innerHeight;
        // console.log("listener : " + windowW + " , " + windowH);

        // if (windowH > windowW) {
        //     _camera.fovMode = BABYLON.Camera.FOVMODE_VERTICAL_FIXED;
        // } else {
        //     _camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;
        // }

        fixDpi(_renderCanvas);
    });

    initialize();

    for (let imageIndex = 0; imageIndex < 6; imageIndex++)
        loadImage(imageIndex);
// })();
