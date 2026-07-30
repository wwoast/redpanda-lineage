/** Keep consistent with the `NodeType` type definition */
export const nodeTypes: NodeType[] = ["links", "media", "panda", "wild", "zoo"]
/** Keep consistent with the `SupportedLanguages` enum definition */
export const supportedLanguages: Language[] = ["en", "es", "ja", "ko", "ne", "pt", "zh"]

export function ensureNodeType(input: string) {
  if ((nodeTypes as string[]).includes(input))
    return input as NodeType
}

export function ensureLanguage(input: string) {
  if ((supportedLanguages as string[]).includes(input))
    return input as Language
}

/** Check whether or not the given path exists as a directory. */
export function existsDirSync(path: string): boolean | Error {
  try {
    const fi = Deno.lstatSync(path)
    if (fi.isDirectory)
      return true
    return false
  } catch (err) {
    if (err instanceof Deno.errors.NotFound)
      return false
    throw err
  }
}

/** Check whether or not the given path exists as regular file. */
export function existsFileSync(path: string): boolean {
  try {
    const fi = Deno.lstatSync(path)
    if (fi.isFile)
      return true
    return false
  } catch (err) {
    if (err instanceof Deno.errors.NotFound)
      return false
    throw err
  }
}

/** Where to import or export red panda data from */
export const Paths: Record<string, string> = {
  links: "./links",
  media: "./media",
  output: "./export/redpanda.json",
  pandas: "./pandas",
  wild: "./wild",
  zoos: "./zoos"
}
