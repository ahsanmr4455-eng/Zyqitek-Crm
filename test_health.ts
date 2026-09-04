async function query() {
  try {
    const res = await fetch("http://localhost:3000/api/supabase/health");
    const json = await res.json();
    console.log("Health Check:", json);
  } catch (err: any) {
    console.error("Failed to query health:", err.message);
  }
}
query();
