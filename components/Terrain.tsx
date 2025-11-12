import React, { useRef, useMemo, useCallback } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { type BrushSettings } from '../types';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface TerrainProps {
    brush: BrushSettings;
    controlsRef: React.RefObject<OrbitControlsImpl>;
}

const TERRAIN_SIZE = 100;
const TERRAIN_SEGMENTS = 128;

const Terrain: React.FC<TerrainProps> = ({ brush, controlsRef }) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const noise2D = useMemo(() => createNoise2D(), []);

    const geometry = useMemo(() => {
        const geom = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
        geom.rotateX(-Math.PI / 2);

        const positions = geom.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            const noiseVal = noise2D(vertex.x / 40, vertex.z / 40);
            positions.setY(i, noiseVal * 5);
        }

        geom.computeVertexNormals();
        return geom;
    }, [noise2D]);

    const modifyTerrain = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        if (!meshRef.current || !event.point) return;

        const geom = meshRef.current.geometry as THREE.BufferGeometry;
        const positions = geom.attributes.position as THREE.BufferAttribute;
        if (!positions) return;

        const intersectionPoint = event.point;
        const vertex = new THREE.Vector3();
        const brushSizeSq = brush.size * brush.size;

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);

            const dx = vertex.x - intersectionPoint.x;
            const dz = vertex.z - intersectionPoint.z;
            const distSq = dx * dx + dz * dz;

            if (distSq < brushSizeSq) {
                const falloff = (Math.cos((Math.sqrt(distSq) / brush.size) * Math.PI) + 1) / 2;
                const currentY = positions.getY(i);
                const displacement = brush.strength * falloff * (brush.direction === 'up' ? 1 : -1);
                positions.setY(i, currentY + displacement);
            }
        }

        positions.needsUpdate = true;
        geom.computeVertexNormals();

    }, [brush]);
    
    const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
        if (controlsRef.current) {
            controlsRef.current.enabled = false;
        }
        modifyTerrain(event);
    }, [controlsRef, modifyTerrain]);

    const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
        if (event.buttons === 1) { 
            modifyTerrain(event);
        }
    }, [modifyTerrain]);

    return (
        <mesh
            ref={meshRef}
            receiveShadow
            castShadow
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            geometry={geometry}
        >
            <meshStandardMaterial
                color="#557744"
                roughness={0.8}
                metalness={0.1}
            />
        </mesh>
    );
};

export default Terrain;