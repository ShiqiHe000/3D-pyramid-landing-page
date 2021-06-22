import * as THREE from "three";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";

const initialColor = {
    r: 0,
    g: 0.19,
    b: 0.4,
};

let frame = 0;

// GUI ------------------------------------------------------------
const gui = new dat.GUI();
const world = {
    plane: {
        width: 15,
        height: 12,
        widthSegment: 22,
        heightSegment: 29,
    },
};
gui.add(world.plane, "width", 1, 35).onChange(drawPlane);

gui.add(world.plane, "height", 1, 35).onChange(drawPlane);
gui.add(world.plane, "widthSegment", 10, 50).onChange(drawPlane);
gui.add(world.plane, "heightSegment", 10, 50).onChange(drawPlane);
// ---------------------------------------------------------------------

// essentials init--------------------------------------------------------
const raycaster = new THREE.Raycaster();
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(renderer.domElement);
// -----------------------------------------------------------

// plane object ------------------------------------------------
const planeGeomertry = new THREE.PlaneGeometry(
    world.plane.width,
    world.plane.height,
    world.plane.widthSegment,
    world.plane.heightSegment
);
const planeMaterial = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    flatShading: THREE.FlatShading,
    vertexColors: true,
});
const planeMesh = new THREE.Mesh(planeGeomertry, planeMaterial);
scene.add(planeMesh);

// set color on each vertex ------------------------------------------------
addColorOnVertices();
// -----------------------------------------------------------------

// set z index ------------------------------------------------------
drawZIndex();
//---------------------------------------------------------------------

// Add light ---------------------------------------------------------
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, -1, 1);
scene.add(light);
const lightBack = new THREE.DirectionalLight(0xffffff, 1);
lightBack.position.set(0, 0, -1);
scene.add(lightBack);
// --------------------------------------------------------------------

// Orbit control ------------------------------------------------------
new OrbitControls(camera, renderer.domElement);

camera.position.z = 5;
// --------------------------------------------------------------------
const mouse = {
    x: null,
    y: null,
};

// normalize the mouse position
window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (-event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);

    drawPlane();
});

animate();

function animate() {
    requestAnimationFrame(animate);
    frame += 0.01;
    renderer.render(scene, camera);
    const { array, originalPositions, randomMovement } =
        planeMesh.geometry.attributes.position;
    for (let i = 0; i < array.length; i += 3) {
        array[i] =
            originalPositions[i] + Math.cos(frame + randomMovement[i]) * 0.002; // x

        array[i + 1] =
            originalPositions[i + 1] +
            Math.sin(frame + randomMovement[i + 1]) * 0.002; // y

        array[i + 2] =
            originalPositions[i + 2] +
            Math.sin(frame + randomMovement[i + 2]) * 0.001; // z
    }
    planeMesh.geometry.attributes.position.needsUpdate = true;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(planeMesh);
    if (intersects.length > 0) {
        // change the vertex color
        const hoverColor = {
            r: 0.1,
            g: 0.5,
            b: 1,
        };
        updateColor(intersects, hoverColor);

        gsap.to(hoverColor, {
            r: initialColor.r,
            g: initialColor.g,
            b: initialColor.b,
            duration: 1,
            onUpdate: () => {
                updateColor(intersects, hoverColor);
            },
        });
    }
}

// update the rgb color on each vertex
function updateColor(intersects, rgb) {
    const { color } = intersects[0].object.geometry.attributes;

    const { r, g, b } = rgb;
    // vertices 1
    color.setX(intersects[0].face.a, r); // set r
    color.setY(intersects[0].face.a, g); // set g
    color.setZ(intersects[0].face.a, b); // set b

    // vertices 2
    color.setX(intersects[0].face.b, r);
    color.setY(intersects[0].face.b, g);
    color.setZ(intersects[0].face.b, b);

    // vertices 3
    color.setX(intersects[0].face.c, r);
    color.setY(intersects[0].face.c, g);
    color.setZ(intersects[0].face.c, b);
    color.needsUpdate = true;
}

function drawPlane() {
    planeMesh.geometry.dispose();
    planeMesh.geometry = new THREE.PlaneGeometry(
        world.plane.width,
        world.plane.height,
        world.plane.widthSegment,
        world.plane.heightSegment
    );

    addColorOnVertices();

    // redraw z index
    drawZIndex();
}

function addColorOnVertices() {
    const colors = [];
    for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
        colors.push(initialColor.r, initialColor.g, initialColor.b);
    }

    planeMesh.geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(new Float32Array(colors), 3)
    );
}

function drawZIndex() {
    const { array: geoArray } = planeMesh.geometry.attributes.position;
    let randomMovement = [];
    for (let i = 0; i < geoArray.length; i++) {
        if (i % 3 === 0) {
            geoArray[i] += Math.random() - 0.5; // x
            geoArray[i] += Math.random() - 0.5; // y
            geoArray[i + 2] += Math.random() - 0.5; // z
        }
        randomMovement.push((Math.random() - 0.5) * 2 * Math.PI);
    }

    planeMesh.geometry.attributes.position.randomMovement = randomMovement;

    planeMesh.geometry.attributes.position.originalPositions =
        planeMesh.geometry.attributes.position.array;

    // console.log(planeMesh.geometry.attributes.position);
}
