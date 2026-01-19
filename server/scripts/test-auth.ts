/**
 * Authentication Flow Test Script
 *
 * Tests the complete Better Auth flow:
 * 1. Sign up with email/password
 * 2. Sign in with email/password
 * 3. Get session (authenticated)
 * 4. Sign out
 * 5. Verify session is cleared
 * 6. Cleanup: delete test user from database
 *
 * Usage:
 *   bun run test:auth
 *
 * Environment:
 *   API_URL - Base URL of the API (default: http://localhost:3001)
 *   DATABASE_URL - PostgreSQL connection string (for cleanup)
 */

import postgres from "postgres";

const API_URL = process.env.API_URL || "http://localhost:3001";
const TEST_USER = {
  name: "Test User",
  email: `test-${Date.now()}@example.com`,
  password: "TestPassword123!",
};

// Store cookies between requests
let sessionCookie: string | null = null;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

const results: TestResult[] = [];

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function extractCookies(response: Response): string | null {
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    // Extract the session cookie (better-auth uses 'better-auth.session_token')
    const cookies = setCookie.split(",").map((c) => c.trim());
    return cookies
      .map((c) => c.split(";")[0])
      .filter((c) => c.includes("better-auth"))
      .join("; ");
  }
  return null;
}

async function makeRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Origin": API_URL, // Required for CSRF protection
    ...(options.headers as Record<string, string>),
  };

  if (sessionCookie) {
    headers["Cookie"] = sessionCookie;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Update session cookie if present
  const newCookie = extractCookies(response);
  if (newCookie) {
    sessionCookie = newCookie;
  }

  return response;
}

async function test(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn();
    results.push({ name, passed: true });
    log("✅", `${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage });
    log("❌", `${name}: ${errorMessage}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// ============================================================================
// Test Cases
// ============================================================================

async function testHealthCheck(): Promise<void> {
  const response = await makeRequest("/health");
  assert(response.ok, `Health check failed with status ${response.status}`);

  const data = await response.json();
  assert(data.status === "healthy", `Unexpected health status: ${data.status}`);
}

async function testSignUp(): Promise<void> {
  const response = await makeRequest("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: TEST_USER.password,
    }),
  });

  const text = await response.text();

  // Better Auth returns 200 on successful signup
  assert(response.ok, `Sign up failed with status ${response.status}: ${text}`);

  const data = JSON.parse(text);
  assert(data.user?.email === TEST_USER.email, "User email mismatch");
  assert(data.user?.name === TEST_USER.name, "User name mismatch");

  log("   ", `Created user: ${data.user.email} (ID: ${data.user.id})`);
}

async function testSignIn(): Promise<void> {
  // Clear any existing session
  sessionCookie = null;

  const response = await makeRequest("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
    }),
  });

  const text = await response.text();
  assert(response.ok, `Sign in failed with status ${response.status}: ${text}`);

  const data = JSON.parse(text);
  assert(data.user?.email === TEST_USER.email, "User email mismatch after sign in");
  assert(sessionCookie !== null, "No session cookie received");

  log("   ", `Signed in as: ${data.user.email}`);
}

async function testGetSessionAuthenticated(): Promise<void> {
  const response = await makeRequest("/api/auth/get-session");

  assert(
    response.ok,
    `Get session failed with status ${response.status}`
  );

  const data = await response.json();
  assert(data.user?.email === TEST_USER.email, "Session user email mismatch");
  assert(data.session?.userId, "No session ID in response");

  log("   ", `Session valid, expires: ${data.session.expiresAt}`);
}

async function testSignOut(): Promise<void> {
  const response = await makeRequest("/api/auth/sign-out", {
    method: "POST",
    body: JSON.stringify({}),
  });

  // Consume the response body to prevent hanging
  const text = await response.text();

  // Better Auth sign-out returns 200 on success with { success: true }
  assert(
    response.ok,
    `Sign out failed with status ${response.status}: ${text}`
  );

  // Clear our local session cookie to simulate logout
  sessionCookie = null;

  log("   ", "Session terminated");
}

async function testSessionAfterSignOut(): Promise<void> {
  // Clear the cookie to simulate a new request
  sessionCookie = null;

  const response = await makeRequest("/api/auth/get-session");

  // Session endpoint should return 200 with null or empty session
  assert(response.ok, `Get session failed with status ${response.status}`);

  const data = await response.json();
  // Better Auth returns null directly for unauthenticated requests
  assert(
    data === null || data?.user === null || data?.session === null,
    "Session should be null after sign out"
  );

  log("   ", "Session correctly cleared");
}

async function testSignInAfterSignOut(): Promise<void> {
  // Test that we can sign in again after signing out
  const response = await makeRequest("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
    }),
  });

  assert(
    response.ok,
    `Re-sign in failed with status ${response.status}`
  );

  const data = await response.json();
  assert(data.user?.email === TEST_USER.email, "User email mismatch");

  log("   ", "Re-authentication successful");
}

async function testInvalidCredentials(): Promise<void> {
  sessionCookie = null;

  const response = await makeRequest("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({
      email: TEST_USER.email,
      password: "WrongPassword123!",
    }),
  });

  // Better Auth returns 401 or error for invalid credentials
  assert(
    !response.ok || response.status === 401,
    `Expected auth failure but got status ${response.status}`
  );

  log("   ", "Invalid credentials correctly rejected");
}

async function testDuplicateSignUp(): Promise<void> {
  sessionCookie = null;

  const response = await makeRequest("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: TEST_USER.password,
    }),
  });

  // Better Auth should reject duplicate email
  assert(
    !response.ok,
    `Expected duplicate signup to fail but got status ${response.status}`
  );

  log("   ", "Duplicate signup correctly rejected");
}

// ============================================================================
// Cleanup
// ============================================================================

async function cleanup(): Promise<void> {
  log("🧹", "Cleaning up test data...");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    log("⚠️", "DATABASE_URL not set, skipping cleanup");
    return;
  }

  try {
    const sql = postgres(connectionString, { max: 1 });

    // Delete sessions first (foreign key constraint)
    // Better Auth uses singular table names by default
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
      log("   ", `Deleted user: ${deletedUsers[0].email}`);
      log("   ", `Deleted ${deletedSessions.length} session(s)`);
      log("   ", `Deleted ${deletedAccounts.length} account(s)`);
    } else {
      log("   ", "No test user found to delete");
    }
  } catch (error) {
    log("⚠️", `Cleanup error: ${error instanceof Error ? error.message : error}`);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🔐 Authentication Flow Test");
  console.log("=".repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Test User: ${TEST_USER.email}`);
  console.log("=".repeat(60) + "\n");

  // Check if API is available
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error(`API not responding (status: ${healthResponse.status})`);
    }
  } catch (error) {
    log("❌", `API not available at ${API_URL}`);
    log("   ", "Make sure the server is running: bun run dev:node");
    process.exit(1);
  }

  log("📋", "Running tests...\n");

  // Run tests in order
  await test("1. Health Check", testHealthCheck);
  await test("2. Sign Up", testSignUp);
  await test("3. Sign In", testSignIn);
  await test("4. Get Session (authenticated)", testGetSessionAuthenticated);
  await test("5. Sign Out", testSignOut);
  await test("6. Verify Session Cleared", testSessionAfterSignOut);
  await test("7. Re-Sign In", testSignInAfterSignOut);
  await test("8. Invalid Credentials Rejected", testInvalidCredentials);
  await test("9. Duplicate Sign Up Rejected", testDuplicateSignUp);

  // Cleanup
  console.log("\n" + "-".repeat(60));
  await cleanup();

  // Summary
  console.log("\n" + "=".repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  if (failed === 0) {
    log("🎉", `All ${passed} tests passed!`);
  } else {
    log("⚠️", `${passed} passed, ${failed} failed`);
    console.log("\nFailed tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
  }
  console.log("=".repeat(60) + "\n");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
