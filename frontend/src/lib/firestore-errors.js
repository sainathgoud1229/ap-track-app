export function isFirestorePermissionError(message) {
  return /permission|insufficient/i.test(String(message ?? ''))
}
