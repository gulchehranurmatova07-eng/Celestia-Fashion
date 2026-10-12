// Body measurements in centimetres for each size chart used by the catalogue.
export const SIZE_GUIDE = {
  tops: {
    columns: ["size", "chest", "waist"] as const,
    rows: [
      ["S", "88–94", "76–82"],
      ["M", "94–100", "82–88"],
      ["L", "100–106", "88–94"],
      ["XL", "106–112", "94–100"],
    ],
  },
  tailoring: {
    columns: ["euSize", "chest", "waist"] as const,
    rows: [
      ["46", "92", "80"],
      ["48", "96", "84"],
      ["50", "100", "88"],
      ["52", "104", "92"],
      ["54", "108", "96"],
    ],
  },
  trousers: {
    columns: ["size", "waist", "hips", "inseam"] as const,
    rows: [
      ["30", "76", "94", "82"],
      ["31", "79", "96", "82"],
      ["32", "81", "98", "82"],
      ["33", "84", "100", "83"],
      ["34", "86", "102", "83"],
      ["36", "91", "106", "83"],
    ],
  },
  shoes: {
    columns: ["euSize", "footLength"] as const,
    rows: [
      ["40", "25.5"],
      ["41", "26.2"],
      ["42", "26.9"],
      ["43", "27.5"],
      ["44", "28.2"],
      ["45", "28.9"],
    ],
  },
} as const;

export type SizeChartKey = keyof typeof SIZE_GUIDE;
export function hasSizeGuide(chart: string): chart is SizeChartKey {
  return chart in SIZE_GUIDE;
}
