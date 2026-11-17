/**
 * Caminho SVG de uma linha pelos pontos dados (coordenadas do `viewBox`). Um ponto único
 * vira um segmento de comprimento zero, que aparece como ponto com `stroke-linecap: round`.
 */
export function caminhoDaLinha(pontos: ReadonlyArray<{ x: number; y: number }>): string {
  if (pontos.length === 0) {
    return ''
  }
  const partes = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
  if (pontos.length === 1) {
    partes.push(`L${pontos[0].x.toFixed(1)} ${pontos[0].y.toFixed(1)}`)
  }
  return partes.join(' ')
}
