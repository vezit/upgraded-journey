export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export const pageview = (url: string) => {
  if (!GA_ID) return;
  (window as any).gtag('config', GA_ID, { page_path: url });
};

export const event = ({ action, category, label, value }: { action: string; category: string; label: string; value: number; }) => {
  if (!GA_ID) return;
  (window as any).gtag('event', action, { event_category: category, event_label: label, value });
};
