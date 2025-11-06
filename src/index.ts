

export default {
    async fetch(Parameter_request: Request, Parameter_env: { D1_proxyManagerAll: D1Database, EnvSecret_tokenProxySelf: string, EnvSecret_listProxy: string }, Parameter_context: ExecutionContext): Promise<Response> {
        const Const_newUrl = new URL(Parameter_request.url)
        const Const_pathname = Const_newUrl.pathname.endsWith('/') && Const_newUrl.pathname.length > 1 ? Const_newUrl.pathname.slice(0, -1) : Const_newUrl.pathname;

        let Let_proxyNumber: number = 0

        if (Const_pathname === '/proxy-manager') {
            try {
                // Lista de links proxy-single \/
                const Const_listProxy: string[] = Parameter_env.EnvSecret_listProxy?.replace(/\s+/g, '')?.split(',')
                // Lista de links proxy-single /\


                // Autenticação \/
                const Const_tokenEnv = Parameter_env.EnvSecret_tokenProxySelf

                const Const_tokenQueryRequest = Const_newUrl.searchParams.get('token')
                const Const_urlQueryRequest = Const_newUrl.searchParams.get('url')
                const Const_methodRequest = Parameter_request.method
                const Const_bodyRequest = Parameter_request.body

                if (Const_tokenQueryRequest !== Const_tokenEnv) {
                    console.log('Invalid token:', Const_tokenQueryRequest)
                    return new Response('Invalid token', { status: 451 })
                }

                if (!Const_urlQueryRequest) {
                    console.log('Missing url parameter')
                    return new Response('Missing url parameter', { status: 452 })
                }

                if (Const_methodRequest?.toUpperCase() !== 'GET' && Const_methodRequest?.toUpperCase() !== 'POST') {
                    console.log('Invalid method:', Const_methodRequest)
                    return new Response('Method Not Allowed', { status: 453 })
                }
                // Autenticação /\


                // Seleciona proxy \/
                const Const_urlQueryRequestHost = new URL(Const_urlQueryRequest).host

                const Const_resultD1 = await Parameter_env.D1_proxyManagerAll.prepare(`
                    INSERT INTO increment (host_increment, proxy_count_increment)
                    VALUES (?1, 1)
                    ON CONFLICT(host_increment) DO UPDATE SET
                        proxy_count_increment = CASE
                            WHEN excluded.proxy_count_increment + increment.proxy_count_increment > ${Const_listProxy.length} THEN 1
                            ELSE excluded.proxy_count_increment + increment.proxy_count_increment
                        END
                    RETURNING proxy_count_increment;
                `).bind(Const_urlQueryRequestHost).all<{ proxy_count_increment: number; }>()

                if (!Const_resultD1?.results?.[0]) {
                    console.log('Failed to retrieve proxy count from database')
                    return new Response('Internal Server Error', { status: 454 })
                }

                Let_proxyNumber = Const_resultD1.results[0].proxy_count_increment
                // Seleciona proxy /\


                // Realiza request \/
                let Let_urlFetch: string = ''
                let Let_requestInitFetch: RequestInit = { headers: {} }

                if (Const_urlQueryRequest) {
                    Let_urlFetch = Const_urlQueryRequest
                }

                if (Const_methodRequest) {
                    Let_requestInitFetch.method = Const_methodRequest
                }

                if (Const_bodyRequest) {
                    Let_requestInitFetch.body = Const_bodyRequest
                }

                const Const_allowedHeaders = [
                    'Accept-Language',
                    'Authorization',
                    'Content-Type',
                    'Sec-CH-UA',
                    'Sec-CH-UA-Mobile',
                    'Sec-CH-UA-Platform',
                    'Sec-Fetch-Dest',
                    'Sec-Fetch-Mode',
                    'Sec-Fetch-Site',
                    'Sec-Fetch-User',
                    'Referer',
                ]

                for (let Let_single of Const_allowedHeaders) {
                    if (Parameter_request.headers.get(Let_single) || Parameter_request.headers.get(Let_single)) {
                        (Let_requestInitFetch.headers as Record<string, string>)[Let_single] = (Parameter_request.headers.get(Let_single) || Parameter_request.headers.get(Let_single)) as string
                    }
                }

                // Modifica URL \/
                Let_urlFetch = (Const_listProxy[Let_proxyNumber - 1] || Const_listProxy[0]) + '/?token=' + Const_tokenEnv + '&url=' + encodeURIComponent(Let_urlFetch)
                // Modifica URL /\

                return (await fetch(Let_urlFetch, Let_requestInitFetch))
                // Realiza request /\
            }

            catch (Parameter_error) {
                console.error('Error processing request:', Parameter_error)
                return new Response('Internal Server Error', { status: 450 })
            }
        }

        return new Response('Not Found', { status: 404 });
    }
}
