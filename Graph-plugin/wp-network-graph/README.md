# WP Network Graph

A lightweight WordPress shortcode plugin that renders an interactive network graph using Cytoscape.js. Nodes enlarge on click and (optionally) redirect after a short delay. Initial positions are placed on a collision-free grid so the graph looks clean and predictable.

## Install

1. Zip the folder `wp-network-graph` (already prepared in this repo)
2. WordPress Admin → Plugins → Add New → Upload Plugin → select `wp-network-graph.zip` → Install → Activate

Alternatively, copy the folder to `wp-content/plugins/wp-network-graph/`.

## Shortcode

Basic usage (inline JSON):

```
[network_graph height="560px" options='{"theme":"light","openInNewTab":true}']
{
  "nodes": [
    {"id":"a","label":"Ardaena","url":"https://example.com/ardaena","color":"#111827","size":24},
    {"id":"b","label":"Nexus","url":"https://example.com/nexus","color":"#1D4ED8","size":20}
  ],
  "edges": [ {"source":"a","target":"b"} ]
}
[/network_graph]
```

Load external JSON instead of inline:

```
[network_graph height="560px" src="https://your-site.com/wp-content/uploads/graph-data.json" options='{"theme":"light"}'][/network_graph]
```

Use the convenience `nodes` attribute (no JSON needed):

```
[network_graph height="560px" nodes="Ardaena|https://example.com/ardaena|#111827; Nexus|https://example.com/nexus|#1D4ED8; Data||#0D9488" options='{"openInNewTab":true}'][/network_graph]
```

Format: `label|url|#hex` per node, separated by semicolons. `url` and `#hex` are optional.

## Options

Pass as JSON via the `options` attribute.

- `theme`: `light` | `dark` (default: `light`)
- `accent`: hex color for active node outline (default: `#3b82f6`)
- `openInNewTab`: boolean, open links in new tab (default: `true`)
- `redirectEnabled`: boolean, enable link navigation (default: `true`)
- `animateDurationMs`: number, node animation duration (default: `2000`)
- `redirectDelayMs`: number, redirect wait after click (default: `2100`)
- `activeSize`: number, clicked node size in px (default: `26`)
- `sizeRangeMin`/`sizeRangeMax`: normalize node sizes to this range (defaults: `14`/`20`)
- `persistPositions`: boolean, persist positions across visits (default: `false`)

## Behavior

- Initial layout uses a grid with cell size = `3 × max node radius` to avoid collisions.
- Layout mode is `preset` so nodes stay exactly where placed; zoom/pan/drag are disabled.
- Clicking a node enlarges it for `animateDurationMs`; if it has a `url` and `redirectEnabled` is true, the link opens after `redirectDelayMs`.

## JSON schema

Nodes:
- `id` (string, required)
- `label` (string)
- `url` (string)
- `color` (string hex)
- `size` (number)

Edges:
- `source` (string id)
- `target` (string id)

## Troubleshooting

- If nothing appears, check the browser console for 404s or blocked scripts.
- If inline JSON is sanitized by your editor, use the `src` attribute instead.
- If you want to keep positions between visits, set `persistPositions` to `true`.

## License

MIT
