import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config"

export async function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname.startsWith("/login")

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && !isLogin) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    if (user && isLogin) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    // Sem isso, uma falha de configuração vira 500 em toda rota do site
    // (MIDDLEWARE_INVOCATION_FAILED) e nem a tela de login abre. Negar acesso
    // e mandar para /login mantém a proteção e deixa o erro visível lá.
    console.error("[Prism] middleware falhou ao verificar a sessão:", error)
    if (isLogin) return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
