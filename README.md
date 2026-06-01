#Illumination and Shading project

# WebGL Shading

Interactive WebGL application developed for the Computer Graphics and Interfaces course at NOVA FCT, exploring Phong and Gouraud shading models with configurable light sources and camera controls.

## Objective

Build a 3D scene rendered with WebGL where objects can be visualised under different lighting conditions using either Phong or Gouraud shading, with full interactive control via GUI.

## Scene

- **Platform:** 10 × 0.5 × 10 parallelepiped aligned with world axes, upper face at y = 0
- **Objects:** 4 primitives (cube, torus, cylinder, bunny) placed in quadrants on top of the platform
- **Lights:** 3 configurable light sources (point, directional, spotlight)
- **Camera:** Perspective projection filling the full browser window

## Features

- Toggle between Phong (per-fragment) and Gouraud (per-vertex) shading
- Enable/disable backface culling and depth testing
- Camera fully configurable via GUI: eye, at, up, fovy, near, far
- Per-light configuration: type, position, intensities, axis, aperture, cutoff, on/off toggle
- Bunny material editable via GUI: Ka, Kd, Ks, shininess
- Scene resizes dynamically with the browser window

## Academic Context

Developed for the Computer Graphics and Interfaces course at NOVA FCT.