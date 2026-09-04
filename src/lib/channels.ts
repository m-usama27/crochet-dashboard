// Canonical list of sales channels for orders.
// Channel values are free-form strings in the DB; keep them consistent here.

export const CHANNELS: { value: string; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'in-person', label: 'In-person' },
  { value: 'website', label: 'Website' },
  { value: 'food-story', label: 'Food Story' },
];

export const ALL_CHANNELS = 'all';

export function channelLabel(value?: string | null): string {
  if (!value || value === ALL_CHANNELS) return 'All channels';
  return CHANNELS.find((c) => c.value === value)?.label || value;
}