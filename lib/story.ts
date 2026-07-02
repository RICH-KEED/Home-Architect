export type StoryChapter = {
  start: number;
  end: number;
  eyebrow: string;
  title: string;
};

export const STORY_CHAPTERS: StoryChapter[] = [
  { start: 1, end: 150, eyebrow: "Blueprint", title: "Every dream\nstarts with an idea." },
  { start: 150, end: 350, eyebrow: "Wireframe", title: "Ideas\nbecome blueprints." },
  { start: 350, end: 650, eyebrow: "Foundation", title: "Blueprints\nbecome structure." },
  { start: 650, end: 900, eyebrow: "Steel Structure", title: "Structure\nbecomes reality." },
  { start: 900, end: 1150, eyebrow: "Building Shell", title: "Luxury\nis crafted." },
  { start: 1150, end: 1200, eyebrow: "Finished Luxury Villa", title: "Welcome Home." },
];
