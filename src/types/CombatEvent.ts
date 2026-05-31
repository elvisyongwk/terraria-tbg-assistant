export type CombatEvent =
    | {
        type: "roll";
        label: string;
        values: number[];
    }
    | {
        type: "damage";
        label: string;
        value: number;
    }
    | {
        type: "state";
        label: string;
    };