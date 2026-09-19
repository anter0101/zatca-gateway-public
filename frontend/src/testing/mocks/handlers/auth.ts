/**
 * MSW request handlers for auth API.
 *
 * To use: install msw (npm i -D msw), then in jest.setup.ts or a test file:
 *   import { setupServer } from "msw/node";
 *   import { authHandlers } from "@/testing/mocks/handlers/auth";
 *   const server = setupServer(...authHandlers);
 *   beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close());
 */

// When using MSW, uncomment and adjust:
// import { http, HttpResponse } from "msw";

export const authHandlers = [
  // http.post("/api/auth/login", async ({ request }) => {
  //   const body = await request.json() as { email: string; password: string };
  //   if (body.email && body.password) {
  //     return HttpResponse.json({ token: "fake-jwt" }, { status: 200 });
  //   }
  //   return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  // }),
];
