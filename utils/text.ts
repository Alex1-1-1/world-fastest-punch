export function unquoteOnce(s?: string | null) {
  if (typeof s !== "string") return "";
  const original = s.trim();
  const cleaned = original.replace(/^[\s"“"'「『]+|[\s"“"'」』]+$/g, "");
  console.log('unquoteOnce デバッグ:', { original, cleaned });
  return cleaned;
}
