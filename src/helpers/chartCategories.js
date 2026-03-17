/**
 * Chart category options for s-select (code + description label).
 */
export function formatCategorySelectOptions(categories) {
  return (categories || []).map((c) => ({
    ...c,
    label: `${c.accno} - ${c.description}`,
  }));
}

/**
 * Build POST body for /system/chart/accounts — drop read-only `categories`,
 * ensure `category_ids` is set.
 */
export function accountSavePayload(account) {
  const cats = account.categories;
  const payload = { ...account };
  delete payload.categories;
  if (!Array.isArray(payload.category_ids)) {
    payload.category_ids = (cats || []).map((c) => c.id);
  }
  return payload;
}
