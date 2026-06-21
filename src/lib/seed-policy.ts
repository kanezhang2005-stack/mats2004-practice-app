type SeedQuestionBase = {
  prompt: string;
  imageUrl: string;
  type: "single_choice" | "multi_choice" | "numeric" | "text";
  options: unknown;
  unit: string | null;
};

export function buildSeedUpdateData(question: SeedQuestionBase) {
  return {
    prompt: question.prompt,
    imageUrl: question.imageUrl,
    type: question.type,
    options: question.options,
    unit: question.unit
  };
}
