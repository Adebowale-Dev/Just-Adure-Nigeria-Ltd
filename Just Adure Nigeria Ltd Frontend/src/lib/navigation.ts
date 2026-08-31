"use client";

import { useEffect, useState } from "react";

export function getCurrentPath() {
  return typeof window === "undefined" ? "/" : window.location.pathname + window.location.search;
}

export function usePath(initialPath = "/") {
  const [path, setPath] = useState(initialPath);

  useEffect(() => {
    const updatePath = () => setPath(getCurrentPath());
    updatePath();
    window.addEventListener("popstate", updatePath);
    window.addEventListener("pushstate", updatePath);
    window.addEventListener("replacestate", updatePath);
    return () => {
      window.removeEventListener("popstate", updatePath);
      window.removeEventListener("pushstate", updatePath);
      window.removeEventListener("replacestate", updatePath);
    };
  }, []);

  return path;
}
