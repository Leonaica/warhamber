import { useMemo } from 'react';
import { useCharacter } from './useCharacter';
import type { TagResolveContext } from '../types/character';

export function useTagResolveContext(): TagResolveContext {
  const c = useCharacter();
  return useMemo(() => ({
    attributeDiePools: c.attributeDiePools,
    immaterialSize: c.immaterialSize,
    size: c.size,
    surge: c.computedCharacter.surge,
    stuff: c.computedCharacter.stuff,
  }), [c.attributeDiePools, c.immaterialSize, c.size, c.computedCharacter]);
}