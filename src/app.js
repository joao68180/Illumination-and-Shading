/**
 * @author João Fernandes - 68180
 * @author André Narquel - 67870
 */

import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../../libs/utils.js';
import { length, flatten, inverse, mult, normalMatrix, perspective, lookAt, vec4, vec3, vec2, subtract, add, scale, rotate, normalize } from '../../libs/MV.js';

import * as dat from '../../libs/dat.gui.module.js';
import * as CUBE from '../../libs/objects/cube.js';
import * as BUNNY from '../../libs/objects/bunny.js';
import * as TORUS from '../../libs/objects/torus.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as STACK from '../../libs/stack.js';
import * as SPHERE from '../../libs/objects/sphere.js';

const OBJ_SIZE = 2;
const OFFSET = 1.25;
const NUM_LIGHTS = 3;

let options = {
    backfaceCulling: false,
    depth_test: true,
    phong: false
  }

function setup(shaders) {
  const canvas = document.getElementById('gl-canvas');
  const gl = setupWebGL(canvas);

  CUBE.init(gl);
  BUNNY.init(gl);
  TORUS.init(gl);
  CYLINDER.init(gl);
  SPHERE.init(gl);
  
  const phong_program = buildProgramFromSources(gl, shaders['shader2.vert'], shaders['shader2.frag']);
  const gouraud_program = buildProgramFromSources(gl, shaders['shader1.vert'], shaders['shader1.frag']);

  /**
   * Function that gets the locations of the uniforms in the shaders using a cycle 
   * to go through every light in the program.
   * @param {WebGLprogram} program 
   * @returns the light's and material's locations in the shader.
   */
  function getUniformLocations(program){
    let lightLocs = [];
    for (let i = 0; i < NUM_LIGHTS; i++) {
      lightLocs.push({
        ambient: gl.getUniformLocation(program, `u_lights[${i}].ambient`),
        diffuse: gl.getUniformLocation(program, `u_lights[${i}].diffuse`),
        specular: gl.getUniformLocation(program, `u_lights[${i}].specular`),
        position: gl.getUniformLocation(program, `u_lights[${i}].position`),
        axis: gl.getUniformLocation(program, `u_lights[${i}].axis`),
        aperture: gl.getUniformLocation(program, `u_lights[${i}].aperture`),
        cutoff: gl.getUniformLocation(program, `u_lights[${i}].cutoff`),
        type: gl.getUniformLocation(program, `u_lights[${i}].type`)
      });
    }
    const u_materialLocs = {
      Ka: gl.getUniformLocation(program, "u_material.Ka"),
      Kd: gl.getUniformLocation(program, "u_material.Kd"),
      Ks: gl.getUniformLocation(program, "u_material.Ks"),
      shininess: gl.getUniformLocation(program, "u_material.shininess")
    };
    return {lightLocs, u_materialLocs};
  }
  
  const phong_locs = getUniformLocations(phong_program);
  const gouraud_locs = getUniformLocations(gouraud_program);


  /**
   * Default camera to support the Reset Camera button
   */
  const defaultCamera = {
    eye: vec3(0, 5.5, 9),
    at: vec3(0, 0, 0),
    up: vec3(0, 1, 0),
    fovy: 90,
    aspect: 1,
    near: 0.1,
    far: 20
  };
 
  let camera = {
    eye: vec3(0, 5.5, 9),
    at: vec3(0, 0, 0),
    up: vec3(0, 1, 0),
    fovy: 90,
    aspect: 1,
    near: 0.1,
    far: 20
  };

  /**
   * 3 Lights, each with different default settings that can be changed in the GUI
   * 3 different types , 1 for each -> Point, Directional and Spotlight
   */
  let lights = [
    {
      position: vec4(-5, 5, 0, 1),
      intensities: [
        vec3(20, 20, 20),     
        vec3(255, 250, 240),
        vec3(255, 250, 240)   
      ],
      axis: vec3(0, 0, -1),
      aperture: 10,
      cutoff: 10,
      isOn: true,
      type:'Point'
    },
    {
      position: vec4(0, 5, 0, 0),
      intensities: [
        vec3(20, 20, 20),
        vec3(255, 250, 240),
        vec3(255, 250, 240)
      ],
      axis: vec3(0, 0, -1),
      aperture: 10,
      cutoff: 10,
      isOn: true,
      type:'Directional'
    },
    {
      position: vec4(5, 5, 0, 1),
      intensities: [
        vec3(20, 20, 20),
        vec3(255, 250, 240),
        vec3(255, 250, 240)
      ],
      axis: vec3(0, -1, 0),
      aperture: 20,
      cutoff: 10,
      isOn: true,
      type: 'Spotlight'
    }
  ];

  //object materials, only the bunny material can be changed in the GUI

  let bunnyMaterial = {
    Ka: [150, 150, 150],
    Kd: [150, 150, 150],
    Ks: [200, 200, 200],
    shininess: 100
  }

  const platformMaterial = {
    Ka: [100, 50, 50],
    Kd: [50, 50, 50],
    Ks: [100, 100, 100],
    shininess: 50
  };

  const torusMaterial = {
    Ka: [200, 25, 200],
    Kd: [200, 25, 200],
    Ks: [200, 200, 200],
    shininess: 80
  };

  const cubeMaterial = {
    Ka: [255, 230, 25],
    Kd: [255, 230, 25],
    Ks: [255, 255, 255],
    shininess: 60
  };

  const cylinderMaterial = {
    Ka: [0, 150, 200],
    Kd: [0, 150, 200],
    Ks: [200, 200, 200],
    shininess: 70
  };

  const lampMaterial = {
    Ka: [255, 255, 255],
    Kd: [255, 255, 255],
    Ks: [200, 200, 200],
    shininess: 1
  }

  const lampOffMaterial = {
    Ka: [50, 50, 50], 
    Kd: [50, 50, 50],
    Ks: [0, 0, 0],
    shininess: 1
}

  const gui = new dat.GUI();

  const optionsGui = gui.addFolder("options");
  optionsGui.add(options, "backfaceCulling").name("backface culling");
  optionsGui.add(options, "depth_test").name("depth test");
  optionsGui.add(options, "phong").name("Phong shading");

  const cameraGui = gui.addFolder("camera");

  const cameraControls = {
      reset: resetCamera
  };

  //Reset Camera button
  cameraGui.add(cameraControls, 'reset').name('Reset Camera');

  cameraGui.add(camera, "fovy").min(1).max(179).step(1).listen();
  cameraGui.add(camera, "aspect").min(0).max(10).step(0.01).listen().domElement.style.pointerEvents = "none";

  cameraGui.add(camera, "near").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
    camera.near = Math.min(camera.far - 0.5, v);
  });

  cameraGui.add(camera, "far").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
    camera.far = Math.max(camera.near + 0.5, v);
  });

  const eye = cameraGui.addFolder("eye");
  eye.add(camera.eye, 0).step(0.05).min(-10).max(10).listen();
  eye.add(camera.eye, 1).step(0.05).min(-5).max(10).listen();
  eye.add(camera.eye, 2).step(0.05).min(-10).max(10).listen();

  const at = cameraGui.addFolder("at");
  at.add(camera.at, 0).step(0.05).min(-5).max(5).listen();
  at.add(camera.at, 1).step(0.05).min(-2).max(4).listen();
  at.add(camera.at, 2).step(0.05).min(-5).max(5).listen();

  const up = cameraGui.addFolder("up");
  up.add(camera.up, 0).step(0.05).min(-1).max(1).listen();
  up.add(camera.up, 1).step(0.05).min(-1).max(1).listen();
  up.add(camera.up, 2).step(0.05).min(0).max(1).listen();

  const lightsGui = gui.addFolder("lights");

  /**
   * cycle that creates the folder, innerFolders, positions and more for every light
   * supported by the program.
   */
  lights.forEach((light, i) => {
    const folder = lightsGui.addFolder("light" + (i + 1));

    folder.add(light, "isOn").name("ON/OFF");

    folder.add(light, "type", ['Point', 'Directional', 'Spotlight']).name("Type");

    const posFolder = folder.addFolder("position");
    posFolder.add(light.position, 0).name("x").step(0.1).listen();
    posFolder.add(light.position, 1).name("y").step(0.1).listen();
    posFolder.add(light.position, 2).name("z").step(0.1).listen();
    posFolder.add(light.position, 3).name("w").step(0.1).listen();

    const intFolder = folder.addFolder("intensities");
    intFolder.addColor(light.intensities, 0).name("ambient");
    intFolder.addColor(light.intensities, 1).name("diffuse");
    intFolder.addColor(light.intensities, 2).name("specular");

    const axisFolder = folder.addFolder("axis");
    axisFolder.add(light.axis, 0).step(0.01).name("x");
    axisFolder.add(light.axis, 1).step(0.01).name("y");
    axisFolder.add(light.axis, 2).step(0.01).name("z");

    folder.add(light, "aperture").min(0).max(150).step(1).listen();
    folder.add(light, "cutoff").min(0).max(150).step(1).listen();
  })

  //Bunny material folder
  const materialGui = gui.addFolder("material (bunny)");
  materialGui.addColor(bunnyMaterial, "Ka");
  materialGui.addColor(bunnyMaterial, "Kd");
  materialGui.addColor(bunnyMaterial, "Ks");
  materialGui.add(bunnyMaterial, "shininess").step(1).min(0).max(999).listen();

  /**
   * Function that sets the sends the material data to the shader, used by the objects created below
   * @param {*} material 
   * @param {*} locs 
   */
  function setMaterialUniforms(material , locs) {
    gl.uniform3fv(locs.Ka, flatten(material.Ka));
    gl.uniform3fv(locs.Kd, flatten(material.Kd));
    gl.uniform3fv(locs.Ks, flatten(material.Ks));
    gl.uniform1f(locs.shininess, material.shininess);
  }

  //Platform object
  function platform(current_locs, current_program) {
    STACK.pushMatrix();
    STACK.multScale([10, 0.5, 10]);
    STACK.multTranslation([0, -0.25, 0]);
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mModelView"), false, flatten(STACK.modelView()));
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mNormals"), false, flatten(normalMatrix(STACK.modelView())));
    setMaterialUniforms(platformMaterial, current_locs);
    CUBE.draw(gl, current_program, gl.TRIANGLES);
    STACK.popMatrix();
  }

  //Torus object
  function torus(current_locs, current_program) {
    STACK.pushMatrix();
    STACK.multScale([OBJ_SIZE, OBJ_SIZE, OBJ_SIZE]);
    STACK.multTranslation([OFFSET, OBJ_SIZE / 8, OFFSET])
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mModelView"), false, flatten(STACK.modelView()));
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mNormals"), false, flatten(normalMatrix(STACK.modelView())));
    setMaterialUniforms(torusMaterial, current_locs);
    TORUS.draw(gl, current_program, gl.TRIANGLES);
    STACK.popMatrix();
  }

  //Cube object
  function cube(current_locs, current_program) {
    STACK.pushMatrix();
    STACK.multScale([OBJ_SIZE, OBJ_SIZE, OBJ_SIZE]);
    STACK.multTranslation([OFFSET, OBJ_SIZE / 4, -OFFSET]);
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mModelView"), false, flatten(STACK.modelView()));
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mNormals"), false, flatten(normalMatrix(STACK.modelView())));
    setMaterialUniforms(cubeMaterial, current_locs);
    CUBE.draw(gl, current_program, gl.TRIANGLES);
    STACK.popMatrix();
  }
  
  //Cylinder object
  function cylinder(current_locs, current_program) {
    STACK.pushMatrix();
    STACK.multScale([OBJ_SIZE, OBJ_SIZE, OBJ_SIZE]);
    STACK.multTranslation([-OFFSET, OBJ_SIZE / 4, -OFFSET]);
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mModelView"), false, flatten(STACK.modelView()));
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mNormals"), false, flatten(normalMatrix(STACK.modelView())));
    setMaterialUniforms(cylinderMaterial, current_locs);
    CYLINDER.draw(gl, current_program, gl.TRIANGLES);
    STACK.popMatrix();
  }

  //Bunny object
  function bunny(current_locs, current_program) {
    STACK.pushMatrix();
    STACK.multScale([OBJ_SIZE, OBJ_SIZE, OBJ_SIZE]);
    STACK.multTranslation([-OFFSET, OBJ_SIZE / 4, OFFSET]);
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mModelView"), false, flatten(STACK.modelView()));
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mNormals"), false, flatten(normalMatrix(STACK.modelView())));
    setMaterialUniforms(bunnyMaterial, current_locs);
    BUNNY.draw(gl, current_program, gl.TRIANGLES);
    STACK.popMatrix();
  }

  //First lamp 
  function lamp1(current_locs, current_program) {
    STACK.pushMatrix();
    STACK.multTranslation([lights[0].position[0], lights[0].position[1], lights[0].position[2]]);
    STACK.multScale([0.40, 0.40, 0.40]);
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mModelView"), false, flatten(STACK.modelView()));
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mNormals"), false, flatten(normalMatrix(STACK.modelView())));
    setMaterialUniforms(lights[0].isOn ? lampMaterial : lampOffMaterial, current_locs);
    SPHERE.draw(gl, current_program, gl.TRIANGLES);
    STACK.popMatrix();
  }

  //Second lamp
  function lamp2(current_locs, current_program) {
    STACK.pushMatrix();
    STACK.multTranslation([lights[1].position[0], lights[1].position[1], lights[1].position[2]]);
    STACK.multScale([0.40, 0.40, 0.40]);
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mModelView"), false, flatten(STACK.modelView()));
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mNormals"), false, flatten(normalMatrix(STACK.modelView())));
    setMaterialUniforms(lights[1].isOn ? lampMaterial : lampOffMaterial, current_locs);
    SPHERE.draw(gl, current_program, gl.TRIANGLES);
    STACK.popMatrix();
  }

  //Third lamp
  function lamp3(current_locs, current_program) {
    STACK.pushMatrix();
    STACK.multTranslation([lights[2].position[0], lights[2].position[1], lights[2].position[2]]);
    STACK.multScale([0.4, 0.4, 0.4]);
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mModelView"), false, flatten(STACK.modelView()));
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "u_mNormals"), false, flatten(normalMatrix(STACK.modelView())));
    setMaterialUniforms(lights[2].isOn ? lampMaterial : lampOffMaterial, current_locs);
    SPHERE.draw(gl, current_program, gl.TRIANGLES);
    STACK.popMatrix();
  }

  /**
   * Assembles all the objects into the Scene, rendering them using phong (fragment)
   * or gouraud(vertex)
   */
  function drawScene() {
    const current_locs = options.phong ? phong_locs.u_materialLocs : gouraud_locs.u_materialLocs;
    const current_program = options.phong ? phong_program : gouraud_program;

    platform(current_locs, current_program);
    torus(current_locs, current_program);
    cube(current_locs, current_program);
    cylinder(current_locs, current_program);
    bunny(current_locs, current_program);
    lamp1(current_locs, current_program);
    lamp2(current_locs, current_program);
    lamp3(current_locs, current_program);
  }

  /**
   * Function that resets the camera to the default camera settings
   */
  function resetCamera() {
    camera.eye[0] = defaultCamera.eye[0];
    camera.eye[1] = defaultCamera.eye[1];
    camera.eye[2] = defaultCamera.eye[2];

    camera.at[0] = defaultCamera.at[0];
    camera.at[1] = defaultCamera.at[1];
    camera.at[2] = defaultCamera.at[2];

    camera.up[0] = defaultCamera.up[0];
    camera.up[1] = defaultCamera.up[1];
    camera.up[2] = defaultCamera.up[2];

    camera.fovy = defaultCamera.fovy;
    camera.near = defaultCamera.near;
    camera.far = defaultCamera.far; 
  };

  // matrices
  let mView, mProjection;

  let down = false;
  let lastX, lastY;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  resizeCanvasToFullWindow();

  window.addEventListener('resize', resizeCanvasToFullWindow);

  window.addEventListener('wheel', function (event) {
    if (!event.altKey && !event.metaKey && !event.ctrlKey) { // Change fovy
      const factor = 1 - event.deltaY / 1000;
      camera.fovy = Math.max(1, Math.min(179, camera.fovy * factor));
    }
    else if (event.metaKey || event.ctrlKey) {
      // move camera forward and backwards (shift)
      const OFFSET = event.deltaY / 1000;
      const dir = normalize(subtract(camera.at, camera.eye));
      const ce = add(camera.eye, scale(OFFSET, dir));
      const ca = add(camera.at, scale(OFFSET, dir));

      // Can't replace the objects that are being listened by dat.gui, only their properties.
      camera.eye[0] = ce[0];
      camera.eye[1] = ce[1];
      camera.eye[2] = ce[2];

      if (event.ctrlKey) {
        camera.at[0] = ca[0];
        camera.at[1] = ca[1];
        camera.at[2] = ca[2];
      }
    }
  });

  function inCameraSpace(m) {
    const mInvView = inverse(mView);
    return mult(mInvView, mult(m, mView));
  }

  canvas.addEventListener('mousemove', function (event) {
    if (down) {
      const dx = event.offsetX - lastX;
      const dy = event.offsetY - lastY;

      if (dx != 0 || dy != 0) {
        const d = vec2(dx, dy);
        const axis = vec3(-dy, -dx, 0);
        const rotation = rotate(0.5 * length(d), axis);

        let eyeAt = subtract(camera.eye, camera.at);
        eyeAt = vec4(eyeAt[0], eyeAt[1], eyeAt[2], 0);
        let newUp = vec4(camera.up[0], camera.up[1], camera.up[2], 0);

        eyeAt = mult(inCameraSpace(rotation), eyeAt);
        newUp = mult(inCameraSpace(rotation), newUp);

        camera.eye[0] = camera.at[0] + eyeAt[0];
        camera.eye[1] = camera.at[1] + eyeAt[1];
        camera.eye[2] = camera.at[2] + eyeAt[2];

        camera.up[0] = newUp[0];
        camera.up[1] = newUp[1];
        camera.up[2] = newUp[2];

        lastX = event.offsetX;
        lastY = event.offsetY;
      }
    }
  });

  canvas.addEventListener('mousedown', function (event) {
    down = true;
    lastX = event.offsetX;
    lastY = event.offsetY;
  });

  canvas.addEventListener('mouseup', function (event) {
    down = false;
  });

  window.requestAnimationFrame(render);

  /**
   * Switches on/off the backface Culling set by the toggle button in the GUI
   */
  function updateCulling() {
    if (options.backfaceCulling) {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.frontFace(gl.CCW);
    } else {
      gl.disable(gl.CULL_FACE);
    }
  }

  /**
   * Switches on/off the depth test set by the toggle button in the GUI
   */
  function updateDepthTest() {
    if (options.depth_test) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }

  function resizeCanvasToFullWindow() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function render(time) {
    window.requestAnimationFrame(render);

    updateCulling();
    updateDepthTest();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const current_program = options.phong ? phong_program : gouraud_program;
    const current_locs1 = options.phong ? phong_locs : gouraud_locs;

    gl.useProgram(current_program);

    mView = lookAt(camera.eye, camera.at, camera.up);
    STACK.loadMatrix(mView);

    mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);

    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "mProjection"), false, flatten(mProjection));
    gl.uniformMatrix4fv(gl.getUniformLocation(current_program, "mView"), false, flatten(mView));

    const u_n_lightsLoc = gl.getUniformLocation(current_program, "u_n_lights");
    gl.uniform1i(u_n_lightsLoc, lights.length);

    //cycle to render all of the lights by sending all their relevant data to the shader 
    //The type variable is changed from string to float because the shader doesnt support strings as uniforms 
    for (let i = 0; i < lights.length; i++) {
      const light = lights[i];
      const locs = current_locs1.lightLocs[i];

      let lightType = 0;
      light.position[3] = 1.0;
      if (light.type == 'Directional') {
        lightType = 1;
        light.position[3] = 0.0;
      } else if (light.type == 'Spotlight') {
        light.position[3] = 1.0;
        lightType = 2;
      }
      gl.uniform1i(locs.type, lightType);

      let ambient, diffuse, specular;

      //supports the toggle the lights on/off in the GUI
      if (light.isOn) {
            ambient = light.intensities[0];
            diffuse = light.intensities[1];
            specular = light.intensities[2];
        } else {
            ambient = vec3(0.0);
            diffuse = vec3(0.0);
            specular = vec3(0.0);
        }

      const convertedPosition = mult(mView, light.position);
      const axis4 = vec4(light.axis[0], light.axis[1], light.axis[2], 0.0);
      const convertedAxis = mult(mView, axis4);

      gl.uniform4fv(locs.position, flatten(convertedPosition));
      gl.uniform3fv(locs.axis, flatten(vec3(convertedAxis)));

      gl.uniform3fv(locs.ambient, flatten(ambient));
      gl.uniform3fv(locs.diffuse, flatten(diffuse));
      gl.uniform3fv(locs.specular, flatten(specular));

      gl.uniform1f(locs.aperture, light.aperture);
      gl.uniform1f(locs.cutoff, light.cutoff);
    }

    drawScene();
  }
}

const urls = ['shader1.vert', 'shader1.frag', 'shader2.frag', 'shader2.vert'];

loadShadersFromURLS(urls).then(shaders => setup(shaders));