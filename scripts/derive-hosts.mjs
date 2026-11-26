/**
 * Derive hosts.json from catalog.json host rules.
 * Same rules as billing `deriveHostCatalog` (src/utils/catalog-seed/host-catalog.util.ts):
 * an offering is sold on a host when its settings.surfaces hit the host's surfaces and its
 * settings.platforms are not all excluded by the host. Apps consume this file;
 * billing-seed apply does not write it.
 *
 * @param {Record<string, unknown>} catalog
 * @returns {{ productCodes: string[], hosts: Record<string, { offeringCodes: string[], licensedPlatforms?: string[] }> }}
 */
export function deriveHostCatalog(catalog) {
	const products = isObject(catalog.products) ? catalog.products : {};
	const rules = isObject(catalog.hosts) ? catalog.hosts : {};
	/** @type {Record<string, { offeringCodes: string[], licensedPlatforms?: string[] }>} */
	const hosts = {};

	for (const [key, rule] of Object.entries(rules)) {
		hosts[key] = {
			offeringCodes: [],
			...(isObject(rule) && Array.isArray(rule.licensedPlatforms)
				? { licensedPlatforms: [...rule.licensedPlatforms] }
				: {}),
		};
	}

	for (const product of Object.values(products)) {
		const offerings =
			isObject(product) && isObject(product.offerings) ? product.offerings : {};
		for (const [offeringCode, offering] of Object.entries(offerings)) {
			if (!isObject(offering)) continue;
			for (const [hostKey, rule] of Object.entries(rules)) {
				const bucket = hosts[hostKey];
				if (bucket && offeringMatchesHost(offering, rule)) {
					pushUnique(bucket.offeringCodes, offeringCode);
				}
			}
		}
	}

	return { productCodes: Object.keys(products), hosts };
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isObject(value) {
	return value != null && typeof value === "object" && !Array.isArray(value);
}

/**
 * @param {string[]} list
 * @param {string} value
 */
function pushUnique(list, value) {
	if (!list.includes(value)) {
		list.push(value);
	}
}

/**
 * @param {unknown} offeringPlatforms
 * @param {unknown} excludePlatforms
 * @returns {boolean}
 */
function onlyExcludedPlatforms(offeringPlatforms, excludePlatforms) {
	if (!Array.isArray(excludePlatforms) || excludePlatforms.length === 0) {
		return false;
	}
	if (!Array.isArray(offeringPlatforms) || offeringPlatforms.length === 0) {
		return false;
	}
	return offeringPlatforms.every((platform) =>
		excludePlatforms.includes(platform),
	);
}

/**
 * @param {Record<string, any>} offering
 * @param {unknown} rule
 * @returns {boolean}
 */
function offeringMatchesHost(offering, rule) {
	if (!isObject(rule)) {
		return false;
	}
	const settings = isObject(offering.settings) ? offering.settings : {};
	const offeringSurfaces = Array.isArray(settings.surfaces)
		? settings.surfaces
		: [];
	const hostSurfaces = Array.isArray(rule.surfaces) ? rule.surfaces : [];
	const hitsSurface = hostSurfaces.some((surface) =>
		offeringSurfaces.includes(surface),
	);
	if (!hitsSurface) {
		return false;
	}
	return !onlyExcludedPlatforms(settings.platforms, rule.excludePlatforms);
}
