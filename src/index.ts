
import { AwsV4Signer } from 'aws4fetch'

function Function_extractDataUrlProxy(arn: string): { functionName: string; region: string } {
    const parts = arn.split(':');
    return {
        functionName: parts[6],
        region: parts[3]
    };
}

async function Function_fetchFunctionAws(
    functionName: string,
    region: string,
    token: string,
    url: string,
    requestInit: RequestInit,
    awsAccessKeyId: string,
    awsSecretAccessKey: string
): Promise<Response> {
    
    // O endpoint para invocação direta da AWS Lambda
    const lambdaUrl = new URL(`https://lambda.${region}.amazonaws.com/2015-03-31/functions/${functionName}/invocations`);

    // Payload para a Lambda com os parâmetros necessários
    const payload = {
        token: token,
        url: url,
        method: requestInit.method,
        body: requestInit.body,
        headers: requestInit.headers
    };

    // Crie a instância do signer com as credenciais
    const signer = new AwsV4Signer({
        url: lambdaUrl.toString(),
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
        region: region,
        service: 'lambda',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    // Crie a requisição que será assinada
    const signedRequest = await signer.sign();

    // Envie a requisição assinada para a AWS
    const response = await fetch(signedRequest.url, {
        method: signedRequest.method,
        headers: signedRequest.headers,
        body: signedRequest.body,
    });

    // Verifique se a invocação foi bem-sucedida
    if (response.status === 200) {
        const rawResponse = await response.text();
        
        // Remove caracteres nulos e divide por possíveis JSONs concatenados
        const cleanedResponse = rawResponse.replace(/\0/g, '');
        const jsonParts = cleanedResponse.split(/(?={)/);
        
        // Pega o último JSON da resposta (geralmente contém o resultado real)
        const lastJson = jsonParts[jsonParts.length - 1];
        
        try {
            const parsedResponse = JSON.parse(lastJson);
            
            // Se a resposta tem statusCode e body (formato AWS Lambda Proxy)
            if (parsedResponse.statusCode) {
                return new Response(parsedResponse.body || lastJson, {
                    status: parsedResponse.statusCode,
                    headers: parsedResponse.headers || { 'Content-Type': 'application/json' }
                });
            }
            
            // Caso seja um JSON direto
            return new Response(lastJson, {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) {
            console.error('Error parsing Lambda response:', e);
            return new Response(lastJson, {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } else {
        const errorText = await response.text();
        return new Response(`Error invoking Lambda: ${response.status} ${errorText}`, { status: 500 });
    }
}

export default {
    async fetch(Parameter_request: Request, Parameter_env: { D1_proxyManagerAll: D1Database, EnvSecret_tokenProxySelf: string, EnvSecret_listProxy: string, EnvSecret_awsAccessKeyId: string, EnvSecret_awsSecretAccessKey: string }, Parameter_context: ExecutionContext): Promise<Response> {
        const Const_newUrl = new URL(Parameter_request.url)
        const Const_pathname = Const_newUrl.pathname.endsWith('/') && Const_newUrl.pathname.length > 1 ? Const_newUrl.pathname.slice(0, -1) : Const_newUrl.pathname;

        let Let_proxyNumber: number = 0

        /* if (Const_pathname === '/test') {
            // Detalhes da sua função Lambda
            const functionName = 'proxy-single-27';
            const awsRegion = 'eu-south-2'; // Região da sua Lambda

            // O payload (dados) que você quer enviar para a sua Lambda
            const payload = {
                key1: 'value1',
                key2: 'value2',
            };

            // O endpoint para invocação direta da AWS Lambda
            const url = new URL(`https://lambda.${awsRegion}.amazonaws.com/2015-03-31/functions/${functionName}/invocations`);

            // Crie a instância do signer com as credenciais dos Secrets
            const signer = new AwsV4Signer({
                url: url.toString(),
                accessKeyId: Parameter_env.EnvSecret_awsAccessKeyId,
                secretAccessKey: Parameter_env.EnvSecret_awsSecretAccessKey,
                region: awsRegion,
                service: 'lambda',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            // Crie a requisição que será assinada
            const signedRequest = await signer.sign();

            try {
                // Envie a requisição assinada para a AWS
                const response = await fetch(signedRequest.url, {
                    method: signedRequest.method,
                    headers: signedRequest.headers,
                    body: signedRequest.body,
                });

                return response
            }

            catch (error) {
                console.log('Error invoking Lambda:', error);
                return new Response(`Fetch error: ${error}`, { status: 500 });
            }
        } */

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
                    'H31ffadrg3bb7',
                    'X-Requested-With',
                ]

                for (let Let_single of Const_allowedHeaders) {
                    if (Parameter_request.headers.get(Let_single) || Parameter_request.headers.get(Let_single)) {
                        (Let_requestInitFetch.headers as Record<string, string>)[Let_single] = (Parameter_request.headers.get(Let_single) || Parameter_request.headers.get(Let_single)) as string
                    }
                }

                const Const_urlProxy = Const_listProxy[Let_proxyNumber - 1] || Const_listProxy[0]
                if (Const_urlProxy.startsWith('http')) {
                    // Modifica URL \/
                    Let_urlFetch = Const_urlProxy + '/?token=' + Const_tokenEnv + '&url=' + encodeURIComponent(Let_urlFetch)
                    // Modifica URL /\

                    const response = await fetch(Let_urlFetch, Let_requestInitFetch);
                    return new Response(response.body, {
                        status: response.status,
                        headers: {
                            ...Object.fromEntries(response.headers),
                            'X-Proxy-Used': Const_urlProxy
                        }
                    });
                }

                else if (Const_urlProxy.startsWith('arn')) {
                    try {
                        const Const_extractDataUrlProxy = Function_extractDataUrlProxy(Const_urlProxy)
                        const Const_functionNameUrlProxy = Const_extractDataUrlProxy.functionName
                        const Const_regionUrlProxy = Const_extractDataUrlProxy.region

                        const Const_fetchFunctionAws = await Function_fetchFunctionAws(Const_functionNameUrlProxy, Const_regionUrlProxy, Const_tokenEnv, Let_urlFetch, Let_requestInitFetch, Parameter_env.EnvSecret_awsAccessKeyId, Parameter_env.EnvSecret_awsSecretAccessKey)
                        return Const_fetchFunctionAws
                    }

                    catch (error) {
                        console.error('Error invoking Lambda:', error);
                        return new Response('Lambda Invocation Error', { status: 455 });
                    }
                }

                return new Response('Bad Gateway', { status: 456 })
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
