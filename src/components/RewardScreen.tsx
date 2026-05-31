import rewardsData from "../data/rewards.json";

export default function RewardScreen({
  rewards,
  onContinue,
}: {
  rewards: string[];
  onContinue: () => void;
}) {
  return (
    <div className="reward">
      <h2>Rewards</h2>

      {rewards.length === 0 ? (
        <p>No rewards</p>
      ) : (
        <ul>
          {rewards.map((id) => {
            const r =
              rewardsData[id as keyof typeof rewardsData];

            return (
              <li key={id}>
                <strong>{r.name}</strong>
                <p>{r.description}</p>
              </li>
            );
          })}
        </ul>
      )}

      <button onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}