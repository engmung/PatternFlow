import Link from "next/link";

export default function NotFound() {
  return (
    <main className="signal-lost">
      <h1>404</h1>
      <Link href="/">Return to main</Link>
    </main>
  );
}
