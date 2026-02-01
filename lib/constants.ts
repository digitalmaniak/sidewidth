export const CATEGORIES = [
    "POLITICS",
    "SPORTS",
    "ENTERTAINMENT",
    "GAMING",
    "TECHNOLOGY",
    "FOOD",
    "PHILOSOPHY",
    "OTHER"
] as const;

export type Category = typeof CATEGORIES[number];
