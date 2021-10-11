// (() => {

var _scene;
const _baseColumns = 3;
const _baseRows = 2;
var _scale = 1;
var _solved = false;

var _solvingFor = 0;

/*
const _solvedKey = [
    "0,0,1,-1,0,0,0,1,0",
    "0,0,-1,1,0,0,0,1,0",
    "-1,0,0,0,0,-1,0,1,0",
    "1,0,0,0,0,1,0,1,0",
    "0,-1,0,1,0,0,0,0,-1",
    "0,1,0,1,0,0,0,0,1"
];

const _faceShowingKey = [
    "0,0,1",
    "0,0,-1",
    "-1,0,0",
    "1,0,0",
    "0,-1,0",
    "0,1,0"
];
*/

// back   "./images/falls.jpg",         068      
// front  "./images/sprague_lake.jpg",  248
// right  "./images/dream_lake.jpg",   408
// left   "./images/bear_lake.jpg",   628
// top    "./images/cheesman.jpg",    840        
// bottom "./images/dunes.jpg"];      1042   

const solvedFRUIndices = [
    "068",
    "248",
    "408",
    "628",
    "840",
    "1042"
];

var _selectedCube = null;
var _animating = 0;
var _imageLoadCounter = 0;
const _image = new Array(6);
const _imageSrc = ["./images/falls.jpg", "./images/sprague_lake.jpg", "./images/dream_lake.jpg", "./images/bear_lake.jpg", "./images/cheesman.jpg", "./images/dunes.jpg"];
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

    // options for cube creation
    const options = {
        width: 1 / _scale,
        height: 1 / _scale,
        depth: 1 / _scale,
        wrap: true,
        faceUV: _faceUV
    };

    // create selector object
    _selector = BABYLON.MeshBuilder.CreateBox('selector', {
        width: 1 / _scale + .01,
        height: 1 / _scale + .01,
        depth: 1 / _scale + .01
    }, p_scene);
    _selector.position.x = -500;

    // mat for selector
    let sMat = new BABYLON.StandardMaterial("sMat", p_scene);
    sMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    sMat.alpha = 0.25;
    _selector.material = sMat;

    // create cubes
    for (let row = _rows, boxID = 0; row > 0; row--)
        for (let column = 0; column < _columns; column++, boxID++) {
            // create each cube sending in the custom UV mapping in options
            let mat = new BABYLON.StandardMaterial("mat" + boxID + "(" + column + "," + row + ")", p_scene);
            _cube[boxID] = BABYLON.MeshBuilder.CreateBox('box' + boxID + "(" + column + "," + row + ")", options, p_scene);
            _cube[boxID].material = mat;
            _cube[boxID].position.x = column / _scale - _columns / 2 / _scale + .5 / _scale;
            _cube[boxID].position.y = row / _scale - _rows / 2 / _scale - .5 / _scale;
            _cube[boxID].originalIndex = boxID;
            _cube[boxID].userData = {
                originalIndex: boxID,
            };

            _cube[boxID].rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);

            // create each dynamic texture from the loaded images for each specific cube
            let dynTexture = new BABYLON.DynamicTexture("dynamicTexture" + boxID + "(" + column + "," + row + ")", {
                width: _textureBlockSize * 6,
                height: _textureBlockSize
            }, p_scene, true);
            let dynTextureCtx = dynTexture.getContext();

            for (let index = 0; index < 6; index++)
                dynTextureCtx.drawImage(_image[index], _textureBlockSize * column, _textureBlockSize * (_rows - row), _textureBlockSize, _textureBlockSize, _textureBlockSize * index, 0, _textureBlockSize, _textureBlockSize);

            dynTexture.update();
            _cube[boxID].material.diffuseTexture = dynTexture;
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

    createCubes(scene);
    /*
    _animating++;
    var id = setTimeout(() => {
        swapCubesHorizontal(0, 1);
        swapCubesVertical(2, 8);
    }, 1000);

    var id2 = setTimeout(() => {
        swapCubesHorizontal(0, 1);
        swapCubesVertical(2, 8);
    }, 3500);

    var id4;
    setTimeout(() => {
        id4 = setInterval(() => {
            randomizeCubeRotations(scene);
        }, 500);
    }, 6000);

    setTimeout(() => {
        clearInterval(id4);
        _animating--;
    }, 9600);
*/
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
                        rotateCubeDownQ(_selectedCube);
                        break;
                    case 'ArrowUp':
                        rotateCubeUpQ(_selectedCube);
                        break;
                    case 'ArrowRight':
                        rotateCubeRightQ(_selectedCube);
                        break;
                    case 'ArrowLeft':
                        rotateCubeLeftQ(_selectedCube);
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

// see if a click hits a cube or the selector
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
/*
const showFaces = (p_cube) => {
    let facingNormal = (Math.round(_cube[0].getFacetNormal(2)._x) + 0) + "," + (Math.round(_cube[0].getFacetNormal(2)._y) + 0) + "," + (Math.round(_cube[0].getFacetNormal(2)._z) + 0);
    let rightNormal = (Math.round(_cube[0].getFacetNormal(4)._x) + 0) + "," + (Math.round(_cube[0].getFacetNormal(4)._y) + 0) + "," + (Math.round(_cube[0].getFacetNormal(4)._z) + 0);
    let topNormal = (Math.round(_cube[0].getFacetNormal(8)._x) + 0) + "," + (Math.round(_cube[0].getFacetNormal(8)._y) + 0) + "," + (Math.round(_cube[0].getFacetNormal(8)._z) + 0);

    console.log('facing normal: ' + facingNormal);
    console.log('right normal: ' + rightNormal);
    console.log('top normal: ' + topNormal);

    console.log(facingNormal + "," + rightNormal + "," + topNormal);
}

const getSolvedCalc = () => {
    let facingNormal = (Math.round(_cube[0].getFacetNormal(2)._x) + 0) + "," + (Math.round(_cube[0].getFacetNormal(2)._y) + 0) + "," + (Math.round(_cube[0].getFacetNormal(2)._z) + 0);
    let rightNormal = (Math.round(_cube[0].getFacetNormal(4)._x) + 0) + "," + (Math.round(_cube[0].getFacetNormal(4)._y) + 0) + "," + (Math.round(_cube[0].getFacetNormal(4)._z) + 0);
    let topNormal = (Math.round(_cube[0].getFacetNormal(8)._x) + 0) + "," + (Math.round(_cube[0].getFacetNormal(8)._y) + 0) + "," + (Math.round(_cube[0].getFacetNormal(8)._z) + 0);

    return facingNormal + "," + rightNormal + "," + topNormal;
}

const getFacingNormal = (p_cube) => {
    let facingNormal = (Math.round(p_cube.getFacetNormal(2)._x) + 0) + "," + (Math.round(p_cube.getFacetNormal(2)._y) + 0) + "," + (Math.round(p_cube.getFacetNormal(2)._z) + 0);
    console.log('facingNormal: ' + facingNormal);
    return facingNormal;
}

const getFaceShowing = (p_cube) => {
    const facingNormal = getFacingNormal(p_cube);
    console.log("searching for " + facingNormal);
    const faceIndex = _faceShowingKey.findIndex( e => e === facingNormal );

    console.log("facingIndex: " + faceIndex);
    console.log("showing image " + _imageSrc[faceIndex]);
    return faceIndex;
}
*/

/*
const checkCompletion = () => {
    let result = true;

    let f1x = (Math.round(_cube[0].getFacetNormal(2)._x) + 0);
    let f1y = (Math.round(_cube[0].getFacetNormal(2)._y) + 0);
    let f1z = (Math.round(_cube[0].getFacetNormal(2)._z) + 0);

    let f2x = (Math.round(_cube[0].getFacetNormal(4)._x) + 0);
    let f2y = (Math.round(_cube[0].getFacetNormal(4)._y) + 0);
    let f2z = (Math.round(_cube[0].getFacetNormal(4)._z) + 0);

    let f4x = (Math.round(_cube[0].getFacetNormal(8)._x) + 0);
    let f4y = (Math.round(_cube[0].getFacetNormal(8)._y) + 0);
    let f4z = (Math.round(_cube[0].getFacetNormal(8)._z) + 0);

    // order and facing check
    _cube.forEach((c, i) => {
        if ((Math.round(c.getFacetNormal(2)._x) + 0) != f1x ||
            (Math.round(c.getFacetNormal(2)._y) + 0) != f1y ||
            (Math.round(c.getFacetNormal(2)._z) + 0) != f1z ||

            (Math.round(c.getFacetNormal(4)._x) + 0) != f2x ||
            (Math.round(c.getFacetNormal(4)._y) + 0) != f2y ||
            (Math.round(c.getFacetNormal(4)._z) + 0) != f2z ||

            (Math.round(c.getFacetNormal(8)._x) + 0) != f4x ||
            (Math.round(c.getFacetNormal(8)._y) + 0) != f4y ||
            (Math.round(c.getFacetNormal(8)._z) + 0) != f4z ||

            c.userData.originalIndex != i) {
            result = false;
        }
    });

    // orientation check
    if (result && _solvedKey[_solvingFor] != getSolvedCalc()) {
        result = false;
    }

    if (result) {
        console.log("-------------------------------");
        console.log("!!! Completed !!!");
        // getFacing(_cube[0]);
        showFaces(_cube[0]);
    }

    return result;
}
*/

const getFaceNormal = (p_cube, faceIndex) => {
    let fnx = (Math.round(p_cube.getFacetNormal(faceIndex)._x) + 0);
    let fny = (Math.round(p_cube.getFacetNormal(faceIndex)._y) + 0);
    let fnz = (Math.round(p_cube.getFacetNormal(faceIndex)._z) + 0);

    return "("+fnx+","+fny+","+fnz+")";
}

const getFaceIndexMatchingNormal = (p_cube, matchNormal) => {
    for (let index = 0; index < 11; index+=2) {
        if (getFaceNormal(p_cube,index) === matchNormal) {
            // console.log("face " + index + " matches " + matchNormal);
            return index;        
        }
    }
}

const showAllNormals = (p_cube) => {

    // console.log("Inside showAllNormals");

    let f0x = (Math.round(p_cube.getFacetNormal(0)._x) + 0);
    let f0y = (Math.round(p_cube.getFacetNormal(0)._y) + 0);
    let f0z = (Math.round(p_cube.getFacetNormal(0)._z) + 0);

    let f1x = (Math.round(p_cube.getFacetNormal(1)._x) + 0);
    let f1y = (Math.round(p_cube.getFacetNormal(1)._y) + 0);
    let f1z = (Math.round(p_cube.getFacetNormal(1)._z) + 0);

    let f2x = (Math.round(p_cube.getFacetNormal(2)._x) + 0);
    let f2y = (Math.round(p_cube.getFacetNormal(2)._y) + 0);
    let f2z = (Math.round(p_cube.getFacetNormal(2)._z) + 0);

    let f3x = (Math.round(p_cube.getFacetNormal(3)._x) + 0);
    let f3y = (Math.round(p_cube.getFacetNormal(3)._y) + 0);
    let f3z = (Math.round(p_cube.getFacetNormal(3)._z) + 0);

    let f4x = (Math.round(p_cube.getFacetNormal(4)._x) + 0);
    let f4y = (Math.round(p_cube.getFacetNormal(4)._y) + 0);
    let f4z = (Math.round(p_cube.getFacetNormal(4)._z) + 0);

    let f5x = (Math.round(p_cube.getFacetNormal(5)._x) + 0);
    let f5y = (Math.round(p_cube.getFacetNormal(5)._y) + 0);
    let f5z = (Math.round(p_cube.getFacetNormal(5)._z) + 0);

    let f6x = (Math.round(p_cube.getFacetNormal(6)._x) + 0);
    let f6y = (Math.round(p_cube.getFacetNormal(6)._y) + 0);
    let f6z = (Math.round(p_cube.getFacetNormal(6)._z) + 0);

    let f7x = (Math.round(p_cube.getFacetNormal(7)._x) + 0);
    let f7y = (Math.round(p_cube.getFacetNormal(7)._y) + 0);
    let f7z = (Math.round(p_cube.getFacetNormal(7)._z) + 0);

    let f8x = (Math.round(p_cube.getFacetNormal(8)._x) + 0);
    let f8y = (Math.round(p_cube.getFacetNormal(8)._y) + 0);
    let f8z = (Math.round(p_cube.getFacetNormal(8)._z) + 0);

    let f9x = (Math.round(p_cube.getFacetNormal(9)._x) + 0);
    let f9y = (Math.round(p_cube.getFacetNormal(9)._y) + 0);
    let f9z = (Math.round(p_cube.getFacetNormal(9)._z) + 0);


    let f10x = (Math.round(p_cube.getFacetNormal(10)._x) + 0);
    let f10y = (Math.round(p_cube.getFacetNormal(10)._y) + 0);
    let f10z = (Math.round(p_cube.getFacetNormal(10)._z) + 0);

    let f11x = (Math.round(p_cube.getFacetNormal(11)._x) + 0);
    let f11y = (Math.round(p_cube.getFacetNormal(11)._y) + 0);
    let f11z = (Math.round(p_cube.getFacetNormal(11)._z) + 0);


    let f0String = "(" + f0x + "," + f0y + "," + f0z + ")";
    let f1String = "(" + f1x + "," + f1y + "," + f1z + ")";
    let f2String = "(" + f2x + "," + f2y + "," + f2z + ")";
    let f3String = "(" + f3x + "," + f3y + "," + f3z + ")";
    let f4String = "(" + f4x + "," + f4y + "," + f4z + ")";
    let f5String = "(" + f5x + "," + f5y + "," + f5z + ")";
    let f6String = "(" + f6x + "," + f6y + "," + f6z + ")";
    let f7String = "(" + f7x + "," + f7y + "," + f7z + ")";
    let f8String = "(" + f8x + "," + f8y + "," + f8z + ")";
    let f9String = "(" + f9x + "," + f9y + "," + f9z + ")";
    let f10String = "(" + f10x + "," + f10y + "," + f10z + ")";
    let f11String = "(" + f11x + "," + f11y + "," + f11z + ")";

    console.log("0: " + f0String);
    console.log("1: " + f1String);
    console.log("2: " + f2String);
    console.log("3: " + f3String);
    console.log("4: " + f4String);
    console.log("5: " + f5String);
    console.log("6: " + f6String);
    console.log("7: " + f7String);
    console.log("8: " + f8String);
    console.log("9: " + f9String);
    console.log("10: " + f10String);
    console.log("11: " + f11String);


}

const getFaceIndexFacingForward = (p_cube) => {
    const faceIndex = getFaceIndexMatchingNormal(p_cube, "(0,0,-1)");
    // console.log("IndexFacingForward: " + faceIndex);
    return faceIndex;
}

const getFaceIndexFacingRight = (p_cube) => {
    const faceIndex = getFaceIndexMatchingNormal(p_cube, "(1,0,0)");
    // console.log("IndexFacingRight: " + faceIndex);
    return faceIndex;
}

const getFaceIndexFacingUp = (p_cube) => {
    const faceIndex = getFaceIndexMatchingNormal(p_cube, "(0,1,0)");
    // console.log("IndexFacingUp: " + faceIndex);
    return faceIndex;
}



const checkCompletion = () => {
    let result = true;

    let solvedFRU = solvedFRUIndices[_solvingFor];

    _cube.forEach((c, i) => {
        let indexFacingForward = getFaceIndexFacingForward(c);
        let indexFacingRight = getFaceIndexFacingRight(c);
        let indexFacingUp = getFaceIndexFacingUp(c);

        let solvedFRUString = indexFacingForward.toString()+indexFacingRight.toString()+indexFacingUp.toString();

        if (c.userData.originalIndex != i || solvedFRUString != solvedFRU) {
            result = false;
        }
    });

    // showAllNormals(_selectedCube);

    // console.log("solvedFRUString: " + solvedFRUString);
    if (result) console.log("!!!!!!!! Solved !!!!!!!!");

    return result;
}


// 1.54 seconds
const swapCubesHorizontal = (index_1, index_2) => {

    let startz1 = _cube[index_1].position.z
    let endz1 = _cube[index_1].position.z - 1 / _scale / 2;
    let startz2 = _cube[index_2].position.z
    let endz2 = _cube[index_2].position.z + 1 / _scale / 2;

    let startx1 = _cube[index_1].position.x
    let endx1 = _cube[index_2].position.x;
    let startx2 = _cube[index_2].position.x
    let endx2 = _cube[index_1].position.x;

    BABYLON.Animation.CreateAndStartAnimation("moveUp", _cube[index_1], "position.z", 60, 30, startz1, endz1, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
        BABYLON.Animation.CreateAndStartAnimation("moveOver", _cube[index_1], "position.x", 60, 30, startx1, endx1, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
            BABYLON.Animation.CreateAndStartAnimation("moveDown", _cube[index_1], "position.z", 60, 30, endz1, startz1, 0, BABYLON.EasingFunction.easeInOutCubic, () => {});
        });
    });

    BABYLON.Animation.CreateAndStartAnimation("moveDown", _cube[index_2], "position.z", 60, 30, startz2, endz2, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
        BABYLON.Animation.CreateAndStartAnimation("moveOver", _cube[index_2], "position.x", 60, 30, startx2, endx2, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
            BABYLON.Animation.CreateAndStartAnimation("moveUp", _cube[index_2], "position.z", 60, 30, endz2, startz2, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
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
    let endz1 = _cube[index_1].position.z - 1 / _scale / 2;
    let startz2 = _cube[index_2].position.z
    let endz2 = _cube[index_2].position.z + 1 / _scale / 2;

    let starty1 = _cube[index_1].position.y
    let endy1 = _cube[index_2].position.y;
    let starty2 = _cube[index_2].position.y;
    let endy2 = _cube[index_1].position.y;

    BABYLON.Animation.CreateAndStartAnimation("moveUp", _cube[index_1], "position.z", 60, 30, startz1, endz1, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
        BABYLON.Animation.CreateAndStartAnimation("moveOver", _cube[index_1], "position.y", 60, 30, starty1, endy1, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
            BABYLON.Animation.CreateAndStartAnimation("moveDown", _cube[index_1], "position.z", 60, 30, endz1, startz1, 0, BABYLON.EasingFunction.easeInOutCubic, () => {});
        });
    });

    BABYLON.Animation.CreateAndStartAnimation("moveDown", _cube[index_2], "position.z", 60, 30, startz2, endz2, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
        BABYLON.Animation.CreateAndStartAnimation("moveOver", _cube[index_2], "position.y", 60, 30, starty2, endy2, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
            BABYLON.Animation.CreateAndStartAnimation("moveDown", _cube[index_2], "position.z", 60, 30, endz2, startz2, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
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
                rotateCubeDownQ(c);
                break;
            case 1:
                rotateCubeLeftQ(c);
                break;
            case 2:
                rotateCubeRightQ(c);
                break;
            case 3:
                rotateCubeUpQ(c);
                break;
            default:
                break;
        }
    });
}

// .25 seconds
const rotateCubeUpQ = (p_cube) => { // right/down is -,  "rotation.x", "rotation.y"
    _animating++;
    var axis = new BABYLON.Vector3(1, 0, 0);
    var angle = Math.PI / 2;
    var rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
    var start = p_cube.rotationQuaternion;

    var end = rotationQuaternion.multiply(p_cube.rotationQuaternion);

    BABYLON.Animation.CreateAndStartAnimation("rotation", p_cube, 'rotationQuaternion', 60, 15, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
        _animating--;


        _solved = checkCompletion();
    });
}

const rotateCubeDownQ = (p_cube) => { // right/down is -,  "rotation.x", "rotation.y"
    _animating++;
    var axis = new BABYLON.Vector3(1, 0, 0);
    var angle = -Math.PI / 2;
    var rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
    var start = p_cube.rotationQuaternion;

    var end = rotationQuaternion.multiply(p_cube.rotationQuaternion);

    BABYLON.Animation.CreateAndStartAnimation("rotation", p_cube, 'rotationQuaternion', 60, 15, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
        _animating--;


        _solved = checkCompletion();
    });
}

// .25 seconds
const rotateCubeLeftQ = (p_cube) => { // right/down is -,  "rotation.x", "rotation.y"
    _animating++;
    var axis = new BABYLON.Vector3(0, 1, 0);
    var angle = Math.PI / 2;
    var rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
    var start = p_cube.rotationQuaternion;

    var end = rotationQuaternion.multiply(p_cube.rotationQuaternion);

    BABYLON.Animation.CreateAndStartAnimation("rotation", p_cube, 'rotationQuaternion', 60, 15, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
        _animating--;


        _solved = checkCompletion();
    });
}

const rotateCubeRightQ = (p_cube) => { // right/down is -,  "rotation.x", "rotation.y"
    _animating++;
    var axis = new BABYLON.Vector3(0, 1, 0);
    var angle = -Math.PI / 2;
    var rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
    var start = p_cube.rotationQuaternion;

    var end = rotationQuaternion.multiply(p_cube.rotationQuaternion);

    BABYLON.Animation.CreateAndStartAnimation("rotation", p_cube, 'rotationQuaternion', 60, 15, start, end, 0, BABYLON.EasingFunction.easeInOutCubic, () => {
        _animating--;


        _solved = checkCompletion();
    });
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

/*
side 0 faces the positive z direction   back
side 1 faces the negative z direction   front
side 2 faces the positive x direction   right
side 3 faces the negative x direction   left
side 4 faces the positive y direction   top
side 5 faces the negative y direction   bottom



// reviewing _cube[0] face [1] normal (facing us)

back   "./images/falls.jpg",         068      
front  "./images/sprague_lake.jpg",  248
right  "./images/dream_lake.jpg",   408
left   "./images/bear_lake.jpg",   628
top    "./images/cheesman.jpg",    840        
bottom "./images/dunes.jpg"];      1042   






0 back
1 back
2 front
3 front
4 right
5 right
6 left
7 left
8 top
9 top
10 bottom
11 bottom


0, 4 and 8
*/