/**
 * Renders HTML content in a sandboxed iframe with strict security.
 * Used for Antigravity Deep Researcher reports.
 */
export function HtmlRenderer({ content, title }) {
  // Security: refuse to render if content is empty
  if (!content) return null

  // CSP: allow inline styles + Tailwind CDN + Google Fonts, block everything else
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src https://cdn.tailwindcss.com 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: https:; connect-src https://fonts.googleapis.com https://fonts.gstatic.com;">`
  const sandboxedContent = csp + content

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200">
      <iframe
        srcDoc={sandboxedContent}
        sandbox="allow-scripts"
        className="w-full border-none"
        style={{ height: 'calc(100vh - 200px)' }}
        title={title || 'HTML Report'}
      />
    </div>
  )
}
