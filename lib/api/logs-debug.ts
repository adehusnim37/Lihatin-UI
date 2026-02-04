/**
 * Debug API untuk troubleshoot "Provisional headers are shown"
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

/**
 * Test endpoint tanpa authentication
 */
export async function testBasicFetch() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    console.log("✅ Basic fetch (no auth) - Status:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    return { success: true, status: response.status, data };
  } catch (error) {
    console.error("❌ Basic fetch failed:", error);
    return { success: false, error };
  }
}

/**
 * Test endpoint dengan credentials (cookies)
 */
export async function testFetchWithCredentials() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    
    console.log("✅ Fetch with credentials - Status:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    return { success: true, status: response.status, data };
  } catch (error) {
    console.error("❌ Fetch with credentials failed:", error);
    return { success: false, error };
  }
}

/**
 * Test logs debug endpoint (check auth status)
 */
export async function testLogsDebug() {
  try {
    const response = await fetch(`${API_URL}/logs/debug`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    
    console.log("✅ Logs debug - Status:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log("Debug data:", data);
    
    return { success: true, status: response.status, data };
  } catch (error) {
    console.error("❌ Logs debug failed:", error);
    return { success: false, error };
  }
}

/**
 * Test logs endpoint (dengan auth)
 */
export async function testLogsEndpoint() {
  try {
    const response = await fetch(
      `${API_URL}/logs/?page=1&limit=5&sort=created_at&order_by=desc`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    
    console.log("✅ Logs endpoint - Status:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log("Logs data:", data);
      return { success: true, status: response.status, data };
    } else {
      const errorData = await response.json();
      console.log("Error response:", errorData);
      return { success: false, status: response.status, error: errorData };
    }
  } catch (error) {
    console.error("❌ Logs endpoint failed:", error);
    return { success: false, error };
  }
}

/**
 * Run all debug tests
 */
export async function runAllDebugTests() {
  console.log("🔍 Starting debug tests...\n");
  
  console.log("1️⃣ Testing basic fetch...");
  await testBasicFetch();
  
  console.log("\n2️⃣ Testing fetch with credentials...");
  await testFetchWithCredentials();
  
  console.log("\n3️⃣ Testing logs debug endpoint...");
  await testLogsDebug();
  
  console.log("\n4️⃣ Testing logs endpoint...");
  await testLogsEndpoint();
  
  console.log("\n✅ All tests completed!");
}
