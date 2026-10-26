// Garde uniquement la réponse finale de Gemma.
// Les parties marquées thought: true sont le raisonnement interne : elles ne doivent
// jamais atteindre le navigateur ni être lues comme du JSON.
export function extractFinalText(apiResponse) {
  const parts = apiResponse?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p) => p && p.thought !== true && typeof p.text === "string")
    .map((p) => p.text)
    .join("")
    .trim();
}
