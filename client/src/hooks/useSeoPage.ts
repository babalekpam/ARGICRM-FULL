import { useEffect } from "react";

export function useSeoPage(title: string, description?: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;

    let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prevDesc = descTag?.getAttribute("content") ?? "";
    if (description && descTag) descTag.setAttribute("content", description);

    return () => {
      document.title = prev;
      if (descTag && prevDesc) descTag.setAttribute("content", prevDesc);
    };
  }, [title, description]);
}
