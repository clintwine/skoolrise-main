/**
 * Adds school_tenant_id to a filter object for entity queries.
 * If school_tenant_id is null (superadmin), returns filterObject unchanged.
 * Otherwise merges { school_tenant_id } into the filter.
 *
 * @param {object} filterObject - existing filter fields
 * @param {string|null} school_tenant_id
 * @returns {object}
 */
export function addSchoolFilter(filterObject, school_tenant_id) {
  if (!school_tenant_id) return filterObject;
  return { ...filterObject, school_tenant_id };
}

/**
 * Adds school_tenant_id to a data object before creating an entity.
 * If school_tenant_id is null (superadmin), returns data unchanged.
 * Otherwise merges { school_tenant_id } into the data.
 *
 * @param {object} data - entity data to create
 * @param {string|null} school_tenant_id
 * @returns {object}
 */
export function withSchoolId(data, school_tenant_id) {
  if (!school_tenant_id) return data;
  return { ...data, school_tenant_id };
}