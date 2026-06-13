import { describe, it, expect } from 'vitest';

const pickRandom = (items: any[]) => {
  if (items.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
};

describe('Random Selection Logic', () => {
  it('should pick a random item from a list', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = pickRandom(items);
    expect(items).toContain(result);
  });

  it('should return null for empty list', () => {
    expect(pickRandom([])).toBeNull();
  });

  it('should pick the only item if list has one element', () => {
    const items = [{ id: 1 }];
    expect(pickRandom(items)).toEqual({ id: 1 });
  });
});
