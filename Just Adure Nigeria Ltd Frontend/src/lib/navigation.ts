"use client";

import { useEffect, useState } from "react";

export function getCurrentPath() {
  return typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`;
}

export function usePath(initialPath = "/") {
  const [path, setPath] = useState(initialPath);

  useEffect(() => {
    const updatePath = () => setPath(getCurrentPath());
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  return path;
}