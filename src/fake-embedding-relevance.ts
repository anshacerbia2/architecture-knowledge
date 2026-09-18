// A token-hash simulation has no semantic similarity capability. Verify an
// unhashed content-token match before allowing its vector hits to seed retrieval.
// Do not apply this lexical requirement to real semantic embedding providers.
const FUNCTION_WORDS = new Set(
  "a am an and are as at be been being but by can could did do does for from had has have how i if in into is it its may might must no nor not of on or our shall should than that the their them there these they this those to was we were what when where which who why will with would you your".split(
    " ",
  ),
);

export function fakeEmbeddingHasTokenOverlap(query: string, candidate: string): boolean {
  return contentTokenOverlapCount(query, candidate) > 0;
}

export function contentTokens(text: string): string[] {
  return [...new Set(tokens(text).filter((term) => !FUNCTION_WORDS.has(term)))];
}

export function contentTokenOverlapCount(query: string, candidate: string): number {
  const candidateTerms = new Set(tokens(candidate));
  return contentTokens(query).filter((term) => candidateTerms.has(term)).length;
}

function tokens(text: string): string[] {
  return text.toLocaleLowerCase("en-US").match(/[\p{L}\p{N}-]+/gu) ?? [];
}
