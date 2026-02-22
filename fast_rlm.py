import json
import os
import subprocess
import tempfile


def run(query: str, prefix: str = None, verbose: bool = True) -> dict:
    output_file = tempfile.mktemp(suffix=".json")
    cmd = ["deno", "task", "-q", "subagent", "--output", output_file]
    if prefix:
        cmd += ["--prefix", prefix]

    subprocess.run(
        cmd,
        input=query,
        text=True,
        stdout=None if verbose else subprocess.DEVNULL,
        stderr=None if verbose else subprocess.DEVNULL,
    )

    data = json.loads(open(output_file).read())
    os.unlink(output_file)

    if "error" in data:
        raise RuntimeError(f"fast-rlm subagent failed: {data['error']}")

    return data
