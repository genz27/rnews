#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
export ANDROID_HOME ANDROID_SDK_ROOT="$ANDROID_HOME"
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > "$ROOT/android/local.properties"
GRADLE="${GRADLE_BIN:-$HOME/gradle/gradle-8.7/bin/gradle}"
if [ ! -x "$GRADLE" ]; then
  GRADLE="$(command -v gradle)"
fi
"$GRADLE" -p "$ROOT/android" assembleRelease --no-daemon
echo "APK: $ROOT/android/app/build/outputs/apk/release/app-release.apk"
