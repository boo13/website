export function isDebugMode() {
  return new URLSearchParams(window.location.search).get('debug') === '1';
}

export async function mountPane(title) {
  const { Pane } = await import('tweakpane');
  return new Pane({
    title,
    container: document.getElementById('tweakpane-mount'),
  });
}
