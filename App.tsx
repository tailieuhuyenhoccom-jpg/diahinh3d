import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Terrain from './components/Terrain';
import { type BrushSettings, type BrushDirection } from './types';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// Helper component for UI controls
const ControlSlider: React.FC<{ name: string; label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min: number; max: number; step: number; }> = ({ name, label, value, onChange, min, max, step }) => (
    <div className="flex flex-col items-center space-y-1">
        <label htmlFor={name} className="text-xs font-medium text-gray-300">
            {label}: {value.toFixed(2)}
        </label>
        <input
            id={name}
            name={name}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-32 md:w-48 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);


const App: React.FC = () => {
    const [brush, setBrush] = useState<BrushSettings>({
        size: 5,
        strength: 0.5,
        direction: 'up',
    });
    const [terrainKey, setTerrainKey] = useState(0);
    const controlsRef = useRef<OrbitControlsImpl>(null!);

    useEffect(() => {
        const handlePointerUp = () => {
            if (controlsRef.current && !controlsRef.current.enabled) {
                controlsRef.current.enabled = true;
            }
        };

        // We listen on the window to catch pointer up events even if they happen outside the canvas
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, []);

    const handleBrushChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBrush(prev => ({ ...prev, [name]: parseFloat(value) }));
    }, []);

    const setDirection = (direction: BrushDirection) => {
        setBrush(prev => ({ ...prev, direction }));
    };

    const resetTerrain = () => {
        setTerrainKey(prevKey => prevKey + 1);
    };

    const handleZoom = (direction: 'in' | 'out') => {
        const controls = controlsRef.current;
        if (controls) {
            const camera = controls.object;
            const target = controls.target;
            const factor = direction === 'in' ? 0.8 : 1.2;

            // Calculate new position by moving along the vector from target to camera
            const directionVec = new THREE.Vector3().subVectors(camera.position, target);
            directionVec.multiplyScalar(factor);
            const newPosition = new THREE.Vector3().addVectors(target, directionVec);

            // Check against min/max distance constraints
            const dist = newPosition.distanceTo(target);
            if (dist >= controls.minDistance && dist <= controls.maxDistance) {
                // Apply the new position to the camera
                camera.position.copy(newPosition);
                // Tell the controls to update its internal state
                controls.update();
            }
        }
    };

    return (
        <div className="w-screen h-screen bg-gray-900 text-white">
            <div className="absolute top-0 left-0 z-10 p-4 w-full flex justify-center">
                 <h1 className="text-2xl md:text-3xl font-bold text-center bg-black bg-opacity-30 px-4 py-2 rounded-lg">Địa Hình 3D Tương Tác</h1>
            </div>
            <Canvas
                camera={{ position: [25, 25, 25], fov: 50 }}
                shadows
            >
                <ambientLight intensity={0.2} />
                <directionalLight
                    position={[40, 40, 20]}
                    intensity={1.5}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                <OrbitControls 
                  ref={controlsRef}
                  enablePan={true} 
                  enableZoom={true} 
                  enableRotate={true}
                  minDistance={10}
                  maxDistance={100}
                />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Terrain key={terrainKey} brush={brush} controlsRef={controlsRef} />
            </Canvas>
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex justify-center">
                <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 md:gap-6 shadow-lg">
                    <div className="flex items-center gap-4">
                        <ControlSlider name="size" label="Kích thước" value={brush.size} onChange={handleBrushChange} min={1} max={15} step={0.5} />
                        <ControlSlider name="strength" label="Sức mạnh" value={brush.strength} onChange={handleBrushChange} min={0.1} max={2} step={0.1} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDirection('up')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${brush.direction === 'up' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                           Nâng Lên
                        </button>
                        <button
                            onClick={() => setDirection('down')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${brush.direction === 'down' ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            Hạ Xuống
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleZoom('in')}
                            className="px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-gray-700 hover:bg-gray-600"
                        >
                           Nhìn Gần
                        </button>
                        <button
                            onClick={() => handleZoom('out')}
                            className="px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-gray-700 hover:bg-gray-600"
                        >
                            Nhìn Xa
                        </button>
                    </div>
                    <button
                        onClick={resetTerrain}
                        className="px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-green-700 hover:bg-green-600"
                    >
                        Tái tạo
                    </button>
                </div>
            </div>
             <div className="absolute bottom-24 md:bottom-28 left-0 right-0 z-10 text-center text-gray-400 text-sm pointer-events-none">
                <p>Kéo chuột để xoay. Nhấn và kéo trên địa hình để thay đổi.</p>
            </div>
            <div className="absolute bottom-4 right-4 z-10 text-gray-500 text-xs">
                <p>Phát triển bởi Nguyễn Thành Đạt</p>
            </div>
        </div>
    );
};

export default App;