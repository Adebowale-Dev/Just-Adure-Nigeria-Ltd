import App from "@/App";

function searchParamsToQuery(searchParams = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)));
    else if (value !== undefined) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export default async function CatchAllPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug.join("/") : "";
  return <App initialPath={`/${slug}${searchParamsToQuery(resolvedSearchParams)}`} />;
}