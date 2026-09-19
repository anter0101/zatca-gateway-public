"use client";
import React from "react";

import client from "@/lib/client";
type Props = Readonly<{
  children: React.ReactNode;
  token: string;
}>;

export default function AuthTokenProvider({ children, token }: Props) {
  if (token) {
    client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  return <>{children}</>;
}
