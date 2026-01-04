// @ts-nocheck
'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { hyperspeedPresets } from './hyperspeed-presets';
import {
  deepDistortion,
  longRaceDistortion,
  mountainDistortion,
  turbulentDistortion,
  xyDistortion
} from './hyperspeed-distortions';

const Hyperspeed = ({
  activePreset = 'one',
  ...props
}) => {
  const containerRef = useRef();

  useEffect(() => {
    const options = {
      ...hyperspeedPresets[activePreset],
      ...props
    };

    let onSpeedUp = (ev) => options.onSpeedUp(ev);
    let onSlowDown = (ev) => options.onSlowDown(ev);
    
    let container = containerRef.current;
    if (!container) return;
    
    //--------------------------------------------------
    //- Main
    
    let scene = new THREE.Scene();
    scene.background = new THREE.Color(options.colors.background);
    scene.fog = new THREE.Fog(
      scene.background,
      options.length * 0.2,
      options.length * 50
    );

    let camera = new THREE.PerspectiveCamera(
      options.fov,
      container.clientWidth / container.clientHeight,
      0.1,
      options.length * 2
    );
    
    const initialCameraPosition = 40;
    camera.position.z = initialCameraPosition;
    camera.position.y = 5;

    let renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(container.clientWidth, container.clientHeight);

    let composer = {
      render: () => {
        renderer.render(scene, camera);
      }
    };
    
    container.appendChild(renderer.domElement);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    
    //--------------------------------------------------
    //- Road
    
    let road = new Road(options);
    scene.add(road.mesh);
    
    let leftSticks = new LightSticks(options, true);
    scene.add(leftSticks.mesh);
    
    let rightSticks = new LightSticks(options, false);
    scene.add(rightSticks.mesh);

    let distortion;
    if (options.distortion === "deepDistortion") distortion = deepDistortion;
    else if (options.distortion === "longRaceDistortion") distortion = longRaceDistortion;
    else if (options.distortion === "mountainDistortion") distortion = mountainDistortion;
    else if (options.distortion === "turbulentDistortion") distortion = turbulentDistortion;
    else if (options.distortion === "xyDistortion") distortion = xyDistortion;
    
    //--------------------------------------------------
    //- Cars
    
    let cars = new Cars(options, distortion);
    scene.add(cars.mesh);
    
    //--------------------------------------------------
    //- Player
    
    const player = new THREE.Object3D();
    player.position.set(0, 0, initialCameraPosition);
    player.add(camera);
    scene.add(player);
    
    //--------------------------------------------------
    //- Loop
    
    let then = 0;
    let speedUp = false;
    let time = 0;
    
    function loop(now) {
      if (!container) return;

      requestAnimationFrame(loop);
      
      now *= 0.001;
      let dt = Math.min(now - then, 0.1);
      then = now;
      
      let speed = speedUp ? options.speedUp : 1;
      
      time += dt * speed;

      player.position.z = initialCameraPosition - time * 20;

      road.update(time);
      leftSticks.update(time);
      rightSticks.update(time);

      const fov = speedUp ? options.fovSpeedUp : options.fov;
      camera.fov = fov;
      camera.updateProjectionMatrix();

      cars.update(time);
      
      composer.render(scene, camera);
    }
    
    requestAnimationFrame(loop);

    //--------------------------------------------------
    //- Speed up
    
    const handleSpeedUp = (e) => {
      if (e.type === "mousedown" || e.type === "touchstart") {
        speedUp = true;
        onSpeedUp(e);
      } else if (e.type === "mouseup" || e.type === "touchend") {
        speedUp = false;
        onSlowDown(e);
      }
    }
    
    document.addEventListener("mousedown", handleSpeedUp, false);
    document.addEventListener("mouseup", handleSpeedUp, false);
    document.addEventListener("touchstart", handleSpeedUp, { passive: true });
    document.addEventListener("touchend", handleSpeedUp, false);

    //--------------------------------------------------
    //- Clean up
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener("mousedown", handleSpeedUp);
      document.removeEventListener("mouseup", handleSpeedUp);
      document.removeEventListener("touchstart", handleSpeedUp);
      document.removeEventListener("touchend", handleSpeedUp);

      // dispose of all objects in the scene
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      
      renderer.dispose();
      
      if (container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activePreset]);
  
  return <div className="h-full w-full" ref={containerRef} />;
};

function Road(options) {
  let material = new THREE.LineBasicMaterial({
    color: options.colors.roadColor
  });

  const path = new THREE.Path();
  path.moveTo(0, 0);
  path.lineTo(0, options.length);
  const points = path.getPoints(1);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  this.mesh = new THREE.Line(geometry, material);

  this.update = function (time) {
    this.mesh.position.z = (time * 20) % (options.length / 10);
  };
}

function CarLights(options, distortion) {
  let leftLaneLights = new LightsCollection(options, "left", distortion);
  let rightLaneLights = new LightsCollection(options, "right", distortion);

  this.mesh = new THREE.Object3D();
  this.mesh.add(leftLaneLights.mesh);
  this.mesh.add(rightLaneLights.mesh);

  this.update = function (time) {
    leftLaneLights.update(time);
    rightLaneLights.update(time);
  };
}

function LightsCollection(options, side, distortion) {
  const lanms = options.lanesPerRoad;
  const lightPairs = options.lightPairsPerRoadWay;
  const infos = [];
  for (let i = 0; i < lightPairs; i++) {
    const info = {
      z: Math.random() * options.length,
      lane: Math.floor(Math.random() * options.lanesPerRoad),
      color:
        side === "left"
          ? options.colors.leftCars[
              Math.floor(Math.random() * options.colors.leftCars.length)
            ]
          : options.colors.rightCars[
              Math.floor(Math.random() * options.colors.rightCars.length)
            ],
      speed:
        Math.random() * (options.movingAwaySpeed[1] - options.movingAwaySpeed[0]) +
        options.movingAwaySpeed[0]
    };
    infos.push(info);
  }

  const curve = new THREE.LineCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1)
  );

  const path = new THREE.TubeGeometry(curve, 40, 1, 8, false);
  const material = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    color: 0xffffff
  });

  this.mesh = new THREE.Object3D();

  infos.forEach((info) => {
    let m = new THREE.Mesh(path, material);
    m.info = info;
    this.mesh.add(m);
  });

  this.update = function (time) {
    const carLightsLength = [options.carLightsLength[0], options.carLightsLength[1]];

    this.mesh.children.forEach((m) => {
      m.info.z -= m.info.speed * (1 / 60);

      if (m.info.z < -options.length / 20) {
        m.info.z = options.length / 2;
        m.info.lane = Math.floor(Math.random() * options.lanesPerRoad);
        m.info.speed =
          Math.random() * (options.movingAwaySpeed[1] - options.movingAwaySpeed[0]) +
          options.movingAwaySpeed[0];
      }

      let pos = distortion(m.info.z, time);

      let roadHalfWidth = options.roadWidth / 2;
      const laneWidth = roadHalfWidth / lanms;

      pos.x +=
        -roadHalfWidth +
        laneWidth * m.info.lane +
        laneWidth / 2;

      pos.x *= side === "left" ? 1 : -1;
      
      m.position.set(pos.x, pos.y, m.info.z);

      let carLength = Math.random() * (carLightsLength[1] - carLightsLength[0]) + carLightsLength[0];
      m.scale.set(1, 1, carLength);

      m.material.color.set(m.info.color);
    });
  };
}

function Cars(options, distortion) {
  let carLights = new CarLights(options, distortion);
  let movingLights = new MovingLights(options, distortion);
  let movingLights2 = new MovingLights(options, distortion, true);

  this.mesh = new THREE.Object3D();
  this.mesh.add(carLights.mesh);
  this.mesh.add(movingLights.mesh);
  this.mesh.add(movingLights2.mesh);

  this.update = function (time) {
    carLights.update(time);
    movingLights.update(time);
    movingLights2.update(time);
  };
}

function MovingLights(options, distortion, isMovingCloser) {
  const lanms = options.lanesPerRoad;
  const lightPairs = options.lightPairsPerRoadWay;
  const infos = [];
  for (let i = 0; i < lightPairs; i++) {
    const info = {
      z: Math.random() * options.length,
      lane: Math.floor(Math.random() * lanms),
      color: !isMovingCloser
        ? options.colors.leftCars[Math.floor(Math.random() * options.colors.leftCars.length)]
        : options.colors.rightCars[Math.floor(Math.random() * options.colors.rightCars.length)],
      speed: isMovingCloser
        ? Math.random() * (options.movingCloserSpeed[1] - options.movingCloserSpeed[0]) + options.movingCloserSpeed[0]
        : Math.random() * (options.movingAwaySpeed[1] - options.movingAwaySpeed[0]) + options.movingAwaySpeed[0],
      carWidth: Math.random() * (options.carWidthPercentage[1] - options.carWidthPercentage[0]) + options.carWidthPercentage[0],
      carShift: Math.random() * (options.carShiftX[1] - options.carShiftX[0]) + options.carShiftX[0],
      floorSeparation: Math.random() * (options.carFloorSeparation[1] - options.carFloorSeparation[0]) + options.carFloorSeparation[0]
    };
    infos.push(info);
  }

  const geo = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    color: 0xffffff
  });

  this.mesh = new THREE.Object3D();

  infos.forEach((info) => {
    let m = new THREE.Mesh(geo, material);
    m.info = info;
    this.mesh.add(m);
  });
  
  this.update = function (time) {
    this.mesh.children.forEach((m) => {
      m.info.z += m.info.speed * (1 / 60);

      if (isMovingCloser && m.info.z > options.length / 2) {
        m.info.z = -options.length / 2;
      } else if (!isMovingCloser && m.info.z < -options.length / 2) {
        m.info.z = options.length / 2;
      }
      
      let pos = distortion(m.info.z, time);
      
      let roadHalfWidth = options.roadWidth / 2;
      const laneWidth = roadHalfWidth / lanms;

      pos.x +=
        -roadHalfWidth +
        laneWidth * m.info.lane +
        laneWidth / 2 +
        m.info.carShift;

      pos.x *= isMovingCloser ? -1 : 1;
      
      m.position.set(pos.x, pos.y + m.info.floorSeparation, m.info.z);

      let carLength = Math.random() * (options.carLightsLength[1] - options.carLightsLength[0]) + options.carLightsLength[0];
      let carRadius = Math.random() * (options.carLightsRadius[1] - options.carLightsRadius[0]) + options.carLightsRadius[0];
      m.scale.set(carRadius, carRadius, carLength);

      m.material.color.set(m.info.color);
    });
  };
}

function LightSticks(options, isLeft) {
  let geometry = new THREE.PlaneGeometry(1, 1);
  let material = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    color: 0xffffff
  });

  this.mesh = new THREE.Object3D();

  for (let i = 0; i < options.totalSideLightSticks; i++) {
    let m = new THREE.Mesh(geometry, material);
    m.position.z = Math.random() * options.length;
    this.mesh.add(m);
  }

  this.update = function (time) {
    this.mesh.children.forEach((m) => {
      m.position.z -= 60 * (1 / 60);

      if (m.position.z < -options.length / 20) {
        m.position.z = options.length / 2;
      }
      
      const roadHalfWidth = options.roadWidth / 2;
      const stickWidth =
        Math.random() * (options.lightStickWidth[1] - options.lightStickWidth[0]) +
        options.lightStickWidth[0];
      const stickHeight =
        Math.random() * (options.lightStickHeight[1] - options.lightStickHeight[0]) +
        options.lightStickHeight[0];

      m.scale.set(stickWidth, stickHeight, 1);
      m.position.x = isLeft ? -roadHalfWidth - stickWidth : roadHalfWidth + stickWidth;
      
      m.material.color.set(options.colors.sticks);
    });
  };
}

export default Hyperspeed;
