import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Internal Fatoora sidecar: per-job sandbox around the official JAR.
 * Never calls Fatoora HTTP. Never logs PEM / CSID / private keys.
 */
public final class SidecarServer {

  private static Path sdkHome;
  private static Path jarPath;
  private static String sdkVersion;
  private static Semaphore concurrency;

  public static void main(String[] args) throws Exception {
    sdkHome = Paths.get(env("FATOORA_HOME", "/opt/zatca-sdk")).toAbsolutePath().normalize();
    Path apps = sdkHome.resolve("Apps");
    Path versionFile = Files.exists(apps.resolve("global.json"))
        ? apps.resolve("global.json")
        : sdkHome.resolve("global.json");
    sdkVersion = readVersion(versionFile);
    jarPath = resolveJar(apps, sdkHome, sdkVersion);

    int port = Integer.parseInt(env("SIDECAR_PORT", "8090"));
    int max = Integer.parseInt(env("SIDECAR_MAX_CONCURRENT", "8"));
    concurrency = new Semaphore(Math.max(1, max));

    HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
    server.createContext("/health", SidecarServer::health);
    server.createContext("/internal/csr", ex -> handle(ex, "csr"));
    server.createContext("/internal/sign", ex -> handle(ex, "sign"));
    server.createContext("/internal/validate", ex -> handle(ex, "validate"));
    server.createContext("/internal/hash", ex -> handle(ex, "hash"));
    server.createContext("/internal/invoice-request", ex -> handle(ex, "invoice-request"));
    server.setExecutor(java.util.concurrent.Executors.newCachedThreadPool());

    System.out.println(
        "zatca sidecar listening on :"
            + port
            + " sdk="
            + sdkHome
            + " jar="
            + jarPath.getFileName()
            + " maxConcurrent="
            + max);
    server.start();
  }

  private static void health(HttpExchange exchange) throws IOException {
    if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
      send(exchange, 405, jsonError("method_not_allowed", "GET only"));
      return;
    }
    send(exchange, 200, "{\"status\":\"ok\"}");
  }

  private static void handle(HttpExchange exchange, String operation) throws IOException {
    if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
      send(exchange, 405, jsonError("method_not_allowed", "POST only"));
      return;
    }

    boolean acquired = false;
    Path sandbox = null;
    try {
      acquired = concurrency.tryAcquire(60, TimeUnit.SECONDS);
      if (!acquired) {
        send(exchange, 503, jsonError("sidecar_busy", "Too many concurrent SDK jobs"));
        return;
      }

      String body = readBody(exchange);
      String environment = jsonString(body, "environment");
      if (environment == null || environment.isEmpty()) {
        environment = "simulation";
      }

      sandbox = Files.createTempDirectory("sdk-job-");
      Path configPath = writeConfig(sandbox);
      String result;
      switch (operation) {
        case "csr":
          result = runCsr(sandbox, configPath, body, environment);
          break;
        case "sign":
          result = runSign(sandbox, configPath, body);
          break;
        case "validate":
          result = runValidate(sandbox, configPath, body);
          break;
        case "hash":
          result = runHash(sandbox, configPath, body);
          break;
        case "invoice-request":
          result = runInvoiceRequest(sandbox, configPath, body);
          break;
        default:
          send(exchange, 404, jsonError("not_found", "Unknown operation"));
          return;
      }
      send(exchange, 200, result);
    } catch (IllegalArgumentException e) {
      send(exchange, 400, jsonError("invalid_request", e.getMessage()));
    } catch (Exception e) {
      send(
          exchange,
          500,
          jsonError(
              "sidecar_error",
              e.getMessage() == null ? e.getClass().getSimpleName() : safeMessage(e.getMessage())));
    } finally {
      if (sandbox != null) {
        wipe(sandbox);
      }
      if (acquired) {
        concurrency.release();
      }
    }
  }

  private static String runCsr(
      Path sandbox, Path configPath, String body, String environment) throws Exception {
    String props = jsonString(body, "csrConfig");
    if (props == null || props.trim().isEmpty()) {
      throw new IllegalArgumentException("csrConfig is required");
    }
    Path csrConfig = sandbox.resolve("csr-config.properties");
    Files.write(csrConfig, unescapeJson(props).getBytes(StandardCharsets.UTF_8));

    Path privateKey = sandbox.resolve("private-key.pem");
    Path csrOut = sandbox.resolve("request.csr");

    List<String> cmd = baseCmd(configPath);
    cmd.add("-csr");
    cmd.add("-csrConfig");
    cmd.add(csrConfig.toAbsolutePath().toString());
    cmd.add("-privateKey");
    cmd.add(privateKey.toAbsolutePath().toString());
    cmd.add("-generatedCsr");
    cmd.add(csrOut.toAbsolutePath().toString());
    cmd.add("-pem");
    if ("simulation".equalsIgnoreCase(environment)) {
      cmd.add("-sim");
    } else if ("developer_portal".equalsIgnoreCase(environment)) {
      cmd.add("-nonprod");
    }

    ExecResult exec = exec(cmd, sandbox);
    if (exec.exitCode != 0) {
      throw new IllegalStateException("fatoora -csr failed (exit " + exec.exitCode + ")");
    }
    if (!Files.exists(privateKey) || !Files.exists(csrOut)) {
      throw new IllegalStateException("fatoora -csr did not produce key/csr");
    }

    String key = new String(Files.readAllBytes(privateKey), StandardCharsets.UTF_8).trim();
    String csr = new String(Files.readAllBytes(csrOut), StandardCharsets.UTF_8).trim();
    return "{"
        + "\"privateKey\":"
        + quote(key)
        + ",\"csr\":"
        + quote(csr)
        + "}";
  }

  private static String runSign(Path sandbox, Path configPath, String body) throws Exception {
    prepareMaterial(sandbox, body, true);
    String invoiceXml = require(body, "invoiceXml");
    Path invoice = sandbox.resolve("invoice.xml");
    Path signed = sandbox.resolve("invoice_signed.xml");
    Files.write(invoice, unescapeJson(invoiceXml).getBytes(StandardCharsets.UTF_8));

    List<String> cmd = baseCmd(configPath);
    cmd.add("-sign");
    cmd.add("-invoice");
    // Relative paths: SDK cwd is the sandbox; absolute -signedInvoice is often ignored.
    cmd.add("invoice.xml");
    cmd.add("-signedInvoice");
    cmd.add("invoice_signed.xml");

    ExecResult exec = exec(cmd, sandbox);
    Path produced = findSignedInvoice(sandbox, signed);
    if (exec.exitCode != 0 || produced == null) {
      throw new IllegalStateException(
          "fatoora -sign failed (exit "
              + exec.exitCode
              + "): "
              + sdkFailureDetail(exec));
    }
    String signedXml = new String(Files.readAllBytes(produced), StandardCharsets.UTF_8);
    return "{\"signedInvoiceXml\":" + quote(signedXml) + "}";
  }

  private static String runValidate(Path sandbox, Path configPath, String body) throws Exception {
    prepareMaterial(sandbox, body, true);
    String invoiceXml = require(body, "invoiceXml");
    Path invoice = sandbox.resolve("invoice.xml");
    Files.write(invoice, unescapeJson(invoiceXml).getBytes(StandardCharsets.UTF_8));

    List<String> cmd = baseCmd(configPath);
    cmd.add("-validate");
    cmd.add("-invoice");
    cmd.add("invoice.xml");

    ExecResult exec = exec(cmd, sandbox);
    boolean passed =
        exec.exitCode == 0
            && (exec.stdout.toLowerCase().contains("pass")
                || !exec.stdout.toLowerCase().contains("not pass"));
    // Prefer explicit NOT PASS detection from SDK stdout
    String lower = (exec.stdout + "\n" + exec.stderr).toLowerCase();
    if (lower.contains("not pass") || lower.contains("failed") || exec.exitCode != 0) {
      passed = lower.contains("pass") && !lower.contains("not pass") && exec.exitCode == 0;
    }
    if (lower.contains("validation status") && lower.contains("pass") && !lower.contains("not pass")) {
      passed = true;
    }
    if (lower.contains("not pass")) {
      passed = false;
    }

    return "{"
        + "\"passed\":"
        + passed
        + ",\"exitCode\":"
        + exec.exitCode
        + ",\"output\":"
        + quote(truncate(exec.stdout + "\n" + exec.stderr, 8000))
        + "}";
  }

  private static String runHash(Path sandbox, Path configPath, String body) throws Exception {
    String invoiceXml = require(body, "invoiceXml");
    Path invoice = sandbox.resolve("invoice.xml");
    Files.write(invoice, unescapeJson(invoiceXml).getBytes(StandardCharsets.UTF_8));

    List<String> cmd = baseCmd(configPath);
    cmd.add("-generateHash");
    cmd.add("-invoice");
    cmd.add("invoice.xml");

    ExecResult exec = exec(cmd, sandbox);
    if (exec.exitCode != 0) {
      throw new IllegalStateException("fatoora -generateHash failed (exit " + exec.exitCode + ")");
    }
    String hash = extractHash(exec.stdout + "\n" + exec.stderr);
    return "{\"invoiceHash\":" + quote(hash == null ? "" : hash) + ",\"output\":"
        + quote(truncate(exec.stdout, 2000))
        + "}";
  }

  private static String runInvoiceRequest(Path sandbox, Path configPath, String body)
      throws Exception {
    String invoiceXml = require(body, "invoiceXml");
    Path invoice = sandbox.resolve("invoice_signed.xml");
    Path apiRequest = sandbox.resolve("api-request.json");
    Files.write(invoice, unescapeJson(invoiceXml).getBytes(StandardCharsets.UTF_8));

    List<String> cmd = baseCmd(configPath);
    cmd.add("-invoice");
    cmd.add("invoice_signed.xml");
    cmd.add("-invoiceRequest");
    cmd.add("-apiRequest");
    cmd.add("api-request.json");

    ExecResult exec = exec(cmd, sandbox);
    if (exec.exitCode != 0 || !Files.exists(apiRequest)) {
      throw new IllegalStateException(
          "fatoora -invoiceRequest failed (exit "
              + exec.exitCode
              + "): "
              + truncate(exec.stdout + "\n" + exec.stderr, 1500));
    }
    String json = new String(Files.readAllBytes(apiRequest), StandardCharsets.UTF_8).trim();
    // Return SDK JSON as nested object field by embedding raw (already JSON object)
    return "{\"request\":" + json + "}";
  }

  /** Prefer explicit path; else SDK default `<invoice>_signed.xml` in sandbox cwd. */
  private static Path findSignedInvoice(Path sandbox, Path preferred) throws IOException {
    if (Files.exists(preferred)) {
      return preferred;
    }
    Path def = sandbox.resolve("invoice_signed.xml");
    if (Files.exists(def)) {
      return def;
    }
    try (java.util.stream.Stream<Path> stream = Files.list(sandbox)) {
      return stream
          .filter(p -> p.getFileName().toString().endsWith("_signed.xml"))
          .findFirst()
          .orElse(null);
    }
  }

  private static void prepareMaterial(Path sandbox, String body, boolean needCert)
      throws IOException {
    String privateKey = jsonString(body, "privateKey");
    if (privateKey == null || privateKey.isEmpty()) {
      throw new IllegalArgumentException("privateKey is required");
    }
    Files.write(
        sandbox.resolve("private-key.pem"),
        stripPemHeaders(unescapeJson(privateKey)).getBytes(StandardCharsets.UTF_8));

    if (needCert) {
      String csid = jsonString(body, "csid");
      if (csid == null || csid.isEmpty()) {
        throw new IllegalArgumentException("csid is required");
      }
      // Keep original binarySecurityToken for HTTP Basic auth; SDK cert file
      // needs the inner base64 DER (sample certs start with "MII").
      Files.write(
          sandbox.resolve("cert.pem"),
          normalizeCsidForSdk(unescapeJson(csid)).getBytes(StandardCharsets.UTF_8));
    }

    String pih = jsonString(body, "pih");
    Path pihFile = sandbox.resolve("pih.txt");
    if (pih == null || pih.isEmpty()) {
      Path defaultPih = sdkHome.resolve("Data").resolve("PIH").resolve("pih.txt");
      if (Files.exists(defaultPih)) {
        Files.copy(defaultPih, pihFile);
      } else {
        Files.write(pihFile, new byte[0]);
      }
    } else {
      Files.write(pihFile, unescapeJson(pih).getBytes(StandardCharsets.UTF_8));
    }
  }

  private static Path writeConfig(Path sandbox) throws IOException {
    Path xsd =
        sdkHome
            .resolve("Data")
            .resolve("Schemas")
            .resolve("xsds")
            .resolve("UBL2.1")
            .resolve("xsd")
            .resolve("maindoc")
            .resolve("UBL-Invoice-2.1.xsd");
    Path en =
        sdkHome
            .resolve("Data")
            .resolve("Rules")
            .resolve("Schematrons")
            .resolve("CEN-EN16931-UBL.xsl");
    Path zatca =
        sdkHome
            .resolve("Data")
            .resolve("Rules")
            .resolve("Schematrons")
            .resolve("20210819_ZATCA_E-invoice_Validation_Rules.xsl");
    Path usage = sdkHome.resolve("Configuration").resolve("usage.txt");

    String json =
        "{\n"
            + "  \"xsdPath\": "
            + quote(xsd.toAbsolutePath().toString().replace('\\', '/'))
            + ",\n"
            + "  \"enSchematron\": "
            + quote(en.toAbsolutePath().toString().replace('\\', '/'))
            + ",\n"
            + "  \"zatcaSchematron\": "
            + quote(zatca.toAbsolutePath().toString().replace('\\', '/'))
            + ",\n"
            + "  \"certPath\": "
            + quote(sandbox.resolve("cert.pem").toAbsolutePath().toString().replace('\\', '/'))
            + ",\n"
            + "  \"privateKeyPath\": "
            + quote(
                sandbox.resolve("private-key.pem").toAbsolutePath().toString().replace('\\', '/'))
            + ",\n"
            + "  \"pihPath\": "
            + quote(sandbox.resolve("pih.txt").toAbsolutePath().toString().replace('\\', '/'))
            + ",\n"
            + "  \"inputPath\": "
            + quote(sandbox.toAbsolutePath().toString().replace('\\', '/'))
            + ",\n"
            + "  \"usagePathFile\": "
            + quote(usage.toAbsolutePath().toString().replace('\\', '/'))
            + "\n"
            + "}\n";
    Path config = sandbox.resolve("config.json");
    Files.write(config, json.getBytes(StandardCharsets.UTF_8));
    return config;
  }

  private static List<String> baseCmd(Path configPath) {
    List<String> cmd = new ArrayList<>();
    cmd.add("java");
    cmd.add("-Djdk.module.illegalAccess=deny");
    cmd.add("-Djdk.sunec.disableNative=false");
    cmd.add("-jar");
    cmd.add(jarPath.toAbsolutePath().toString());
    cmd.add("--globalVersion");
    cmd.add(sdkVersion);
    return cmd;
  }

  private static ExecResult exec(List<String> cmd, Path sandbox) throws Exception {
    ProcessBuilder pb = new ProcessBuilder(cmd);
    pb.directory(sandbox.toFile());
    pb.redirectErrorStream(true);
    pb.environment().put("SDK_CONFIG", sandbox.resolve("config.json").toAbsolutePath().toString());
    pb.environment().put("FATOORA_HOME", sdkHome.resolve("Apps").toAbsolutePath().toString());
    Process p = pb.start();
    String stdout = readStream(p.getInputStream());
    int code = p.waitFor();
    return new ExecResult(code, stdout, "");
  }

  private static String readStream(InputStream in) throws IOException {
    ByteArrayOutputStream buf = new ByteArrayOutputStream();
    byte[] chunk = new byte[4096];
    int n;
    while ((n = in.read(chunk)) >= 0) {
      buf.write(chunk, 0, n);
    }
    return new String(buf.toByteArray(), StandardCharsets.UTF_8);
  }

  private static void wipe(Path root) {
    try {
      if (!Files.exists(root)) {
        return;
      }
      Files.walkFileTree(
          root,
          new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs)
                throws IOException {
              Files.deleteIfExists(file);
              return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path dir, IOException exc)
                throws IOException {
              Files.deleteIfExists(dir);
              return FileVisitResult.CONTINUE;
            }
          });
    } catch (Exception ignored) {
      // best-effort wipe
    }
  }

  private static Path resolveJar(Path apps, Path home, String version) throws IOException {
    Path named = apps.resolve("zatca-einvoicing-sdk-" + version + ".jar");
    if (Files.exists(named)) {
      return named;
    }
    Path alt = home.resolve("zatca-einvoicing-sdk-" + version + ".jar");
    if (Files.exists(alt)) {
      return alt;
    }
    throw new IOException("SDK jar not found for version " + version);
  }

  private static String readVersion(Path globalJson) throws IOException {
    String raw = new String(Files.readAllBytes(globalJson), StandardCharsets.UTF_8);
    String v = jsonString(raw, "version");
    if (v == null || v.isEmpty()) {
      throw new IOException("Cannot read SDK version from " + globalJson);
    }
    return v;
  }

  private static String require(String body, String key) {
    String v = jsonString(body, key);
    if (v == null || v.isEmpty()) {
      throw new IllegalArgumentException(key + " is required");
    }
    return v;
  }

  /**
   * Extract a JSON string property by key with a linear scan (no regex). The
   * previous Pattern-based parser StackOverflow'd on large escaped invoiceXml.
   * Returns the raw JSON string contents (still escaped); callers may unescape.
   */
  private static String jsonString(String json, String key) {
    if (json == null || key == null || key.isEmpty()) {
      return null;
    }
    String needle = "\"" + key + "\"";
    int searchFrom = 0;
    while (searchFrom < json.length()) {
      int keyAt = json.indexOf(needle, searchFrom);
      if (keyAt < 0) {
        return null;
      }
      int j = keyAt + needle.length();
      while (j < json.length() && isJsonWs(json.charAt(j))) {
        j++;
      }
      if (j >= json.length() || json.charAt(j) != ':') {
        searchFrom = keyAt + 1;
        continue;
      }
      j++;
      while (j < json.length() && isJsonWs(json.charAt(j))) {
        j++;
      }
      if (j >= json.length() || json.charAt(j) != '"') {
        searchFrom = keyAt + 1;
        continue;
      }
      j++;
      StringBuilder sb = new StringBuilder();
      while (j < json.length()) {
        char c = json.charAt(j);
        if (c == '\\') {
          if (j + 1 >= json.length()) {
            return null;
          }
          sb.append('\\').append(json.charAt(j + 1));
          j += 2;
          continue;
        }
        if (c == '"') {
          return sb.toString();
        }
        sb.append(c);
        j++;
      }
      return null;
    }
    return null;
  }

  private static boolean isJsonWs(char c) {
    return c == ' ' || c == '\t' || c == '\n' || c == '\r';
  }

  private static String unescapeJson(String s) {
    return s.replace("\\n", "\n")
        .replace("\\r", "\r")
        .replace("\\t", "\t")
        .replace("\\\"", "\"")
        .replace("\\\\", "\\");
  }

  private static String stripPemHeaders(String pemOrRaw) {
    return pemOrRaw
        .replaceAll("-----BEGIN[^-]+-----", "")
        .replaceAll("-----END[^-]+-----", "")
        .replaceAll("\\s+", "")
        .trim();
  }

  /**
   * ZATCA {@code binarySecurityToken} is typically base64(UTF-8 of the base64 DER
   * body). The Fatoora SDK expects the inner form used in sample certs ({@code MII...}).
   */
  private static String normalizeCsidForSdk(String csid) {
    String stripped = stripPemHeaders(csid);
    if (stripped.startsWith("MII")) {
      return stripped;
    }
    try {
      byte[] decoded = Base64.getDecoder().decode(stripped);
      if (decoded.length > 0 && (decoded[0] & 0xFF) == 0x30) {
        return Base64.getEncoder().encodeToString(decoded);
      }
      String asText = new String(decoded, StandardCharsets.US_ASCII).trim();
      String inner = stripPemHeaders(asText);
      if (inner.startsWith("MII")) {
        return inner;
      }
    } catch (IllegalArgumentException ignored) {
      // not base64 — use stripped as-is
    }
    return stripped;
  }

  /** Prefer SDK ERROR / failed lines over the welcome banner. */
  private static String sdkFailureDetail(ExecResult exec) {
    String combined = ((exec.stdout == null ? "" : exec.stdout) + "\n" + (exec.stderr == null ? "" : exec.stderr)).trim();
    StringBuilder useful = new StringBuilder();
    for (String line : combined.split("\\r?\\n")) {
      String t = line.trim();
      if (t.isEmpty()) {
        continue;
      }
      String lower = t.toLowerCase();
      if (lower.contains("[error]")
          || lower.contains("failed to")
          || lower.contains("exception")
          || lower.contains("please provide")) {
        if (useful.length() > 0) {
          useful.append(' ');
        }
        useful.append(t);
        if (useful.length() > 900) {
          break;
        }
      }
    }
    if (useful.length() > 0) {
      return useful.toString();
    }
    return truncate(combined, 1500);
  }

  private static String extractHash(String output) {
    Matcher m =
        Pattern.compile("(?i)(?:hash|invoicehash)\\s*[:=]\\s*([A-Za-z0-9+/=]+)").matcher(output);
    if (m.find()) {
      return m.group(1);
    }
    return null;
  }

  private static String truncate(String s, int max) {
    if (s == null) {
      return "";
    }
    return s.length() <= max ? s : s.substring(0, max);
  }

  private static String safeMessage(String msg) {
    String lower = msg.toLowerCase();
    if (lower.contains("begin") || lower.contains("private") || lower.contains("miib")) {
      return "SDK operation failed";
    }
    return truncate(msg, 500);
  }

  private static String quote(String s) {
    if (s == null) {
      return "null";
    }
    StringBuilder sb = new StringBuilder("\"");
    for (int i = 0; i < s.length(); i++) {
      char c = s.charAt(i);
      switch (c) {
        case '\\':
          sb.append("\\\\");
          break;
        case '"':
          sb.append("\\\"");
          break;
        case '\n':
          sb.append("\\n");
          break;
        case '\r':
          sb.append("\\r");
          break;
        case '\t':
          sb.append("\\t");
          break;
        default:
          if (c < 0x20) {
            sb.append(String.format("\\u%04x", (int) c));
          } else {
            sb.append(c);
          }
      }
    }
    sb.append('"');
    return sb.toString();
  }

  private static String jsonError(String code, String message) {
    return "{\"error\":{\"type\":\"sidecar_error\",\"code\":"
        + quote(code)
        + ",\"message\":"
        + quote(message)
        + "}}";
  }

  private static String readBody(HttpExchange exchange) throws IOException {
    try (InputStream in = exchange.getRequestBody()) {
      ByteArrayOutputStream buf = new ByteArrayOutputStream();
      byte[] chunk = new byte[4096];
      int n;
      while ((n = in.read(chunk)) >= 0) {
        buf.write(chunk, 0, n);
      }
      return new String(buf.toByteArray(), StandardCharsets.UTF_8);
    }
  }

  private static void send(HttpExchange exchange, int status, String body) throws IOException {
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(status, bytes.length);
    try (OutputStream os = exchange.getResponseBody()) {
      os.write(bytes);
    }
  }

  private static String env(String key, String fallback) {
    String v = System.getenv(key);
    return v == null || v.isEmpty() ? fallback : v;
  }

  private static final class ExecResult {
    final int exitCode;
    final String stdout;
    final String stderr;

    ExecResult(int exitCode, String stdout, String stderr) {
      this.exitCode = exitCode;
      this.stdout = stdout == null ? "" : stdout;
      this.stderr = stderr == null ? "" : stderr;
    }
  }

  private SidecarServer() {}
}
