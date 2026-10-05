import axe from 'axe-core';

/**
 * Roda o axe-core (regras de acessibilidade do WCAG) numa parte da página e devolve as violações em texto curto.
 * O contraste de cor não é conferido aqui (o jsdom não calcula cores nem layout): ele é conferido a partir dos tokens, em
 * `src/styles/contrast.test.ts`.
 */
export async function a11yViolations(root: Element): Promise<string[]> {
  const result = await axe.run(root, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false }, // o teste monta só um pedaço da página, sem os marcos de página inteira
    },
  });

  return result.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} -> ${violation.nodes
        .slice(0, 3)
        .map((node) => node.html.slice(0, 120))
        .join(' | ')}`,
  );
}
