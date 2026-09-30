/**
 * Alati samo za razvoj — ekrani `/dev-*`. `__DEV__` je false u release bildu,
 * pa ih tamo nema.
 *
 * Test prekidac Placen/Besplatan (override prava pristupa u profilu) je uklonjen
 * 29.9.2026 (Ivan: "ne treba mi"). Premium za proveru se daje poklonom:
 * `select admin.daj_premium('email', do_datuma)` (`supabase/pokloni.sql`).
 */
export const DEV_TOOLS_ENABLED = __DEV__;
