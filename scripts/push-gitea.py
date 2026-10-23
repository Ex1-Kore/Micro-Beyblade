#!/usr/bin/env python3
"""Push the local main branch to a Gitea repository."""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"
REPO_NAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
COMMIT_MESSAGE = "commit by python script"


def load_env_file() -> dict[str, str]:
    values: dict[str, str] = {}
    if not ENV_FILE.is_file():
        raise RuntimeError(f"Environment file not found: {ENV_FILE}")

    for raw_line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        key, separator, value = line.partition("=")
        if not separator:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key.strip()] = value

    return values


def validate_base_url(value: str) -> str:
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise RuntimeError("GITEA_BASE_URL must be an http(s) URL")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise RuntimeError("GITEA_BASE_URL must not contain credentials, query, or fragment")
    return value.rstrip("/")


def get_gitea_login(base_url: str, token: str) -> str:
    parsed = urlsplit(base_url)
    api_url = f"{parsed.scheme}://{parsed.netloc}/api/v1/user"
    request = Request(
        api_url,
        headers={"Authorization": f"token {token}", "Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=15) as response:
            user = json.load(response)
    except HTTPError as error:
        raise RuntimeError(f"Gitea authentication failed (HTTP {error.code})") from None
    except (URLError, TimeoutError, json.JSONDecodeError):
        raise RuntimeError("Could not verify credentials with Gitea") from None

    login = user.get("login") if isinstance(user, dict) else None
    if not isinstance(login, str) or not login:
        raise RuntimeError("Gitea user response did not contain a login")
    return login


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Push local main to a repository under GITEA_BASE_URL."
    )
    parser.add_argument("repo", nargs="?", help="Gitea repository name")
    args = parser.parse_args()

    repo_name = (args.repo or input("Gitea repository name: ")).strip()
    if not REPO_NAME_PATTERN.fullmatch(repo_name) or repo_name in {".", ".."}:
        print("Invalid repository name.", file=sys.stderr)
        return 2

    try:
        env_values = load_env_file()
        base_url = validate_base_url(env_values.get("GITEA_BASE_URL", ""))
        token = env_values.get("GITEA_ACCESS_TOKEN", "")
        if not token:
            raise RuntimeError("GITEA_ACCESS_TOKEN is missing from .env")
    except (OSError, RuntimeError) as error:
        print(error, file=sys.stderr)
        return 2

    branch_check = subprocess.run(
        ["git", "rev-parse", "--verify", "refs/heads/main"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if branch_check.returncode:
        print("Local branch main was not found.", file=sys.stderr)
        return 2

    try:
        login = get_gitea_login(base_url, token)
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 2

    remote_url = f"{base_url}/{repo_name}.git"
    status = subprocess.run(
        ["git", "status", "--short", "--untracked-files=all"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if status.returncode:
        print("Could not inspect working tree status.", file=sys.stderr)
        return status.returncode

    print(f"Target: {remote_url}")
    print("Branch: main -> main")
    print(f"Commit message: {COMMIT_MESSAGE}")
    print("Files to stage:")
    print(status.stdout if status.stdout else "(no changes)")
    print("Confirmation: automatic")

    stage = subprocess.run(
        ["git", "add", "-A"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if stage.returncode:
        print(stage.stderr, file=sys.stderr, end="")
        return stage.returncode

    staged = subprocess.run(
        ["git", "diff", "--cached", "--quiet"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if staged.returncode == 1:
        commit = subprocess.run(
            ["git", "commit", "-m", COMMIT_MESSAGE],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        commit_output = commit.stdout + commit.stderr
        if commit_output:
            print(commit_output, end="" if commit_output.endswith("\n") else "\n")
        if commit.returncode:
            return commit.returncode
    elif staged.returncode != 0:
        print(staged.stderr, file=sys.stderr, end="")
        return staged.returncode
    else:
        print("No changes to commit; continuing with push.")

    encoded_credentials = base64.b64encode(f"{login}:{token}".encode()).decode()
    git_env = os.environ.copy()
    git_env["GIT_TERMINAL_PROMPT"] = "0"
    git_env["GIT_CONFIG_COUNT"] = "2"
    git_env["GIT_CONFIG_KEY_0"] = "credential.helper"
    git_env["GIT_CONFIG_VALUE_0"] = ""
    git_env["GIT_CONFIG_KEY_1"] = f"http.{remote_url}.extraHeader"
    git_env["GIT_CONFIG_VALUE_1"] = f"Authorization: Basic {encoded_credentials}"

    result = subprocess.run(
        ["git", "push", remote_url, "main:main"],
        cwd=ROOT,
        env=git_env,
        capture_output=True,
        text=True,
        check=False,
    )
    output = (result.stdout + result.stderr).replace(token, "[REDACTED]")
    output = output.replace(encoded_credentials, "[REDACTED]")
    if output:
        print(output, end="" if output.endswith("\n") else "\n")
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())