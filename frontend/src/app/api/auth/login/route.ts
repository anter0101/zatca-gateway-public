import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { SignInResponse } from "next-auth/react";

import { signIn } from "@/lib/authentication/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, token, user } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 },
      );
    }

    const result = (await signIn("credentials", {
      email,
      password,
      ...(token && { token }),
      ...(user && { user }),
      redirect: false,
    })) as SignInResponse;

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: String(error) },
      { status: 500 },
    );
  }
}
