import { toast } from "react-toastify";

import LoginForm from "@/components/auth/login-form";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// mock useRouter from next-intl/navigation
jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

//  mock translations
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const dict: Record<string, string> = {
      email: "Email",
      "enter-email": "Enter your email",
      password: "Password",
      "enter-password": "Enter your password",
      "sign-in": "Sign In",
      "signing-in": "Signing In...",
      "login-successful": "Login successful",
      "login-failed": "Login failed",
      "unexpected-error": "Unexpected error",
    };
    return dict[key] || key;
  },
}));

// mock toast
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  it("renders email and password inputs", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows validation errors if form submitted empty", async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email/i)).toBeInTheDocument();
      expect(screen.getByText(/password/i)).toBeInTheDocument();
    });
  });

  it("calls API and shows success on valid credentials", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "fake-jwt" }),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@gmail.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "test123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Login successful");
    });
  });

  it("shows error toast when API fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "wrong@gmail.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    });
  });

  it("shows unexpected error if fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@gmail.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "test123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unexpected error");
    });
  });
});
