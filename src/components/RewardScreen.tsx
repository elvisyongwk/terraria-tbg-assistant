import rewardsData from "../data/rewards.json";
import type { RewardDrop } from "../types/RewardDrop";

export default function RewardScreen({
  rewards,
  onContinue,
}: {
  rewards: RewardDrop[];
  onContinue: () => void;
}) {
  return (
    <div className="reward">
      <h2>Rewards</h2>

      {rewards.length === 0 ? (
        <p>No rewards</p>
      ) : (
        <ul>
          {rewards.map((reward) => {
            const rewardInfo =
              rewardsData[
                reward.id as keyof typeof rewardsData
              ];

            if (!rewardInfo) {
              return (
                <li key={reward.id}>
                  Unknown Reward ({reward.id}) ×{" "}
                  {reward.quantity}
                </li>
              );
            }

            return (
              <li key={reward.id}>
                <strong>
                  {rewardInfo.name}
                  {" × "}
                  {reward.quantity}
                </strong>

                <p>{rewardInfo.description}</p>
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