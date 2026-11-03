import type { RatingValue } from '../types/character';

/**
 * Default rating applied to every aspect and function at a given campaign
 * limit. Shared by the builder's initial values and the attribute importer, so
 * both start from the same place.
 */
export function getDefaultRating(campaignLimit: number): RatingValue {
  if (campaignLimit > -1) return 0;
  if (campaignLimit > -41) return -5;
  if (campaignLimit > -81) return -10;
  return -15;
}
