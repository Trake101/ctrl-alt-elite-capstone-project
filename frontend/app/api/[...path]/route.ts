import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path);
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  // Get backend URL from environment variable (read at runtime)
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    (process.env.NODE_ENV === 'production' ? null : 'http://c455_backend:8000');

  if (!backendUrl) {
    console.error(
      '[API Proxy] ERROR: NEXT_PUBLIC_BACKEND_URL is not set. ' +
        'Please set NEXT_PUBLIC_BACKEND_URL in Railway to your backend service URL.'
    );
    return NextResponse.json(
      { error: 'Backend URL not configured' },
      { status: 500 }
    );
  }

  // Validate URL format
  const cleanBackendUrl = backendUrl.replace(/\/$/, '');
  if (
    !cleanBackendUrl.startsWith('http://') &&
    !cleanBackendUrl.startsWith('https://')
  ) {
    console.error(
      `[API Proxy] ERROR: Backend URL must start with http:// or https://. Current value: ${cleanBackendUrl}`
    );
    return NextResponse.json(
      { error: 'Invalid backend URL format' },
      { status: 500 }
    );
  }

  // Build the target URL
  const path = pathSegments.join('/');
  const targetUrl = `${cleanBackendUrl}/api/${path}`;

  // Get query string from the original request
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = searchParams
    ? `${targetUrl}?${searchParams}`
    : targetUrl;

  console.log(`[API Proxy] Proxying ${request.method} ${request.nextUrl.pathname} -> ${fullUrl}`);

  try {
    // Get the request body if it exists
    let body: BodyInit | undefined;
    const contentType = request.headers.get('content-type');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (contentType?.includes('application/json')) {
        body = await request.text();
      } else {
        body = await request.arrayBuffer();
      }
    }

    // Forward the request to the backend
    const response = await fetch(fullUrl, {
      method: request.method,
      headers: {
        // Forward all headers except host
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) => key.toLowerCase() !== 'host'
          )
        ),
      },
      body,
    });

    // Handle responses that should not have a body (204 No Content, 304 Not Modified)
    if (response.status === 204 || response.status === 304) {
      return new NextResponse(null, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
        },
      });
    }

    // Get response body
    const responseBody = await response.arrayBuffer();

    // Create response with the same status and headers
    const proxiedResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        // Forward response headers
        ...Object.fromEntries(response.headers.entries()),
      },
    });

    return proxiedResponse;
  } catch (error) {
    console.error(`[API Proxy] Error proxying request to ${fullUrl}:`, error);
    return NextResponse.json(
      {
        error: 'Failed to proxy request to backend',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}

