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

export default async function Page({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  return <App initialPath={`/${searchParamsToQuery(resolvedSearchParams)}`} />;
}