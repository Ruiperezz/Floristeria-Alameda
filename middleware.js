export const config = {
  matcher: '/(.*)',
}

export default function middleware(request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const base64 = authHeader.split(' ')[1]
    const [user, password] = atob(base64).split(':')

    if (user === 'alameda' && password === 'floristeria2024') {
      return
    }
  }

  return new Response('Acceso restringido.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Floristería Alameda"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
