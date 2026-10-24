---
name: gitea-push
description: Use when the user asks to commit and push this Micro-Beyblade repository to Gitea. Use the repository's scripts/push-gitea.py workflow; do not substitute a different remote or push method.
---

# Gitea Commit and Push

For an explicit request to commit and push this repository to Gitea, use the existing `scripts/push-gitea.py` script. Do not run raw `git push`, GitHub tooling, or another repository's credentials for this workflow.

Run from the repository root:

```bash
python3 scripts/push-gitea.py Micro-Beyblade
```

The script reads `GITEA_BASE_URL` and `GITEA_ACCESS_TOKEN` from the repository `.env`, targets `<GITEA_BASE_URL>/Micro-Beyblade.git`, and pushes local `main` to remote `main`. It stages all repository changes with `git add -A`, commits staged changes using the exact message `commit by python script`, then pushes without force. If there are no staged changes, it skips creating a commit and continues to push.

The script displays the target and changed-file list, then proceeds automatically without a second interactive confirmation after the user has explicitly asked to run it. It must never print or persist the token. If authentication, commit, or push fails, report the actual error and stop. Never change the target, branch, or history to work around a failure without the user's instruction.
