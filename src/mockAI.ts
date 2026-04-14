export function generateIdea() {
  const ideas = [
    "3 AI tools creators must use",
    "Why your reels are not growing",
    "1 mistake killing your engagement",
    "Content strategy that works in 2026",
    "How to go viral with zero followers"
  ];
  return ideas[Math.floor(Math.random() * ideas.length)];
}

export function generateScript(idea: string) {
  return [
    `Hook: ${idea}`,
    "Explain the core idea quickly",
    "Give 1 actionable tip",
    "CTA: Follow for more"
  ];
}

export function generateCaption(idea: string) {
  return {
    caption: `${idea} — try this today and see results.`,
    tags: ["#contentcreator", "#growth", "#reels", "#viral", "#ai"]
  };
}

export function generateFullContent() {
  const idea = generateIdea();
  return {
    idea,
    script: generateScript(idea),
    ...generateCaption(idea)
  };
}
