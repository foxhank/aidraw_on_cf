// import { errorHandling, telemetryData } from "./utils/middleware";
// export async function onRequestPost(context) {  // Contents of context object  
//     const {
//         request, // same as existing Worker API    
//         env, // same as existing Worker API    
//         params, // if filename includes [id] or [[path]]   
//         waitUntil, // same as ctx.waitUntil in existing Worker API    
//         next, // used for middleware or to fetch assets    
//         data, // arbitrary space for passing data between middlewares 
//     } = context;
//     const clonedRequest = request.clone();
//     await errorHandling(context);
//     telemetryData(context);
//     const url = new URL(clonedRequest.url);
//     const response = fetch('https://telegra.ph/' + url.pathname + url.search, {
//         method: clonedRequest.method,
//         headers: clonedRequest.headers,
//         body: clonedRequest.body,
//     });
//     return response;
// }
import { errorHandling, telemetryData } from "./utils/middleware";

// Add the following function to handle CORS
function addCORSHeaders(response) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
}

// Helper function to clone the body of the request
async function cloneBody(request) {
    const [body1, body2] = await request.body.tee();
    const arrayBuffer1 = await body1.arrayBuffer();
    const arrayBuffer2 = await body2.arrayBuffer();

    return new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: new Blob([arrayBuffer2]),
        credentials: request.credentials
    });
}

export async function onRequestPost(context) {
    const {
        request, // same as existing Worker API
        env, // same as existing Worker API
        params, // if filename includes [id] or [[path]]
        waitUntil, // same as ctx.waitUntil in existing Worker API
        next, // used for middleware or to fetch assets
        data, // arbitrary space for passing data between middlewares
    } = context;

    await errorHandling(context);
    telemetryData(context);

    // Clone the request to ensure we can read the body multiple times
    const clonedRequest = await cloneBody(request);

    const url = new URL(clonedRequest.url);

    // Check if this is a preflight request (OPTIONS)
    if (clonedRequest.method === 'OPTIONS') {
        return addCORSHeaders(new Response(null, { status: 204 }));
    }

    // Fetch the resource and forward the request
    const response = await fetch('https://telegra.ph/' + url.pathname + url.search, {
        method: clonedRequest.method,
        headers: clonedRequest.headers,
        body: clonedRequest.body,
    });

    // Add CORS headers to the response
    return addCORSHeaders(response);
}