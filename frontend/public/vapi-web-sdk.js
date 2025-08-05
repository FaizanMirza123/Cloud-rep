// This is a small loader script to dynamically load the VAPI Web SDK
(function() {
  if (document.getElementById('vapi-web-sdk')) return;
  
  const script = document.createElement('script');
  script.id = 'vapi-web-sdk';
  script.src = 'https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/index.js';
  script.async = true;
  document.head.appendChild(script);
})();
