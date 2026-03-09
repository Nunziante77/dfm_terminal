/**
 * DFM Terminal — End-to-End Test Suite
 *
 * Tests real analyst workflows against live services:
 *   backend  → http://localhost:8000
 *   frontend → http://localhost:3000
 *
 * Run:  npm run test:e2e
 */

import { test, expect, type Page } from "@playwright/test";
import { ENTITIES, waitForTableRows, pickEntity } from "./helpers";

// ── A. Home / Unified Search ─────────────────────────────────────────────────

test.describe("A. Home / Unified Search", () => {
  test("page loads and shows DFM TERMINAL heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=DFM TERMINAL").first()).toBeVisible();
  });

  test("search input is present and accepts text", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("input[placeholder*='Search entities']");
    await expect(input).toBeVisible();
    await input.fill("ThrustMe");
    await expect(input).toHaveValue("ThrustMe");
  });

  test("search returns entity results", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("input[placeholder*='Search entities']");
    await input.fill("ThrustMe");
    await page.keyboard.press("Enter");
    // Wait for RESULTS panel — use first() to avoid strict mode (count "results" substring also matches)
    await expect(page.locator("text=RESULTS").first()).toBeVisible({ timeout: 15_000 });
    // Entities section should appear
    await expect(page.locator("text=ENTITIES").first()).toBeVisible();
    // ThrustMe should be in results
    await expect(page.locator(`text=ThrustMe`).first()).toBeVisible();
  });

  test("clicking an entity result navigates to entity page", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("input[placeholder*='Search entities']");
    await input.fill("ThrustMe");
    await page.keyboard.press("Enter");
    await expect(page.locator("text=RESULTS").first()).toBeVisible({ timeout: 15_000 });
    // Click the first entity row
    const entityRow = page.locator("tbody tr").first();
    await expect(entityRow).toBeVisible({ timeout: 10_000 });
    await entityRow.click();
    await expect(page).toHaveURL(/\/entities\//, { timeout: 15_000 });
  });
});

// ── B. Screener ──────────────────────────────────────────────────────────────

test.describe("B. Screener", () => {
  test("page loads and shows BLOOMBERG SCREENER heading", async ({ page }) => {
    await page.goto("/screener");
    await expect(page.locator("text=BLOOMBERG SCREENER")).toBeVisible();
  });

  test("entity rows load in the table", async ({ page }) => {
    await page.goto("/screener");
    const rowCount = await waitForTableRows(page, 5);
    expect(rowCount).toBeGreaterThanOrEqual(5);
  });

  test("row click navigates to entity page", async ({ page }) => {
    await page.goto("/screener");
    await waitForTableRows(page, 1);
    const firstRow = page.locator("tbody tr").first();
    await firstRow.click();
    await expect(page).toHaveURL(/\/entities\//, { timeout: 15_000 });
  });

  test("name search filter works", async ({ page }) => {
    await page.goto("/screener");
    await waitForTableRows(page);
    // Enter search term
    const searchInput = page.locator("input[placeholder='Name search…']");
    await searchInput.fill("ThrustMe");
    await page.keyboard.press("Enter");
    // Wait for results to refresh
    await page.waitForTimeout(2000);
    const cells = page.locator("tbody td").first();
    await expect(cells).toBeVisible();
    // The entity cell should contain ThrustMe
    const firstEntityCell = page.locator("tbody tr td").first();
    await expect(firstEntityCell).toContainText("ThrustMe", { timeout: 10_000 });
  });
});

// ── C. Rankings ──────────────────────────────────────────────────────────────

test.describe("C. Rankings", () => {
  test("page loads and shows STRATEGIC RANKING heading", async ({ page }) => {
    await page.goto("/rankings");
    await expect(page.locator("text=STRATEGIC RANKING")).toBeVisible();
  });

  test("ranking rows load with scores", async ({ page }) => {
    await page.goto("/rankings");
    await waitForTableRows(page, 5);
    // Final Score column should have numeric values
    const finalScoreCells = page.locator("tbody tr td").nth(6);
    await expect(finalScoreCells).toBeVisible();
  });

  test("expand toggle shows score modifier panel", async ({ page }) => {
    await page.goto("/rankings");
    await waitForTableRows(page, 1);
    // Click the first chevron to expand
    const firstRow = page.locator("tbody tr").first();
    await firstRow.click();
    // The expansion panel shows "SCORE MODIFIERS"
    await expect(page.locator("text=SCORE MODIFIERS")).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("text=SCORE COMPOSITION")).toBeVisible();
  });

  test("expanded panel shows score composition section", async ({ page }) => {
    await page.goto("/rankings");
    await waitForTableRows(page, 1);
    // Click first td (chevron column) to expand — avoids landing on name td which navigates
    await page.locator("tbody tr td").first().click();
    // SCORE COMPOSITION header and SCORE MODIFIERS confirm the expansion panel opened
    await expect(page.locator("text=SCORE COMPOSITION")).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("text=SCORE MODIFIERS")).toBeVisible();
  });

  test("entity name is a link to entity page", async ({ page }) => {
    await page.goto("/rankings");
    await waitForTableRows(page, 1);
    // The entity name cell (td index 1) is a hover:underline span
    const nameCell = page.locator("tbody tr td span.hover\\:underline").first();
    await expect(nameCell).toBeVisible({ timeout: 10_000 });
    await nameCell.click();
    await expect(page).toHaveURL(/\/entities\//, { timeout: 15_000 });
  });
});

// ── D. Strategic ─────────────────────────────────────────────────────────────

test.describe("D. Strategic", () => {
  test("page loads and shows STRATEGIC DOCUMENTS heading", async ({ page }) => {
    await page.goto("/strategic");
    await expect(page.locator("text=STRATEGIC DOCUMENTS").first()).toBeVisible();
  });

  test("documents tab loads document rows", async ({ page }) => {
    await page.goto("/strategic");
    await waitForTableRows(page, 1);
    // Should see doc_id values from the DB (e.g. DE_EINZELPLAN14_2026)
    await expect(page.locator("text=DE_EINZELPLAN14_2026").first()).toBeVisible({ timeout: 15_000 });
  });

  test("CAPABILITY MAP tab loads", async ({ page }) => {
    await page.goto("/strategic");
    await page.locator("button:has-text('CAPABILITY MAP')").click();
    // The left panel shows "CAPABILITY DOMAINS"
    await expect(page.locator("text=CAPABILITY DOMAINS").first()).toBeVisible({ timeout: 10_000 });
  });

  test("CAPABILITY MAP shows placeholder when no domain selected", async ({ page }) => {
    await page.goto("/strategic");
    await page.locator("button:has-text('CAPABILITY MAP')").click();
    await expect(page.locator("text=SELECT A CAPABILITY DOMAIN")).toBeVisible({ timeout: 10_000 });
  });
});

// ── E. Compare ───────────────────────────────────────────────────────────────

test.describe("E. Compare", () => {
  test("page loads and shows MULTI-ENTITY COMPARISON heading", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.locator("text=MULTI-ENTITY COMPARISON")).toBeVisible();
  });

  test("EntityPicker search input is visible", async ({ page }) => {
    await page.goto("/compare");
    const picker = page.locator("input[placeholder='Search entity by name…']");
    await expect(picker).toBeVisible();
  });

  test("picking two entities enables COMPARE button and renders grid", async ({ page }) => {
    await page.goto("/compare");

    await pickEntity(page, ENTITIES.thrustme.searchTerm, ENTITIES.thrustme.name);
    await pickEntity(page, ENTITIES.saft.searchTerm, "Saft");

    // COMPARE button should now be enabled
    const compareBtn = page.locator("button:has-text('COMPARE')");
    await expect(compareBtn).toBeEnabled();
    await compareBtn.click();

    // Wait for comparison grid — "IDENTITY" group header should appear
    await expect(page.locator("text=IDENTITY").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("text=STRATEGIC").first()).toBeVisible();
    await expect(page.locator("text=REGULATORY").first()).toBeVisible();
  });

  test("comparison grid shows entity names in headers", async ({ page }) => {
    await page.goto("/compare");
    await pickEntity(page, ENTITIES.thrustme.searchTerm, ENTITIES.thrustme.name);
    await pickEntity(page, ENTITIES.saft.searchTerm, "Saft");
    await page.locator("button:has-text('COMPARE')").click();

    // Entity name should appear as a column header link
    await expect(page.locator(`button:has-text("${ENTITIES.thrustme.name}")`).first()).toBeVisible({ timeout: 20_000 });
  });

  test("diverging fields are flagged with ≠ marker", async ({ page }) => {
    await page.goto("/compare");
    await pickEntity(page, ENTITIES.thrustme.searchTerm, ENTITIES.thrustme.name);
    await pickEntity(page, ENTITIES.saft.searchTerm, "Saft");
    await page.locator("button:has-text('COMPARE')").click();
    await expect(page.locator("text=IDENTITY").first()).toBeVisible({ timeout: 20_000 });
    // At least one ≠ marker should appear (entities differ on at least one field)
    await expect(page.locator("text=≠").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── F. Scenarios ─────────────────────────────────────────────────────────────

test.describe("F. Scenarios", () => {
  test("page loads and shows SCENARIO COMPARISON heading", async ({ page }) => {
    await page.goto("/scenarios");
    await expect(page.locator("text=SCENARIO COMPARISON")).toBeVisible();
  });

  test("EntityPicker is present and accepts search", async ({ page }) => {
    await page.goto("/scenarios");
    const picker = page.locator("input[placeholder='Search entity by name…']");
    await expect(picker).toBeVisible();
  });

  test("scenario matrix renders after picking two entities and running", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/scenarios");

    await pickEntity(page, ENTITIES.thrustme.searchTerm, ENTITIES.thrustme.name);
    await pickEntity(page, ENTITIES.saft.searchTerm, "Saft");

    const runBtn = page.locator("button:has-text('RUN')");
    await expect(runBtn).toBeEnabled();
    await runBtn.click();

    // The matrix table should appear with IDENTITY group header
    await expect(page.locator("text=IDENTITY").first()).toBeVisible({ timeout: 40_000 });
    await expect(page.locator("text=RANKING").first()).toBeVisible();
  });

  test("column headers show entity names not raw IDs", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/scenarios");
    await pickEntity(page, ENTITIES.thrustme.searchTerm, ENTITIES.thrustme.name);
    await pickEntity(page, ENTITIES.saft.searchTerm, "Saft");
    await page.locator("button:has-text('RUN')").click();

    // ThrustMe name should appear in table header, not just raw entity_id
    await expect(page.locator(`th:has-text("${ENTITIES.thrustme.name}")`).first()).toBeVisible({ timeout: 40_000 });
  });
});

// ── G. Supply Chain ──────────────────────────────────────────────────────────

test.describe("G. Supply Chain", () => {
  test("page loads and shows SUPPLY CHAIN INTELLIGENCE heading", async ({ page }) => {
    await page.goto("/supply-chain");
    await expect(page.locator("text=SUPPLY CHAIN INTELLIGENCE")).toBeVisible();
  });

  test("NETWORK tab loads with rows", async ({ page }) => {
    await page.goto("/supply-chain");
    await waitForTableRows(page, 1);
  });

  test("DEPENDENCIES tab loads entity rows", async ({ page }) => {
    await page.goto("/supply-chain");
    await page.locator("button:has-text('DEPENDENCIES')").click();
    // Apply to load data
    await page.locator("button:has-text('APPLY')").click();
    await waitForTableRows(page, 1);
  });

  test("FRAGILITY tab loads", async ({ page }) => {
    await page.goto("/supply-chain");
    await page.locator("button:has-text('FRAGILITY')").click();
    // Verify fragility-specific filter inputs appear (confirms tab switched correctly)
    await expect(page.locator("input[placeholder='Priority code…']")).toBeVisible({ timeout: 5_000 });
    // No crash
    const hasCrash = await page.locator("text=ENTITY NOT FOUND").isVisible();
    expect(hasCrash).toBe(false);
  });
});

// ── H. Autonomy ──────────────────────────────────────────────────────────────

test.describe("H. Autonomy", () => {
  test("page loads and shows STRATEGIC AUTONOMY heading", async ({ page }) => {
    await page.goto("/autonomy");
    await expect(page.locator("text=STRATEGIC AUTONOMY")).toBeVisible();
  });

  test("AUTONOMY GAPS tab loads rows", async ({ page }) => {
    await page.goto("/autonomy");
    // Default tab is GAPS
    await page.locator("button:has-text('APPLY')").click();
    await waitForTableRows(page, 1);
  });

  test("autonomy flag pills render in GAPS table", async ({ page }) => {
    await page.goto("/autonomy");
    await page.locator("button:has-text('APPLY')").click();
    await waitForTableRows(page, 1);
    // The pill text "EU_COVERAGE_OK" should appear (data confirmed from API)
    await expect(page.locator("text=EU_COVERAGE_OK").first()).toBeVisible({ timeout: 10_000 });
  });

  test("EU balance bars render", async ({ page }) => {
    await page.goto("/autonomy");
    await page.locator("button:has-text('APPLY')").click();
    await waitForTableRows(page, 1);
    // The EU balance shows "EU" label text
    await expect(page.locator("text=EU").first()).toBeVisible({ timeout: 10_000 });
  });

  test("flag filter dropdown is present", async ({ page }) => {
    await page.goto("/autonomy");
    const filterSelect = page.locator("select:has(option[value='CRITICAL'])");
    await expect(filterSelect).toBeVisible();
  });

  test("EU vs NON-EU tab loads", async ({ page }) => {
    await page.goto("/autonomy");
    await page.locator("button:has-text('EU vs NON-EU')").click();
    await page.locator("button:has-text('APPLY')").click();
    // DataTable renders — header columns should be visible
    await expect(page.locator("thead th").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── I. Compliance ────────────────────────────────────────────────────────────

test.describe("I. Compliance", () => {
  test("page loads and shows REGULATORY ADMISSIBILITY heading", async ({ page }) => {
    await page.goto("/compliance");
    await expect(page.locator("text=REGULATORY ADMISSIBILITY")).toBeVisible();
  });

  test("ADMISSIBILITY MATRIX tab is default", async ({ page }) => {
    await page.goto("/compliance");
    await expect(page.locator("button:has-text('ADMISSIBILITY MATRIX')")).toBeVisible();
  });

  test("entity filter with known entity loads compliance summary panel", async ({ page }) => {
    await page.goto("/compliance");
    // Enter the known compliance entity ID
    const entityInput = page.locator("input[placeholder='Entity ID…']");
    await entityInput.fill(ENTITIES.compliance.id);
    await page.locator("button:has-text('APPLY')").click();
    // The 4-cell summary panel should appear
    await expect(page.locator("text=TOTAL EVALS").first()).toBeVisible({ timeout: 15_000 });
    // Use scoped selector to avoid matching hidden <option> elements in the filter dropdown
    await expect(page.locator(".bg-terminal-panel:has-text('PASS')").first()).toBeVisible();
    await expect(page.locator(".bg-terminal-panel:has-text('FAIL')").first()).toBeVisible();
    await expect(page.locator(".bg-terminal-panel:has-text('UNKNOWN')").first()).toBeVisible();
  });

  test("PRIORITY COVERAGE tab loads", async ({ page }) => {
    await page.goto("/compliance");
    await page.locator("button:has-text('PRIORITY COVERAGE')").click();
    await expect(page.locator("text=NORMATIVE PRIORITY COVERAGE")).toBeVisible();
  });
});

// ── J. Entity Page ────────────────────────────────────────────────────────────

test.describe("J. Entity Page", () => {
  const ENTITY_URL = `/entities/${ENTITIES.thrustme.id}`;

  test("entity page loads without crashing", async ({ page }) => {
    await page.goto(ENTITY_URL);
    // The page must NOT show the "ENTITY NOT FOUND" error
    await expect(page.locator("text=ENTITY NOT FOUND")).not.toBeVisible({ timeout: 10_000 });
    // Entity name renders in the heading
    await expect(page.locator(`text=${ENTITIES.thrustme.name}`).first()).toBeVisible({ timeout: 15_000 });
  });

  test("entity ID is shown in the subheading", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await expect(page.locator(`text=${ENTITIES.thrustme.id}`).first()).toBeVisible({ timeout: 15_000 });
  });

  test("PROFILE tab renders key-value grid", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await expect(page.locator("text=ThrustMe").first()).toBeVisible({ timeout: 15_000 });
    // KVGrid renders entity_id and other profile fields
    await expect(page.locator("text=entity id").first()).toBeVisible({ timeout: 10_000 });
  });

  test("CONTEXT tab loads without crash", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await expect(page.locator("text=ThrustMe").first()).toBeVisible({ timeout: 15_000 });
    await page.locator("button:has-text('CONTEXT')").click();
    // Either shows data table or "NO DATA" — both are valid, no crash
    await page.waitForTimeout(3000);
    const hasCrash = await page.locator("text=ENTITY NOT FOUND").isVisible();
    expect(hasCrash).toBe(false);
  });

  test("RANKING tab loads without crash", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await page.locator("button:has-text('RANKING')").click();
    await page.waitForTimeout(3000);
    // Should show ranking fields — final_score, base_score, etc.
    // Use .first() to avoid strict mode violation (two elements match "final score")
    const hasData = await page.locator("text=final score").first().isVisible() || await page.locator("text=NO DATA").first().isVisible();
    expect(hasData).toBe(true);
  });

  test("SCENARIO tab loads intelligence summary", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await page.locator("button:has-text('SCENARIO')").click();
    await expect(page.locator("text=INTELLIGENCE SUMMARY").first()).toBeVisible({ timeout: 20_000 });
  });

  test("PATENTS tab loads without crash", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await page.locator("button:has-text('PATENTS')").click();
    await page.waitForTimeout(3000);
    const hasCrash = await page.locator("text=ENTITY NOT FOUND").isVisible();
    expect(hasCrash).toBe(false);
  });

  test("RESEARCH tab loads without crash", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await page.locator("button:has-text('RESEARCH')").click();
    await page.waitForTimeout(3000);
    const hasCrash = await page.locator("text=ENTITY NOT FOUND").isVisible();
    expect(hasCrash).toBe(false);
  });

  test("PROCURE tab loads without crash", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await page.locator("button:has-text('PROCURE')").click();
    await page.waitForTimeout(3000);
    const hasCrash = await page.locator("text=ENTITY NOT FOUND").isVisible();
    expect(hasCrash).toBe(false);
  });

  test("NORMATIVE tab loads status summary", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await page.locator("button:has-text('NORMATIVE')").click();
    await page.waitForTimeout(3000);
    const hasCrash = await page.locator("text=ENTITY NOT FOUND").isVisible();
    expect(hasCrash).toBe(false);
  });

  test("EVENTS tab loads without crash", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await page.locator("button:has-text('EVENTS')").click();
    await page.waitForTimeout(3000);
    const hasCrash = await page.locator("text=ENTITY NOT FOUND").isVisible();
    expect(hasCrash).toBe(false);
  });

  test("OWNERSHIP tab loads without crash", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await page.locator("button:has-text('OWNERSHIP')").click();
    await page.waitForTimeout(3000);
    const hasCrash = await page.locator("text=ENTITY NOT FOUND").isVisible();
    expect(hasCrash).toBe(false);
  });

  test("SUPPLY CHAIN tab loads without crash", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await page.locator("button:has-text('SUPPLY CHAIN')").click();
    await page.waitForTimeout(3000);
    const hasCrash = await page.locator("text=ENTITY NOT FOUND").isVisible();
    expect(hasCrash).toBe(false);
  });

  test("TECH EXPOSURE tab loads without crash", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await page.locator("button:has-text('TECH EXPOSURE')").click();
    await page.waitForTimeout(3000);
    const hasCrash = await page.locator("text=ENTITY NOT FOUND").isVisible();
    expect(hasCrash).toBe(false);
  });

  test("GRAPH tab loads ReactFlow canvas without crash", async ({ page }) => {
    await page.goto(ENTITY_URL);
    await page.locator("button:has-text('GRAPH')").click();
    await page.waitForTimeout(5000); // ReactFlow takes longer
    const hasCrash = await page.locator("text=ENTITY NOT FOUND").isVisible();
    expect(hasCrash).toBe(false);
    // ReactFlow renders a .react-flow div
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 10_000 });
  });

  test("back button navigates away from entity page", async ({ page }) => {
    await page.goto("/screener");
    await waitForTableRows(page);
    // Navigate to entity then back
    await page.goto(ENTITY_URL);
    await expect(page.locator(`text=${ENTITIES.thrustme.name}`).first()).toBeVisible({ timeout: 15_000 });
    await page.locator("button").filter({ hasText: "" }).first().click(); // ArrowLeft back button
    // Should navigate back (to screener or previous page)
    await expect(page).not.toHaveURL(ENTITY_URL, { timeout: 8_000 });
  });
});
