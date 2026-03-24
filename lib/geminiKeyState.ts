// lib/geminiKeyState.ts
export const apiKeyLabels = [
    "K-0", "K-1", "K-2", "K-3", "K-4", "K-5", "K-6", "K-7",
    "K-8", "K-9", "K-10", "K-11", "K-12", "K-13", "K-14", "K-15"
];

export let currentKeyIndex = Math.floor(
    Math.random() * apiKeyLabels.length
);

export const rotateKey = () => {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeyLabels.length;
    return currentKeyIndex;
};
