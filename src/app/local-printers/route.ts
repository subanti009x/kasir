import { spawn } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function runPrinterBridge(input: Record<string, unknown>) {
  return new Promise<any>((resolve, reject) => {
    const script = path.join(process.cwd(), "scripts", "Windows-Printer-Bridge.ps1");
    const child = spawn("powershell.exe", ["-NoLogo", "-NoProfile", "-STA", "-ExecutionPolicy", "Bypass", "-File", script], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => child.kill(), 120_000);
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
    child.on("error", (error) => { clearTimeout(timeout); reject(error); });
    child.on("close", (code) => {
      clearTimeout(timeout);
      const line = stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
      try {
        const result = line ? JSON.parse(line) : null;
        if (!result || code !== 0 || result.status === "error") {
          reject(new Error(result?.message || stderr.trim() || `Windows printer bridge exited with code ${code}`));
          return;
        }
        resolve(result);
      } catch {
        reject(new Error(stderr.trim() || "Respons penghubung printer Windows tidak valid."));
      }
    });
    child.stdin.end(JSON.stringify(input), "utf8");
  });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !!origin && new URL(origin).origin === new URL(request.url).origin;
}

export async function GET() {
  if (process.platform !== "win32") {
    return Response.json({ message: "Deteksi printer lokal otomatis hanya tersedia di Windows." }, { status: 501 });
  }
  try {
    const result = await runPrinterBridge({ action: "list" });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Gagal membaca printer Windows." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ message: "Permintaan printer harus berasal dari aplikasi ini." }, { status: 403 });
  if (process.platform !== "win32") return Response.json({ message: "Cetak langsung printer lokal hanya tersedia di Windows." }, { status: 501 });

  try {
    const payload = await request.json();
    const serialized = JSON.stringify(payload);
    if (!payload?.receipt?.receiptId || !payload?.printerName || !payload?.paperSizeName || serialized.length > 500_000) {
      return Response.json({ message: "Data struk atau pilihan printer belum lengkap." }, { status: 400 });
    }
    if (payload.receiptFormat !== undefined && !["DEFAULT", "FAJAR_CLIENT"].includes(payload.receiptFormat)) {
      return Response.json({ message: "Format struk tidak dikenal." }, { status: 400 });
    }
    if (payload.receiptFormat === "FAJAR_CLIENT") {
      const tenantId = typeof payload.tenantId === "string" ? payload.tenantId : "";
      const authorization = request.headers.get("authorization");
      if (!tenantId || !authorization) {
        return Response.json({ message: "Sesi toko diperlukan untuk mencetak format khusus Fajar." }, { status: 401 });
      }
      const backendUrl = (process.env.BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");
      const featureResponse = await fetch(`${backendUrl}/api/exclusive-features/check/${encodeURIComponent(tenantId)}`, {
        headers: { Authorization: authorization },
        cache: "no-store",
      });
      const featureResult = await featureResponse.json().catch(() => null);
      if (!featureResponse.ok || !featureResult?.featureMap?.FAJAR_CLIENT_RECEIPT) {
        return Response.json({ message: "Format struk khusus hanya tersedia untuk Toko Fajar." }, { status: 403 });
      }
    }
    const result = await runPrinterBridge({ action: "print", ...payload });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Gagal mencetak struk." }, { status: 500 });
  }
}
