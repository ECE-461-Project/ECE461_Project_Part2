#!/usr/bin/env python3
import subprocess
import re

def main():
    to_run = ['npx', 'jest', '--silent=true', '--coverage']
    process = subprocess.run(to_run, capture_output=True, encoding='utf-8')
    lines = process.stdout.split('\n')
    for line in lines:
      if "All files" in line:
        parts = line.split('|')
        percentage = parts[4].strip()
    lines = process.stderr.split('\n')
    for line in lines:
      if "Tests:" in line:
        line = str(line)
        match = re.search(r"([0-9]+ failed, )?([0-9]+) passed, ([0-9]+) total", line)
        passed = match.group(2)
        total = match.group(3)
    print(f"{passed}/{total} test cases passed. {percentage}% line coverage achieved")


if __name__ == "__main__":
    main()
