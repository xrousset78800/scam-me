import { NextRequest, NextResponse } from "next/server";

/**
 * HTTP Basic Auth — protection pendant le développement.
 * Désactiver en prod en retirant HTPASSWD_USER / HTPASSWD_PASS des env vars.
 */
export function middleware(req: NextRequest) {
  // Bypass si les variables ne sont pas définies (prod sans protection)
  const user = process.env.HTPASSWD_USER;
  const pass = process.env.HTPASSWD_PASS;
  if (!user || !pass) return NextResponse.next();

  // Bypass pour les assets Next.js internes
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [inputUser, inputPass] = decoded.split(":");
      if (inputUser === user && inputPass === pass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Accès non autorisé", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="scam.me — dev"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
