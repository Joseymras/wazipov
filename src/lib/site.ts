// Production domain for every QR code, share link and canonical URL. Override with VITE_SITE_URL.
export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || "https://wazevents.co.ke";

export const eventUrl = (code: string) => `${SITE_URL}/e/${code}`;
export const galleryUrl = (eventId: string) => `${SITE_URL}/events/${eventId}/gallery`;

export function whatsappText(eventName: string, url: string) {
  return `📸 Join the Wazi POV camera for ${eventName}.\n\nScan or open this link and add your photos to the shared gallery. No app needed:\n\n${url}`;
}
export const whatsappLink = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
