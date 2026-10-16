#!/usr/bin/env python3
"""把 Google Fonts 的 woff2 切片下载进 app/fonts，供 next/font/local 使用。

构建不要跑这个脚本。仓库里已经有字体文件，Docker 构建不再访问 Google。
需要更新字体时再手动执行。
"""

from __future__ import annotations

import json
import re
import subprocess
from collections import defaultdict
from io import BytesIO
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "app" / "fonts"
FILE_DIR = FONT_DIR / "files"
LICENSE_DIR = FONT_DIR / "licenses"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36"
)

# 与 app/layout.tsx 里原来的 next/font/google 参数一致。
FAMILIES = [
    {
        "id": "inter",
        "family": "Inter",
        "css": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
        "static_latin": "https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap",
        "variable": "--font-inter",
        "adjust": "Arial",
        "ident": "inter",
    },
    {
        "id": "noto-sans-sc",
        "family": "Noto Sans SC",
        "css": "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap",
        "static_latin": "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400&display=swap",
        "variable": "--font-noto-sans",
        "adjust": "Arial",
        "ident": "notoSans",
    },
    {
        "id": "noto-serif-sc",
        "family": "Noto Serif SC",
        "css": "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap",
        "static_latin": "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400&display=swap",
        "variable": "--font-noto-serif",
        "adjust": "Times New Roman",
        "ident": "notoSerif",
    },
    {
        "id": "newsreader",
        "family": "Newsreader",
        "css": "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap",
        # 可变字体默认字重就是 400，度量用这份拉丁文件即可。
        "static_latin": None,
        "variable": "--font-newsreader",
        "adjust": "Times New Roman",
        "ident": "newsreader",
    },
]


def curl(url: str) -> bytes:
    return subprocess.check_output(["curl", "-fsSL", "-A", UA, url])


def parse_faces(css: str) -> list[dict]:
    comment = ""
    faces: list[dict] = []
    block: list[str] = []
    in_face = False
    for line in css.splitlines():
        stripped = line.strip()
        match = re.search(r"/\* (.+?) \*/", stripped)
        if match and not in_face:
            comment = match.group(1)
            continue
        if stripped.startswith("@font-face"):
            in_face = True
            block = [stripped]
            continue
        if in_face:
            block.append(stripped)
            if stripped.endswith("}"):
                text = "\n".join(block)
                faces.append(
                    {
                        "comment": comment,
                        "weight": prop(text, "font-weight"),
                        "style": prop(text, "font-style") or "normal",
                        "url": re.search(r"url\((https://[^)]+)\)", text).group(1),
                        "unicode_range": prop(text, "unicode-range"),
                    }
                )
                in_face = False
                # 子集注释只描述紧跟着的这一条。不清掉的话，/* latin */
                # 会粘到后面没有新注释的汉字切片上。
                comment = ""
    return faces


def prop(block: str, name: str) -> str:
    match = re.search(rf"{name}:\s*([^;]+);", block)
    if not match:
        raise SystemExit(f"缺少 {name}:\n{block}")
    return match.group(1).strip()


def weight_span(weights: list[str]) -> str:
    """把同一文件上的离散字重收成 next/font 认识的区间。"""
    if len(weights) == 1:
        return weights[0]
    numbers: list[int] = []
    for weight in weights:
        parts = weight.split()
        if len(parts) == 1 and parts[0].isdigit():
            numbers.append(int(parts[0]))
        else:
            return weight
    return f"{min(numbers)} {max(numbers)}"


def assert_variable_covers(data: bytes, weight: str, label: str) -> None:
    parts = weight.split()
    if len(parts) != 2:
        return
    font = TTFont(BytesIO(data))
    if "fvar" not in font:
        raise SystemExit(f"{label} 不是可变字体，不能用字重区间 {weight}")
    axes = {axis.axisTag: axis for axis in font["fvar"].axes}
    wght = axes.get("wght")
    if wght is None:
        raise SystemExit(f"{label} 没有 wght 轴")
    low, high = int(parts[0]), int(parts[1])
    if wght.minValue > low or wght.maxValue < high:
        raise SystemExit(
            f"{label} 的 wght {wght.minValue}..{wght.maxValue} 盖不住 {weight}"
        )


def main() -> None:
    FILE_DIR.mkdir(parents=True, exist_ok=True)
    LICENSE_DIR.mkdir(parents=True, exist_ok=True)
    downloaded: dict[str, Path] = {}

    def materialize(url: str, filename: str) -> Path:
        path = FILE_DIR / filename
        if url not in downloaded:
            data = curl(url)
            if not data.startswith(b"wOF2"):
                raise SystemExit(f"不是 woff2: {url}")
            path.write_bytes(data)
            downloaded[url] = path
        elif downloaded[url] != path:
            path.write_bytes(downloaded[url].read_bytes())
            downloaded[url] = path
        return path

    calls: list[dict] = []
    stacks: list[tuple[str, list[str]]] = []

    for family in FAMILIES:
        faces = parse_faces(curl(family["css"]).decode())
        grouped: dict[str, list[dict]] = defaultdict(list)
        order: list[str] = []
        for face in faces:
            key = face["unicode_range"]
            if key not in grouped:
                order.append(key)
            grouped[key].append(face)

        slice_vars: list[str] = []
        latin_path: Path | None = None
        latin_range = ""
        for index, unicode_range in enumerate(order):
            group = grouped[unicode_range]
            comment = next((face["comment"] for face in group if face["comment"]), "")
            by_style: dict[str, list[dict]] = defaultdict(list)
            for face in group:
                by_style[face["style"]].append(face)
            src = []
            for style, styled in by_style.items():
                urls = [face["url"] for face in styled]
                weights = [face["weight"] for face in styled]
                if len(set(urls)) == 1:
                    weight = weight_span(weights)
                    filename = f"{family['id']}-{index:03d}.woff2"
                    # 同一 unicode-range 的不同样式各存一份。
                    if len(by_style) > 1:
                        filename = f"{family['id']}-{index:03d}-{style}.woff2"
                    path = materialize(urls[0], filename)
                    assert_variable_covers(path.read_bytes(), weight, filename)
                    src.append({"path": path, "weight": weight, "style": style})
                else:
                    for face in styled:
                        filename = (
                            f"{family['id']}-{index:03d}-{face['weight']}-{style}.woff2"
                        )
                        path = materialize(face["url"], filename)
                        src.append(
                            {
                                "path": path,
                                "weight": face["weight"],
                                "style": style,
                            }
                        )
            ident = f"{family['ident']}{index}"
            variable = f"{family['variable']}-{index}"
            is_latin = comment == "latin" or unicode_range.startswith("U+0000-00FF")
            if is_latin and latin_path is None:
                normal = next(item for item in src if item["style"] == "normal")
                latin_path = normal["path"]
                latin_range = unicode_range
            calls.append(
                {
                    "ident": ident,
                    "variable": variable,
                    "src": src,
                    "unicode_range": unicode_range,
                    # 浏览器会预加载 preload 的文件，不管 unicode-range。
                    # 只预加载 Inter / Newsreader 的拉丁切片。Noto 全部不预加载，
                    # 否则首屏会拉下约 200 个汉字 woff2。
                    "preload": is_latin and family["id"] in {"inter", "newsreader"},
                    "adjust": False,
                }
            )
            slice_vars.append(variable)

        if family["static_latin"]:
            static_faces = parse_faces(curl(family["static_latin"]).decode())
            latin = next(
                face
                for face in static_faces
                if face["comment"] == "latin" or face["unicode_range"].startswith("U+0000-00FF")
            )
            latin_path = materialize(latin["url"], f"{family['id']}-400-latin.woff2")
            latin_range = latin["unicode_range"]
            font = TTFont(BytesIO(latin_path.read_bytes()))
            if font["OS/2"].usWeightClass != 400:
                raise SystemExit(f"{family['id']} 拉丁文件不是 400")

        if latin_path is None:
            raise SystemExit(f"{family['id']} 没有拉丁切片，无法做回退度量")

        adjust_ident = f"{family['ident']}Adjust"
        adjust_variable = f"{family['variable']}-adjust"
        calls.append(
            {
                "ident": adjust_ident,
                "variable": adjust_variable,
                "src": [{"path": latin_path, "weight": "400", "style": "normal"}],
                "unicode_range": latin_range,
                "preload": False,
                "adjust": family["adjust"],
            }
        )
        # 带回退的变量放在最后，避免 Arial 截住后面的 unicode-range。
        stacks.append((family["variable"], [*slice_vars, adjust_variable]))

    write_typescript(calls)
    write_css(stacks)
    write_licenses()
    total = sum(path.stat().st_size for path in FILE_DIR.glob("*.woff2"))
    print(f"files {len(list(FILE_DIR.glob('*.woff2')))} bytes {total} calls {len(calls)}")


def rel(path: Path) -> str:
    return "./files/" + path.name


def write_typescript(calls: list[dict]) -> None:
    lines = [
        "import localFont from \"next/font/local\";",
        "",
        "/**",
        " * 自托管字体。构建期不再请求 Google Fonts。",
        " * 中文 Noto 按 unicode-range 分片；`--font-*` 名字与改前一致。",
        " * 每个切片关闭自动回退，避免 Arial 插在字体栈中间挡住后面的汉字。",
        " * 字重 400 的拉丁文件单独计算 size-adjust。",
        " * 只预加载 Inter 与 Newsreader 的拉丁切片。Noto 切片一律不预加载，",
        " * 否则浏览器会无视 unicode-range，首屏拉下全部汉字 woff2。",
        " */",
        "",
    ]
    idents: list[str] = []
    for call in calls:
        src = ",\n".join(
            "    {\n"
            f"      path: {json.dumps(rel(item['path']))},\n"
            f"      weight: {json.dumps(item['weight'])},\n"
            f"      style: {json.dumps(item['style'])},\n"
            "    }"
            for item in call["src"]
        )
        adjust = "false" if call["adjust"] is False else json.dumps(call["adjust"])
        lines.append(
            f"const {call['ident']} = localFont({{\n"
            f"  src: [\n{src},\n  ],\n"
            f"  display: \"swap\",\n"
            f"  preload: {str(call['preload']).lower()},\n"
            f"  adjustFontFallback: {adjust},\n"
            f"  variable: {json.dumps(call['variable'])},\n"
            "  declarations: [\n"
            "    {\n"
            '      prop: "unicode-range",\n'
            f"      value: {json.dumps(call['unicode_range'])},\n"
            "    },\n"
            "  ],\n"
            "});\n"
        )
        idents.append(call["ident"])
    joined = ", ".join(idents)
    lines.append(
        "/** 挂到 body 上，让各切片的 @font-face 和 size-adjust 回退进入样式表。 */\n"
        f"export const fontVariableClassName = [{joined}]\n"
        "  .map((font) => font.variable)\n"
        '  .join(" ");\n'
    )
    (FONT_DIR / "index.ts").write_text("\n".join(lines), encoding="utf-8")


def write_css(stacks: list[tuple[str, list[str]]]) -> None:
    body = ["/* 切片变量合成原来的 --font-*。名字不改，tokens.css 继续引用它们。 */", "body {"]
    for name, parts in stacks:
        value = ", ".join(f"var({part})" for part in parts)
        body.append(f"  {name}: {value};")
    body.append("}")
    body.append("")
    (FONT_DIR / "variables.css").write_text("\n".join(body), encoding="utf-8")


def write_licenses() -> None:
    text = curl("https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt")
    (LICENSE_DIR / "OFL.txt").write_bytes(text)


if __name__ == "__main__":
    main()
