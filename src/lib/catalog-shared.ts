// Values shared by server and client catalogue code.
export const SORTS = ["recommended", "newest", "price-asc", "price-desc", "popular"] as const;
export type Sort = (typeof SORTS)[number];
