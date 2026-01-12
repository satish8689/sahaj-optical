
export default function RootLayout({ children }) {
   const path = headers().get("x-pathname") || "";

  const manifest =
    path.startsWith("/admin")
      ? "/manifest-admin.json"
      : "/manifest.json";

  return (
    <html lang="en">
       <head>
        <link rel="manifest" href={manifest} />
      </head>
      <body>{children}</body>
    </html>
  )
}
