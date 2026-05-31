interface Props {
  hp: number;
  maxHp: number;
}

export default function EnemyHPBar({
  hp,
  maxHp,
}: Props) {
  const percent =
    (hp / maxHp) * 100;

  return (
    <div>
      <div className="hp-bar">
        <div
          className="hp-fill"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p>
        HP: {hp} / {maxHp}
      </p>
    </div>
  );
}