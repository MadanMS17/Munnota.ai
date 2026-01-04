import * as THREE from 'three';

export function turbulentDistortion(z, time) {
  let pos = new THREE.Vector3(0, 0, 0);
  let angle = (1 - Math.sin(z / 400 - time * 0.2)) * Math.PI;
  pos.y += Math.sin(angle) * 10;
  pos.x += Math.cos(angle) * 10;
  return pos;
}

export function mountainDistortion(z, time) {
  let pos = new THREE.Vector3(0, 0, 0);
  pos.y = Math.sin(z / 10 + time * 2) * 2;
  return pos;
}

export function longRaceDistortion(z, time) {
  let pos = new THREE.Vector3(0, 0, 0);
  let angle = Math.sin(z / 400) * Math.PI * 2;
  pos.y += Math.sin(angle) * 100;
  pos.x += Math.cos(angle) * 100;
  pos.z += Math.cos(angle) * 100;
  return pos;
}

export function xyDistortion(z, time) {
  let pos = new THREE.Vector3(0, 0, 0);
  let angle = Math.sin(z / 100 + time) * Math.PI * 2;
  pos.y += Math.sin(angle) * 10;
  pos.x += Math.cos(angle) * 10;
  return pos;
}

export function deepDistortion(z, time) {
  let pos = new THREE.Vector3(0, 0, 0);
  pos.y = Math.sin(z / 100 + time) * 10;
  pos.x = Math.sin(z / 100 + time) * 10;
  return pos;
}
