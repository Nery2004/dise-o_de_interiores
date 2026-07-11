import { NextResponse } from "next/server";

export function proxy() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/dev/status",
};
