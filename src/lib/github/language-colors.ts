// GitHub linguist(https://github.com/github-linguist/linguist)의 관례 색상 중 자주 등장하는 언어만 추린 서브셋.
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Scala: '#c22d40',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Lua: '#000080',
  Perl: '#0298c3',
  R: '#198CE7',
  'Objective-C': '#438eff',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  YAML: '#cb171e',
  JSON: '#292929',
  Markdown: '#083fa1',
  SQL: '#e38c00',
  PowerShell: '#012456',
  Assembly: '#6E4C13',
  Zig: '#ec915c',
  Julia: '#a270ba',
  Erlang: '#B83998',
  OCaml: '#ef7a08',
  'F#': '#b845fc',
  Groovy: '#4298b8',
  'Vim Script': '#199f4b',
  Nix: '#7e7eff',
  GraphQL: '#e10098',
  Solidity: '#AA6746',
}

// linguist에 없거나 매핑을 못 찾은 언어를 위한 폴백 색
const FALLBACK_LANGUAGE_COLOR = '#8b949e'

export function getLanguageColor(language: string | null): string {
  if (!language) return FALLBACK_LANGUAGE_COLOR
  return LANGUAGE_COLORS[language] ?? FALLBACK_LANGUAGE_COLOR
}
