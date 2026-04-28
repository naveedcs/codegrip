const beginMarker = "<!-- BEGIN CODEGRIP -->";
const endMarker = "<!-- END CODEGRIP -->";

export function createManagedSection(content: string): string {
  return `${beginMarker}\n${normalizeTrailingNewline(content)}${endMarker}\n`;
}

export function hasCurrentManagedSection(
  existingContent: string,
  managedContent: string
): boolean {
  const beginIndex = existingContent.indexOf(beginMarker);
  const endIndex = existingContent.indexOf(endMarker);

  if (beginIndex === -1 || endIndex <= beginIndex) {
    return false;
  }

  const sectionEndIndex = endIndex + endMarker.length;
  const existingSection = normalizeTrailingNewline(
    existingContent.slice(beginIndex, sectionEndIndex)
  );

  return existingSection === createManagedSection(managedContent);
}

export function upsertManagedSection(
  existingContent: string,
  managedContent: string
): {
  readonly content: string;
  readonly changed: boolean;
  readonly replacedExistingSection: boolean;
} {
  const nextSection = createManagedSection(managedContent);
  const beginIndex = existingContent.indexOf(beginMarker);
  const endIndex = existingContent.indexOf(endMarker);

  if (beginIndex !== -1 && endIndex > beginIndex) {
    const sectionEndIndex = endIndex + endMarker.length;
    const nextContent = `${existingContent.slice(0, beginIndex)}${nextSection}${existingContent.slice(sectionEndIndex).replace(/^\n/, "")}`;

    return {
      content: nextContent,
      changed: nextContent !== existingContent,
      replacedExistingSection: true
    };
  }

  const baseContent =
    existingContent.trim().length > 0
      ? `${normalizeTrailingNewline(existingContent)}\n`
      : "";
  const nextContent = `${baseContent}${nextSection}`;

  return {
    content: nextContent,
    changed: nextContent !== existingContent,
    replacedExistingSection: false
  };
}

function normalizeTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}
