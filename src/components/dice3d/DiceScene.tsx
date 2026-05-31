import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Dice3D from "./Dice3D";

export default function DiceScene({
  values,
  rolling,
  role
}: {
  values: number[];
  rolling: boolean;
  role?: "player" | "enemy";
}) {
  return (
    <div style={{ height: 200 }}>
      <Canvas camera={{ position: [0, 2, 4] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 3, 3]} />

        <OrbitControls enableZoom={false} />

        {values.map((v, i) => (
          <group
            key={i}
            position={[
              (i - values.length / 2) * 1.5,
              0,
              0,
            ]}
          >
            <Dice3D value={v} rolling={rolling} color={role === "player" ? "blue" : "red"} />
          </group>
        ))}
      </Canvas>
    </div>
  );
}