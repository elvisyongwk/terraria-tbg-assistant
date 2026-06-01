interface Props {
    type: "D4" | "D6" | "D8" | "D12" | "D20";
    size?: number;
}

export default function DiceIcon({
    type,
    size = 60,
}: Props) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 100 100",
    };

    switch (type) {
        case "D4":
            return (
                <svg {...common}>
                    <polygon
                        points="50,10 90,85 10,85"
                        fill="currentColor"
                    />
                    <text
                        x="50"
                        y="55"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="24"
                        fontWeight="bold"
                    >
                        4
                    </text>
                </svg>
            );

        case "D6":
            return (
                <svg {...common}>
                    <rect
                        x="15"
                        y="15"
                        width="70"
                        height="70"
                        fill="currentColor"
                        rx="8"
                    />
                    <text
                        x="50"
                        y="55"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="24"
                        fontWeight="bold"
                    >
                        6
                    </text>
                </svg>
            );

        case "D8":
            return (
                <svg {...common}>
                    <polygon
                        points="50,5 90,50 50,95 10,50"
                        fill="currentColor"
                    />
                    <text
                        x="50"
                        y="55"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="24"
                        fontWeight="bold"
                    >
                        8
                    </text>
                </svg>
            );

        case "D12":
            return (
                <svg {...common}>
                    <polygon
                        points="
              50,5
              75,15
              92,38
              92,62
              75,85
              50,95
              25,85
              8,62
              8,38
              25,15
            "
                        fill="currentColor"
                    />
                    <text
                        x="50"
                        y="55"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="24"
                        fontWeight="bold"
                    >
                        12
                    </text>
                </svg>
            );

        case "D20":
            return (
                <svg {...common}>
                    <polygon
                        points="
              50,5
              80,20
              95,50
              80,80
              50,95
              20,80
              5,50
              20,20
            "
                        fill="currentColor"
                    />
                    <text
                        x="50"
                        y="55"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="24"
                        fontWeight="bold"
                    >
                        20
                    </text>
                </svg>
            );

        default:
            return null;
    }
}