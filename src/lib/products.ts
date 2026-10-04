export function getProductImage(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('dispenser') || lower.includes('refill')) {
    return require('../../assets/images/products/dispenser-refill.jpg');
  }
  if (
    lower.includes('table water') ||
    lower.includes('bottled') ||
    (lower.includes('pack') && !lower.includes('bag'))
  ) {
    return require('../../assets/images/products/bottled-water-pack.jpg');
  }
  return require('../../assets/images/products/sachet-water-bag.jpg');
}

export function getProductBadge(name: string): string | null {
  if (name.includes('5-bag')) return 'Popular';
  if (name.includes('10-bag')) return 'Best Value';
  if (name.includes('20-bag')) return 'Bulk Tier';
  if (name.includes('Dispenser')) return '20L Standard';
  return null;
}
