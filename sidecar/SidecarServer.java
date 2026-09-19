import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

/**
 * Phase 0 stub: health + 501 on /internal/* until Phase 3 implements fatoora ops.
 */
public final class SidecarServer {
  public static void main(String[] args) throws Exception {
    int port = Integer.parseInt(System.getenv().getOrDefault("SIDECAR_PORT", "8090"));
    HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

    server.createContext("/health", exchange -> {
      if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
        send(exchange, 405, "{\"error\":\"method_not_allowed\"}");
        return;
      }
      send(exchange, 200, "{\"status\":\"ok\"}");
    });

    server.createContext("/internal", exchange -> {
      if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
        send(exchange, 405, "{\"error\":\"method_not_allowed\"}");
        return;
      }
      send(
          exchange,
          501,
          "{\"error\":{\"type\":\"not_implemented\",\"code\":\"sidecar_stub\",\"message\":\"CSR/sign/validate/invoice-request land in Phase 3\"}}");
    });

    server.setExecutor(null);
    System.out.println("zatca sidecar listening on :" + port + " (FATOORA_HOME=" + System.getenv("FATOORA_HOME") + ")");
    server.start();
  }

  private static void send(HttpExchange exchange, int status, String body) throws IOException {
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(status, bytes.length);
    try (OutputStream os = exchange.getResponseBody()) {
      os.write(bytes);
    }
  }

  private SidecarServer() {}
}
