export default {
  async fetch(request, env) {
    const originalHost = request.headers.get("host");

    // 设置CORS头部
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // 允许任何源
      'Access-Control-Allow-Methods': 'GET, POST', // 允许的请求方法
      'Access-Control-Allow-Headers': 'Content-Type' // 允许的请求头
    };

    // 如果这是一个预检请求，则直接返回CORS头部
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // 检查请求方法
    if (request.method === 'POST') {
      // 处理 POST 请求，用于 AI 绘画功能
      const data = await request.json();
      
      let model = '@cf/stabilityai/stable-diffusion-xl-base-1.0'; // 默认模型

      // 检查 prompt 是否存在
      if (!('prompt' in data) || data.prompt.trim() === '') {
        return new Response('Missing prompt', { status: 400, headers: corsHeaders });
      }

      // 检查 model 是否存在，如果没有则使用默认模型
      if ('model' in data) {
        switch(data.model) {
          case 'dreamshaper-8-lcm':
            model = '@cf/lykon/dreamshaper-8-lcm';
            break;
          case 'stable-diffusion-xl-base-1.0':
            model = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
            break;
          case 'stable-diffusion-xl-lightning':
            model = '@cf/bytedance/stable-diffusion-xl-lightning';
            break;
          default:
            break;
        }
      }

      const inputs = {
        prompt: data.prompt.trim(),
        width: data.resolution?.width ?? 1024,
        height: data.resolution?.height ?? 1024
      };

      const response = await env.AI.run(model, inputs);
      return new Response(response, {
        headers: {
          ...corsHeaders, // 合并CORS头部
          'content-type': 'image/png;base64',
        },
      });
    } else {
        return new Response(null, {
            status: 200,
            headers: corsHeaders
          });
    }
  }
};