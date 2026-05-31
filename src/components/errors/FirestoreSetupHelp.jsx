import { ExternalLink } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'

const RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /users/{userId}/{document=**} {
      allow read, write: if isOwner(userId);
    }
  }
}`

export default function FirestoreSetupHelp({ title = 'Database access blocked' }) {
  const copyRules = async () => {
    try {
      await navigator.clipboard.writeText(RULES_SNIPPET)
    } catch {
      // clipboard may be unavailable
    }
  }

  return (
    <Card className="max-w-2xl border-rose-500/20 bg-rose-500/5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">
        You are signed in, but Firestore security rules are not set for project{' '}
        <strong className="text-zinc-200">ap-tracker-62c9a</strong>. Paste the rules below in Firebase
        Console (takes about 2 minutes).
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
        <li>
          Open{' '}
          <a
            href="https://console.firebase.google.com/project/ap-tracker-62c9a/firestore/rules"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Firestore Rules
          </a>{' '}
          in Firebase Console
        </li>
        <li>Replace all text with the rules in the box below</li>
        <li>Click <strong>Publish</strong></li>
        <li>Refresh this page</li>
      </ol>
      <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-emerald-200/90">
        {RULES_SNIPPET}
      </pre>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={copyRules}>
          Copy rules
        </Button>
        <a
          href="https://console.firebase.google.com/project/ap-tracker-62c9a/firestore/rules"
          target="_blank"
          rel="noreferrer"
        >
          <Button type="button">
            Open Firebase Rules <ExternalLink size={14} className="ml-1 inline" />
          </Button>
        </a>
        <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
          Refresh app
        </Button>
      </div>
    </Card>
  )
}
