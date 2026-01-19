import { test, expect } from "@playwright/test";

/**
 * E2E Authentication Flow Tests
 *
 * Tests the complete authentication flow through the UI:
 * 1. Sign up with email/password
 * 2. Verify redirect to dashboard
 * 3. Sign out
 * 4. Sign in with same credentials
 * 5. Verify protected routes
 * 6. Test invalid credentials
 * 7. Cleanup test user from database
 */

// Test user credentials - using timestamp to avoid conflicts
const TEST_USER = {
  name: "E2E Test User",
  email: `e2e-test-${Date.now()}@example.com`,
  password: "TestPassword123!",
};

// Database URL for cleanup
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://lumea@localhost:5432/lumea";

test.describe("Authentication Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("should redirect unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL("/login");
    await expect(page.getByTestId("login-page")).toBeVisible();
  });

  test("should navigate from login to signup page", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByTestId("login-signup-link")).toBeVisible();
    await page.getByTestId("login-signup-link").click();

    await expect(page).toHaveURL("/signup");
    await expect(page.getByTestId("signup-page")).toBeVisible();
  });

  test("should show error for password mismatch on signup", async ({ page }) => {
    await page.goto("/signup");

    await page.getByTestId("signup-name-input").fill(TEST_USER.name);
    await page.getByTestId("signup-email-input").fill(TEST_USER.email);
    await page.getByTestId("signup-password-input").fill(TEST_USER.password);
    await page.getByTestId("signup-confirm-password-input").fill("DifferentPassword123!");

    await page.getByTestId("signup-submit-button").click();

    await expect(page.getByTestId("signup-error")).toBeVisible();
    await expect(page.getByTestId("signup-error")).toContainText("Passwords do not match");
  });

  test("should show error for short password on signup", async ({ page }) => {
    await page.goto("/signup");

    await page.getByTestId("signup-name-input").fill(TEST_USER.name);
    await page.getByTestId("signup-email-input").fill(TEST_USER.email);
    await page.getByTestId("signup-password-input").fill("short");
    await page.getByTestId("signup-confirm-password-input").fill("short");

    await page.getByTestId("signup-submit-button").click();

    await expect(page.getByTestId("signup-error")).toBeVisible();
    await expect(page.getByTestId("signup-error")).toContainText("at least 8 characters");
  });

  test("should sign up successfully and redirect to dashboard", async ({ page }) => {
    await page.goto("/signup");

    // Fill signup form
    await page.getByTestId("signup-name-input").fill(TEST_USER.name);
    await page.getByTestId("signup-email-input").fill(TEST_USER.email);
    await page.getByTestId("signup-password-input").fill(TEST_USER.password);
    await page.getByTestId("signup-confirm-password-input").fill(TEST_USER.password);

    // Submit
    await page.getByTestId("signup-submit-button").click();

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
    await expect(page.getByTestId("dashboard-page")).toBeVisible();

    // Verify user info displayed
    await expect(page.getByTestId("dashboard-user-name")).toContainText(TEST_USER.name);
    await expect(page.getByTestId("dashboard-user-email")).toContainText(TEST_USER.email);
    await expect(page.getByTestId("dashboard-welcome-title")).toContainText(TEST_USER.name);
  });

  test("should sign out and redirect to login", async ({ page }) => {
    // First sign in
    await page.goto("/login");
    await page.getByTestId("login-email-input").fill(TEST_USER.email);
    await page.getByTestId("login-password-input").fill(TEST_USER.password);
    await page.getByTestId("login-submit-button").click();

    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

    // Sign out
    await page.getByTestId("dashboard-signout-button").click();

    // Should redirect to login
    await expect(page).toHaveURL("/login", { timeout: 10000 });
    await expect(page.getByTestId("login-page")).toBeVisible();
  });

  test("should sign in with existing account", async ({ page }) => {
    await page.goto("/login");

    // Fill login form
    await page.getByTestId("login-email-input").fill(TEST_USER.email);
    await page.getByTestId("login-password-input").fill(TEST_USER.password);

    // Submit
    await page.getByTestId("login-submit-button").click();

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await expect(page.getByTestId("dashboard-user-email")).toContainText(TEST_USER.email);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByTestId("login-email-input").fill(TEST_USER.email);
    await page.getByTestId("login-password-input").fill("WrongPassword123!");

    await page.getByTestId("login-submit-button").click();

    // Should show error
    await expect(page.getByTestId("login-error")).toBeVisible({ timeout: 10000 });
  });

  test("should redirect authenticated user from login to dashboard", async ({ page }) => {
    // Sign in first
    await page.goto("/login");
    await page.getByTestId("login-email-input").fill(TEST_USER.email);
    await page.getByTestId("login-password-input").fill(TEST_USER.password);
    await page.getByTestId("login-submit-button").click();

    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

    // Try to go to login page while authenticated
    await page.goto("/login");

    // Should redirect back to dashboard
    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
  });

  test("should reject duplicate signup", async ({ page }) => {
    // First sign out if logged in
    await page.goto("/signup");

    // Try to sign up with same email
    await page.getByTestId("signup-name-input").fill("Another User");
    await page.getByTestId("signup-email-input").fill(TEST_USER.email);
    await page.getByTestId("signup-password-input").fill(TEST_USER.password);
    await page.getByTestId("signup-confirm-password-input").fill(TEST_USER.password);

    await page.getByTestId("signup-submit-button").click();

    // Should show error
    await expect(page.getByTestId("signup-error")).toBeVisible({ timeout: 10000 });
  });
});

/**
 * Cleanup test data after all tests complete
 */
test.afterAll(async () => {
  console.log("\nCleaning up test user:", TEST_USER.email);

  try {
    // Dynamic import to avoid bundling issues
    const postgres = await import("postgres").then((m) => m.default);
    const sql = postgres(DATABASE_URL, { max: 1 });

    // Delete sessions first (foreign key constraint)
    const deletedSessions = await sql`
      DELETE FROM session
      WHERE user_id IN (
        SELECT id FROM "user" WHERE email = ${TEST_USER.email}
      )
      RETURNING id
    `;

    // Delete accounts
    const deletedAccounts = await sql`
      DELETE FROM account
      WHERE user_id IN (
        SELECT id FROM "user" WHERE email = ${TEST_USER.email}
      )
      RETURNING id
    `;

    // Delete the user
    const deletedUsers = await sql`
      DELETE FROM "user"
      WHERE email = ${TEST_USER.email}
      RETURNING id, email
    `;

    await sql.end();

    if (deletedUsers.length > 0) {
      console.log(`Deleted user: ${deletedUsers[0].email}`);
      console.log(`Deleted ${deletedSessions.length} session(s)`);
      console.log(`Deleted ${deletedAccounts.length} account(s)`);
    } else {
      console.log("No test user found to delete");
    }
  } catch (error) {
    console.error("Cleanup error:", error instanceof Error ? error.message : error);
  }
});
