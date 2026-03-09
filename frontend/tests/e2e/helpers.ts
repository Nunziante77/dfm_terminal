import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// ── Real entities confirmed from live API ────────────────────────────────────
export const ENTITIES = {
  thrustme: {
    id: "DFM-CMP-FR-ThrustMe",
    name: "ThrustMe",
    searchTerm: "ThrustMe",
  },
  aim: {
    id: "DFM-CMP-DE-AIM-Infrarot-Module-GmbH",
    name: "AIM Infrarot-Module GmbH",
    searchTerm: "AIM Infrarot",
  },
  saft: {
    id: "DFM-CMP-FR-Saft-Groupe",
    name: "Saft Groupe S.A.S.",
    searchTerm: "Saft",
  },
  compliance: {
    id: "DFM-CMP--Vesicles",
    name: "Vesicles",
    searchTerm: "Vesicles",
  },
};

/**
 * Wait for the loading spinner to disappear and assert rows are present.
 * The app shows "LOADING…" while fetching, then renders table rows.
 */
export async function waitForTableRows(page: Page, minRows = 1) {
  // Wait for the loading pulse to disappear (if it appeared)
  await page.waitForFunction(
    () => !document.querySelector(".animate-pulse"),
    { timeout: 20_000 }
  ).catch(() => {
    // If no loading pulse ever appeared, that's fine — data was instant
  });

  const rows = page.locator("tbody tr");
  await expect(rows.first()).toBeVisible({ timeout: 20_000 });
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(minRows);
  return count;
}

/**
 * Use the EntityPicker component to search for and select an entity by name.
 * The picker requires ≥2 chars, shows a dropdown, selects via mousedown.
 */
export async function pickEntity(page: Page, searchTerm: string, entityName: string) {
  const pickerInput = page.locator('input[placeholder="Search entity by name…"]').last();
  await pickerInput.fill(searchTerm);
  // Wait for dropdown result containing the entity name
  const dropdownItem = page.locator(`button:has-text("${entityName}")`).first();
  await expect(dropdownItem).toBeVisible({ timeout: 15_000 });
  await dropdownItem.dispatchEvent("mousedown");
  // Verify chip appears
  const chip = page.locator(`span:has-text("${entityName}")`).first();
  await expect(chip).toBeVisible({ timeout: 8_000 });
}
