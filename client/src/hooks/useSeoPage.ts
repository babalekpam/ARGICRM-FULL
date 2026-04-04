import { useLayoutEffect } from "react";

// Module-level flag: true while any page-specific title is mounted.
// WhiteLabelContext reads this before overriding the document title.
let _pageSpecificActive = false;

export function isPageSpecificTitleActive(): boolean {
  return _pageSpecificActive;
}

export function useSeoPage(title: string, description?: string) {
  useLayoutEffect(() => {
    _pageSpecificActive = true;

    // Title
    document.title = title;

    // Primary meta description
    const descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (description && descTag) descTag.setAttribute("content", description);

    // OG / Twitter mirrors
    const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    if (ogTitle) ogTitle.setAttribute("content", title);

    const twTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement | null;
    if (twTitle) twTitle.setAttribute("content", title);

    if (description) {
      const ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
      if (ogDesc) ogDesc.setAttribute("content", description);

      const twDesc = document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement | null;
      if (twDesc) twDesc.setAttribute("content", description);
    }

    return () => {
      _pageSpecificActive = false;
    };
  }, [title, description]);
}
