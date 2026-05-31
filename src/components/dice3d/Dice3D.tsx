import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  value: number;
  rolling: boolean;
}

export default function Dice3D({ value, rolling, color }: Props & { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const rotationSpeed = useRef({
    x: 0,
    y: 0,
    z: 0,
  });

  useEffect(() => {
    if (rolling) {
      rotationSpeed.current = {
        x: Math.random() * 0.3,
        y: Math.random() * 0.3,
        z: Math.random() * 0.3,
      };
    } else {
      rotationSpeed.current = { x: 0, y: 0, z: 0 };

      if (meshRef.current) {
        // snap to face based on value
        const faceRotation: Record<number, [number, number, number]> = {
          1: [0, 0, 0],
          2: [0, Math.PI / 2, 0],
          3: [Math.PI / 2, 0, 0],
          4: [-Math.PI / 2, 0, 0],
          5: [0, -Math.PI / 2, 0],
          6: [Math.PI, 0, 0],
        };

        const rot = faceRotation[value] || [0, 0, 0];

        meshRef.current.rotation.set(...rot);
      }
    }
  }, [rolling, value]);

  useFrame(() => {
    if (!meshRef.current || !rolling) return;

    meshRef.current.rotation.x += rotationSpeed.current.x;
    meshRef.current.rotation.y += rotationSpeed.current.y;
    meshRef.current.rotation.z += rotationSpeed.current.z;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />

      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  );
}