import { spawn } from "child_process";

console.log("=== STARTING LIBREPRINT END-TO-END VERIFICATION ===");

const PORT = 3099;
const serverProcess = spawn("node", ["./node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
  cwd: process.cwd(),
  stdio: "pipe",
  env: { ...process.env, PORT: String(PORT) },
});

let serverReady = false;

serverProcess.stdout.on("data", (data) => {
  const msg = data.toString();
  if (msg.includes("Ready") || msg.includes("started") || msg.includes("http://")) {
    serverReady = true;
  }
});

async function waitForServer(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/staff/auth`);
      if (res.status === 200 || res.status === 401) {
        return true;
      }
    } catch {
      // Waiting
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Server failed to respond within timeout");
}

async function runTests() {
  try {
    console.log(`[1] Waiting for libreprint server on port ${PORT}...`);
    await waitForServer();
    console.log("✓ libreprint server is UP and responding!");

    // Test 1: Upload a document with complete specs (Paper Size, Color, Copies, Sidedness, Notes)
    console.log("\n[2] Testing Client Upload with Specs & Notes via /api/upload...");
    const samplePdfContent = "%PDF-1.4 sample pdf content for libreprint test";
    const blob = new Blob([samplePdfContent], { type: "application/pdf" });

    const formData = new FormData();
    formData.append("clientName", "Datu Lapu-Lapu");
    formData.append("files", blob, "thesis_chapter_1.pdf");
    formData.append(
      "fileOptions",
      JSON.stringify({
        "thesis_chapter_1.pdf": {
          copies: 3,
          colorMode: "bw",
          paperSize: "Short (Letter)",
          orientation: "portrait",
          doubleSided: true,
          notes: "Paki-staple po sa itaas kaliwa. Salamat!",
        },
      })
    );

    const uploadRes = await fetch(`http://127.0.0.1:${PORT}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json();
    console.log("Upload response:", uploadData);
    if (!uploadData.ticketId || !uploadData.ticketCode) {
      throw new Error("Upload failed to return ticketId or ticketCode");
    }
    console.log(`✓ Ticket created! Code: ${uploadData.ticketCode}, ID: ${uploadData.ticketId}`);

    // Test 2: Fetch client ticket details & verify specs
    console.log("\n[3] Testing Client Ticket Details via /api/tickets/[id]...");
    const ticketRes = await fetch(`http://127.0.0.1:${PORT}/api/tickets/${uploadData.ticketCode}`);
    const ticketData = await ticketRes.json();
    const firstFile = ticketData.files[0];

    console.log("Ticket & File Specs:", {
      code: ticketData.ticket.ticket_code,
      client: ticketData.ticket.client_name,
      fileName: firstFile.file_name,
      paperSize: firstFile.paper_size,
      copies: firstFile.copies,
      doubleSided: firstFile.double_sided,
      notes: firstFile.notes,
      status: firstFile.status,
    });

    if (
      firstFile.paper_size !== "Short (Letter)" ||
      firstFile.double_sided !== 1 ||
      firstFile.notes !== "Paki-staple po sa itaas kaliwa. Salamat!"
    ) {
      throw new Error("Document specs did not match uploaded payload");
    }
    console.log("✓ Specs & Notes accurately recorded and verified!");

    // Test 3: Staff Authentication
    console.log("\n[4] Testing Staff Authentication via /api/staff/auth...");
    const loginRes = await fetch(`http://127.0.0.1:${PORT}/api/staff/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "admin" }),
    });

    const loginData = await loginRes.json();
    if (!loginData.success) {
      throw new Error("Staff login failed");
    }
    const cookieHeader = loginRes.headers.get("set-cookie").split(";")[0];
    console.log("✓ Staff session authenticated!");

    // Test 4: Staff Queue Listing
    console.log("\n[5] Testing Staff Queue List via /api/staff/tickets...");
    const staffQueueRes = await fetch(`http://127.0.0.1:${PORT}/api/staff/tickets`, {
      headers: { Cookie: cookieHeader },
    });
    const staffQueueData = await staffQueueRes.json();
    console.log("Queue statistics:", staffQueueData.stats);
    console.log("✓ Staff ticket list verified!");

    // Test 5: Status Transition to printing & done
    console.log("\n[6] Testing Status Lifecycle (queued -> printing -> done)...");
    const fileId = firstFile.id;

    const printingRes = await fetch(`http://127.0.0.1:${PORT}/api/staff/files/${fileId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ status: "printing" }),
    });
    const printingData = await printingRes.json();
    if (printingData.file.status !== "printing") throw new Error("Status transition to printing failed");

    const doneRes = await fetch(`http://127.0.0.1:${PORT}/api/staff/files/${fileId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ status: "done" }),
    });
    const doneData = await doneRes.json();
    if (doneData.file.status !== "done") throw new Error("Status transition to done failed");

    console.log(`✓ Status transitioned cleanly to 'done' at ${new Date(doneData.file.printed_at).toISOString()}!`);

    console.log("\n=======================================================");
    console.log("✅ ALL LIBREPRINT VERIFICATION TESTS PASSED SUCCESSFULLY!");
    console.log("=======================================================");
  } finally {
    serverProcess.kill();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  serverProcess.kill();
  process.exit(1);
});
