export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Beatinbox",
    "url": "https://beatinbox.com",
    "description": "Discover and stream music on Beatinbox - Your ultimate music streaming platform",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://beatinbox.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
