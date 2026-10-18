#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo 'ต้องรันสคริปต์นี้บน macOS ที่ติดตั้ง Xcode' >&2
  exit 1
fi

npm ci
npm test
npm run build
npx cap sync ios

build_root="$(pwd)/build/ios"
derived_data="$build_root/DerivedData"
mkdir -p "$build_root"

xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$derived_data" \
  CODE_SIGN_IDENTITY='' \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO \
  build

app="$derived_data/Build/Products/Release-iphoneos/App.app"
test -d "$app"
test -f "$app/public/index.html"
test -f "$app/Info.plist"

stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/Payload"
cp -R "$app" "$stage/Payload/App.app"
rm -rf "$stage/Payload/App.app/_CodeSignature"
rm -f "$stage/Payload/App.app/embedded.mobileprovision"

ipa="$build_root/Gyro-Space-Lab-unsigned.ipa"
rm -f "$ipa"
(cd "$stage" && zip -qr "$ipa" Payload)
test -s "$ipa"
unzip -tq "$ipa" >/dev/null
echo "IPA ready: $ipa"
