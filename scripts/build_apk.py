#!/usr/bin/env python3
"""Build the COMU Field Logs Android package from this repository.

Copyright 2026 lambdadriver. GPL-3.0. See LICENSE.

Unsigned by default. The unsigned zip entries for classes.dex, the compiled
manifest, resources.arsc, and res/ are what to compare with the published APK.
Signing with a key you supply uses APK Signature Scheme v2 and v3, with v4 off.
This script never creates or reads a keystore that lives in the repository.

Toolchain that produced the published file's unsigned contents:
  Android SDK build-tools 36.0.0, platform android-36, JDK 21,
  javac -source 8 -target 8, d8 --release --min-api 24, zipalign -f 4.
"""
import argparse, glob, os, shutil, subprocess, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION = "1.1"
VCODE = "2"

def run(cmd, env):
    p = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if p.returncode:
        sys.stderr.write(" ".join(cmd) + "\n" + p.stdout[-3000:] + p.stderr[-3000:] + "\n")
        sys.exit(p.returncode)
    return p.stdout

def main():
    ap = argparse.ArgumentParser(description="Build COMU Field Logs from this repo.")
    ap.add_argument("--sdk", default=os.environ.get("ANDROID_SDK_ROOT") or os.environ.get("ANDROID_HOME") or "",
                    help="Android SDK root (platforms/android-36 and build-tools/36.0.0)")
    ap.add_argument("--ks", default="", help="Optional PKCS12 or JKS keystore you created. Not stored in git.")
    ap.add_argument("--ks-pass-file", default="", help="File whose contents are the keystore password. Never commit it.")
    ap.add_argument("--ks-alias", default="comufieldlogs")
    ap.add_argument("--out", default=os.path.join(ROOT, "dist"))
    args = ap.parse_args()
    if not args.sdk:
        sys.exit("Set ANDROID_SDK_ROOT or pass --sdk. Need platforms/android-36 and build-tools/36.0.0.")
    bt = os.path.join(args.sdk, "build-tools", "36.0.0")
    jar = os.path.join(args.sdk, "platforms", "android-36", "android.jar")
    for tool in ("aapt2", "d8", "zipalign"):
        if not os.path.isfile(os.path.join(bt, tool)):
            sys.exit("Missing " + os.path.join(bt, tool))
    if not os.path.isfile(jar):
        sys.exit("Missing " + jar)
    env = os.environ.copy()
    if os.environ.get("JAVA_HOME"):
        env["PATH"] = os.path.join(os.environ["JAVA_HOME"], "bin") + os.pathsep + env.get("PATH", "")
    b = os.path.join(ROOT, "build")
    shutil.rmtree(b, ignore_errors=True)
    assets = os.path.join(b, "assets", "www")
    os.makedirs(assets)
    src_www = os.path.join(ROOT, "web", "assets-www")
    for dirpath, _, files in os.walk(src_www):
        for fn in files:
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, src_www)
            dest = os.path.join(assets, rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copy(full, dest)
    os.makedirs(os.path.join(b, "gen"))
    os.makedirs(os.path.join(b, "classes"))
    os.makedirs(os.path.join(b, "dex"))
    res_zip = os.path.join(b, "res.zip")
    run([os.path.join(bt, "aapt2"), "compile", "--dir", os.path.join(ROOT, "android", "res"), "-o", res_zip], env)
    base = os.path.join(b, "base.apk")
    run([os.path.join(bt, "aapt2"), "link", "-I", jar, "--manifest", os.path.join(ROOT, "android", "AndroidManifest.xml"),
         "-o", base, "--java", os.path.join(b, "gen"), "--min-sdk-version", "24", "--target-sdk-version", "36",
         "--version-code", VCODE, "--version-name", VERSION, "-A", os.path.join(b, "assets"),
         "--auto-add-overlay", res_zip], env)
    srcs = glob.glob(os.path.join(ROOT, "android", "java", "**", "*.java"), recursive=True)
    srcs += glob.glob(os.path.join(b, "gen", "**", "*.java"), recursive=True)
    run(["javac", "-source", "8", "-target", "8", "-Xlint:-options", "-encoding", "UTF-8",
         "-bootclasspath", jar, "-classpath", jar, "-d", os.path.join(b, "classes")] + srcs, env)
    classes = glob.glob(os.path.join(b, "classes", "**", "*.class"), recursive=True)
    run([os.path.join(bt, "d8"), "--release", "--min-api", "24", "--lib", jar,
         "--output", os.path.join(b, "dex")] + classes, env)
    unsigned = os.path.join(b, "unsigned.apk")
    shutil.copy(base, unsigned)
    with zipfile.ZipFile(unsigned, "a", zipfile.ZIP_DEFLATED) as z:
        z.write(os.path.join(b, "dex", "classes.dex"), "classes.dex")
    os.makedirs(args.out, exist_ok=True)
    aligned = os.path.join(args.out, "COMU_Field_Logs-aligned-unsigned.apk")
    run([os.path.join(bt, "zipalign"), "-f", "4", unsigned, aligned], env)
    print("unsigned", aligned)
    if not args.ks:
        return
    if not args.ks_pass_file:
        sys.exit("--ks-pass-file is required with --ks. Do not put the password on the command line.")
    signed = os.path.join(args.out, "COMU_Field_Logs-local-signed.apk")
    run([os.path.join(bt, "apksigner"), "sign",
         "--v2-signing-enabled", "true", "--v3-signing-enabled", "true", "--v4-signing-enabled", "false",
         "--ks", args.ks, "--ks-pass", "file:" + args.ks_pass_file, "--ks-key-alias", args.ks_alias,
         "--out", signed, aligned], env)
    print("signed", signed)
    print("A signature made with your own key does not match the published APK.")

if __name__ == "__main__":
    main()
