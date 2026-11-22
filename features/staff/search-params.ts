type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Reads list params from the URL, falling back to defaults for anything unknown. */
export function readListParams<F extends string, S extends string>(
  params: Params,
  { filters, filter, sorts, sort }: { filters: readonly F[]; filter: F; sorts: readonly S[]; sort: S }
) {
  const f = first(params.filter) as F;
  const s = first(params.sort) as S;
  const page = Number.parseInt(first(params.page), 10);
  return {
    filter: filters.includes(f) ? f : filter,
    sort: sorts.includes(s) ? s : sort,
    q: first(params.q).slice(0, 100),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}
