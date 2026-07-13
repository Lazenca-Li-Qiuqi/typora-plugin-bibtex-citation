const PANDOC_KEY_PATTERN = /[\p{L}\p{N}_]+(?:[:.#$%&+\-?<>~/][\p{L}\p{N}_]+)*/uy;
const PANDOC_PARTIAL_KEY_PATTERN = /@([\p{L}\p{N}_:.#$%&+\-?<>~/]*)$/u;
const PANDOC_INTERNAL_PUNCTUATION = new Set(":.#$%&-+?<>~/");

/**
 * 功能：解析指定位置开始的 Pandoc 风格叙述式 citation token。
 * 输入：Markdown 文本与 `@` 的 UTF-16 索引。
 * 输出：包含 key、原文和范围的对象；若词法或前导边界不合法则返回 null。
 */
export function parsePandocNarrativeCitationAt(markdown, atIndex) {
  const source = String(markdown || "");
  if (source[atIndex] !== "@" || !hasNarrativeLeadingBoundary(source, atIndex)) {
    return null;
  }

  if (source[atIndex + 1] === "{") {
    const closeIndex = source.indexOf("}", atIndex + 2);
    if (closeIndex === -1) {
      return null;
    }

    const key = source.slice(atIndex + 2, closeIndex);
    if (!key || /[\s{}]/u.test(key)) {
      return null;
    }

    return createNarrativeToken(source, atIndex, closeIndex + 1, key);
  }

  PANDOC_KEY_PATTERN.lastIndex = atIndex + 1;
  const match = PANDOC_KEY_PATTERN.exec(source);
  if (!match || match.index !== atIndex + 1) {
    return null;
  }

  return createNarrativeToken(source, atIndex, PANDOC_KEY_PATTERN.lastIndex, match[0]);
}

/**
 * 功能：严格解析只包含一个 Pandoc 叙述式引用的原文。
 * 输入：形如 `@key` 或 `@{special-key}` 的完整文本。
 * 输出：citation key；若文本还包含其他内容则返回 null。
 */
export function parseStrictNarrativeCitationKey(text) {
  const source = String(text || "");
  const token = parsePandocNarrativeCitationAt(source, 0);
  return token && token.end === source.length ? token.key : null;
}

/**
 * 功能：从 Markdown 正文中收集已存在于当前文献库的叙述式引用。
 * 说明：排除 YAML、代码、HTML 注释、HTML 标签和所有方括号上下文；未知裸 `@token` 保持普通文本。
 * 输入：Markdown 文本与 citation key 存在性判断函数。
 * 输出：按文档顺序排列的叙述式引用源数组。
 */
export function collectValidNarrativeCitationsFromMarkdown(markdown, isKnownKey) {
  const source = String(markdown || "");
  const scanSource = maskNonProseMarkdown(source);
  const citations = [];
  let squareBracketDepth = 0;

  for (let index = 0; index < scanSource.length; index += 1) {
    const character = scanSource[index];
    if (character === "\n" || character === "\r") {
      squareBracketDepth = 0;
      continue;
    }
    if (character === "[") {
      squareBracketDepth += 1;
      continue;
    }
    if (character === "]") {
      squareBracketDepth = Math.max(0, squareBracketDepth - 1);
      continue;
    }
    if (character !== "@" || squareBracketDepth > 0) {
      continue;
    }

    const token = parsePandocNarrativeCitationAt(scanSource, index);
    if (!token) {
      continue;
    }

    if (isKnownKey(token.key)) {
      citations.push({
        range: {
          start: token.start,
          end: token.end,
          text: source.slice(token.start, token.end),
        },
        keys: [token.key],
        citationMode: "narrative",
        sourceType: "visible",
      });
    }
    index = token.end - 1;
  }

  return citations;
}

/**
 * 功能：识别光标前文本末尾可用于叙述式引用建议的查询词。
 * 输入：编辑器传入的光标前文本。
 * 输出：匹配时返回 key 查询文本，否则返回 null。
 */
export function findNarrativeCitationQuery(text) {
  const source = String(text || "");
  const match = source.match(PANDOC_PARTIAL_KEY_PATTERN);
  if (!match) {
    return null;
  }

  const atIndex = source.length - match[0].length;
  if (!hasNarrativeLeadingBoundary(source, atIndex)) {
    return null;
  }

  const scanSource = maskNonProseMarkdown(source);
  if (scanSource[atIndex] !== "@") {
    return null;
  }

  let squareBracketDepth = 0;
  const lineStart = Math.max(
    source.lastIndexOf("\n", atIndex - 1),
    source.lastIndexOf("\r", atIndex - 1),
  ) + 1;
  for (let index = lineStart; index < atIndex; index += 1) {
    if (scanSource[index] === "[") squareBracketDepth += 1;
    if (scanSource[index] === "]") squareBracketDepth = Math.max(0, squareBracketDepth - 1);
  }

  return squareBracketDepth === 0 ? match[1] : null;
}

function createNarrativeToken(source, start, end, key) {
  return {
    key,
    start,
    end,
    text: source.slice(start, end),
  };
}

function hasNarrativeLeadingBoundary(source, atIndex) {
  if (atIndex === 0) {
    return true;
  }

  const previous = source[atIndex - 1];
  if (/[\p{L}\p{N}_]/u.test(previous)) {
    return false;
  }

  return previous !== "@"
    && previous !== "\\"
    && previous !== "="
    && !PANDOC_INTERNAL_PUNCTUATION.has(previous);
}

function maskNonProseMarkdown(markdown) {
  const source = String(markdown || "");
  const masked = source.split("");

  maskPattern(source, masked, /<!--[^]*?-->/g);
  maskPattern(source, masked, /<[^>\r\n]+>/g);

  const frontmatter = source.match(/^(?:\uFEFF)?---[ \t]*\r?\n[^]*?\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/);
  if (frontmatter) {
    maskRange(masked, 0, frontmatter[0].length);
  }

  maskCodeBlocksAndSpans(source, masked);
  return masked.join("");
}

function maskCodeBlocksAndSpans(source, masked) {
  const lines = collectLines(source);
  let fence = null;

  for (const line of lines) {
    const content = source.slice(line.start, line.contentEnd);
    const fenceMatch = content.match(/^ {0,3}(`{3,}|~{3,})/);

    if (fence) {
      maskRange(masked, line.start, line.end);
      const closingMatch = content.match(/^ {0,3}(`+|~+)[ \t]*$/);
      if (
        closingMatch
        && closingMatch[1][0] === fence.character
        && closingMatch[1].length >= fence.length
      ) {
        fence = null;
      }
      continue;
    }

    if (fenceMatch) {
      fence = {
        character: fenceMatch[1][0],
        length: fenceMatch[1].length,
      };
      maskRange(masked, line.start, line.end);
      continue;
    }

    if (/^(?: {4}|\t)/.test(content)) {
      maskRange(masked, line.start, line.end);
      continue;
    }

    maskInlineCodeSpans(source, masked, line.start, line.contentEnd);
  }
}

function maskInlineCodeSpans(source, masked, lineStart, lineEnd) {
  let cursor = lineStart;
  while (cursor < lineEnd) {
    const openIndex = source.indexOf("`", cursor);
    if (openIndex === -1 || openIndex >= lineEnd) {
      return;
    }
    if (masked[openIndex] === " ") {
      cursor = openIndex + 1;
      continue;
    }

    const runLength = countRun(source, openIndex, "`", lineEnd);
    let searchIndex = openIndex + runLength;
    let closeIndex = -1;
    while (searchIndex < lineEnd) {
      const candidate = source.indexOf("`", searchIndex);
      if (candidate === -1 || candidate >= lineEnd) {
        break;
      }
      const candidateLength = countRun(source, candidate, "`", lineEnd);
      if (candidateLength === runLength) {
        closeIndex = candidate;
        break;
      }
      searchIndex = candidate + candidateLength;
    }

    if (closeIndex === -1) {
      return;
    }

    maskRange(masked, openIndex, closeIndex + runLength);
    cursor = closeIndex + runLength;
  }
}

function collectLines(source) {
  const lines = [];
  let start = 0;
  while (start < source.length) {
    const newlineIndex = source.indexOf("\n", start);
    const end = newlineIndex === -1 ? source.length : newlineIndex + 1;
    const contentEnd = source[end - 1] === "\n"
      ? end - (source[end - 2] === "\r" ? 2 : 1)
      : end;
    lines.push({ start, end, contentEnd });
    start = end;
  }
  return lines;
}

function countRun(source, start, character, limit) {
  let end = start;
  while (end < limit && source[end] === character) {
    end += 1;
  }
  return end - start;
}

function maskPattern(source, masked, pattern) {
  let match;
  while ((match = pattern.exec(source)) !== null) {
    maskRange(masked, match.index, match.index + match[0].length);
  }
}

function maskRange(masked, start, end) {
  for (let index = start; index < end; index += 1) {
    if (masked[index] !== "\r" && masked[index] !== "\n") {
      masked[index] = " ";
    }
  }
}
