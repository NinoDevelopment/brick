export const MEDIA_ENTITIES = ["items", "gallery", "categories"] as const;

export type MediaEntity = (typeof MEDIA_ENTITIES)[number];

export const MEDIA_MAX_SIDE = 1600;
export const MEDIA_WEBP_QUALITY = 80;
export const MEDIA_CACHE_CONTROL = "public, max-age=604800";
export const MEDIA_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MEDIA_MAX_FILES = 20;
