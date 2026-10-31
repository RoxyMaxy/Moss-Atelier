// js/query.js - Deterministic query builders for live search (Shopping & YouTube)

import { removeAccents } from './retrieve.js';

export function buildShoppingQuery(traits = [], occasion = '') {
  const topTrait = (traits[0] || '').trim();
  const cleanOccasion = (occasion || '').trim();

  const parts = [];
  if (topTrait) parts.push(removeAccents(topTrait));
  if (cleanOccasion) parts.push(removeAccents(cleanOccasion));
  parts.push('gift');

  return parts.join(' ');
}

export function buildYouTubeQuery(diyTitle = '', trait = '') {
  const cleanTrait = removeAccents((trait || '').trim());
  const cleanTitle = removeAccents((diyTitle || '').trim());

  if (cleanTitle) {
    return `${cleanTitle} tutorial`;
  }
  return `DIY ${cleanTrait || 'craft'} tutorial`;
}
