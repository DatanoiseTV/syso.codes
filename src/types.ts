export type Category =
  | "audio-server"
  | "audio-app"
  | "embedded"
  | "fpga"
  | "linux-audio"
  | "ai-tools"
  | "dev-tools";

export type ArtType =
  | "chip"
  | "fpga"
  | "optical"
  | "clock"
  | "bus"
  | "network"
  | "terminal"
  | "scope"
  | "tdm"
  | "eurorack"
  | "wavetable"
  | "location"
  | "midi"
  | "visual"
  | "logo"
  | "auto";

export interface Project {
  /** repo name on github */
  slug: string;
  /** display name */
  name: string;
  /** one-line tagline */
  tagline: string;
  /** longer descriptive blurb (1-2 sentences) */
  description: string;
  /** the story / motivation behind the project (1-2 short paragraphs) */
  story?: string;
  /** key bullet-point specs */
  specs?: string[];
  /** category — used for filtering */
  category: Category;
  /** primary language */
  language: string;
  /** stars on github */
  stars: number;
  /** github topics */
  topics: string[];
  /** repo URL */
  url: string;
  /** screenshot URL — if missing, falls back to vector art */
  image?: string;
  /** which SVG illustration to render when there is no image */
  art?: ArtType;
  /** featured projects render larger and earlier */
  featured?: boolean;
  /** ISO date string of last push, used for sorting */
  pushedAt?: string;
}
