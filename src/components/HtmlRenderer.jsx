/**
 * Renders HTML content in a sandboxed iframe with strict security.
 * Used for Antigravity Deep Researcher reports.
 */
export function HtmlRenderer({ content, title }) {
  // Security: refuse to render if content is empty
  if (!content) return null;

  // Inject CSP meta tag to block external resource loading
  const csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:;">';
  const sandboxedContent = csp + content;

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200">
      <iframe
        srcDoc={sandboxedContent}
        sandbox=""
        className="w-full border-none"
        style={{ height: 'calc(100vh - 200px)' }}
        title={title || 'HTML Report'}
      />
    </div>
  );
}
