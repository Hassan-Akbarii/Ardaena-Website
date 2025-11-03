(function () {
  // Small helper to create a simple legend in the top-left of the container
  function addLegend(container, theme, options) {
    var show = options.legend !== false; // default true
    if (!show) return;
    var releasedLabel = options.legendReleasedLabel || 'Released';
    var notReleasedLabel = options.legendNotReleasedLabel || 'Not Released';
    var releasedColor = options.legendReleasedColor || '#111827';
    var notReleasedColor = options.legendNotReleasedColor || (theme === 'dark' ? '#9aa4b2' : '#9ca3af');

    var wrap = document.createElement('div');
    wrap.className = 'wpng-legend';
    wrap.style.position = 'absolute';
    wrap.style.top = '10px';
    wrap.style.left = '10px';
    wrap.style.display = 'flex';
    wrap.style.gap = '16px';
    wrap.style.alignItems = 'center';
    wrap.style.fontSize = '14px';
    wrap.style.lineHeight = '18px';
    wrap.style.padding = '6px 8px';
    wrap.style.borderRadius = '8px';
    wrap.style.background = 'transparent';
    wrap.style.pointerEvents = 'none'; // avoid intercepting clicks on nodes

    function item(color, label) {
      var outer = document.createElement('div');
      outer.style.display = 'flex';
      outer.style.alignItems = 'center';
      outer.style.gap = '8px';
      var dot = document.createElement('span');
      dot.style.width = '14px';
      dot.style.height = '14px';
      dot.style.borderRadius = '50%';
      dot.style.background = color;
      dot.style.border = '1px solid rgba(0,0,0,' + (theme === 'dark' ? '0.5' : '0.15') + ')';
      var text = document.createElement('span');
      text.textContent = label;
      text.style.color = theme === 'dark' ? '#e6edf3' : '#111827';
      outer.appendChild(dot);
      outer.appendChild(text);
      return outer;
    }

    wrap.appendChild(item(notReleasedColor, notReleasedLabel));
    wrap.appendChild(item(releasedColor, releasedLabel));
    container.appendChild(wrap);
  }
  // Generate edges automatically when none are provided:
  // - Chain all nodes in order (n0->n1->...->nN)
  // - Add ~N/2 random unique edges between different nodes
  function ensureEdgesPresent(dataObj) {
    if (!dataObj || !Array.isArray(dataObj.nodes)) return;
    var nodes = dataObj.nodes;
    if (!Array.isArray(dataObj.edges) || dataObj.edges.length === 0) {
      var edges = [];
      var used = new Set();
      function makeKey(a, b) {
        a = String(a); b = String(b);
        return a < b ? a + '|' + b : b + '|' + a;
      }
      // Chain
      for (var i = 0; i < nodes.length - 1; i++) {
        var s = nodes[i].id; var t = nodes[i + 1].id;
        var k = makeKey(s, t);
        if (!used.has(k)) {
          edges.push({ id: String(s) + '-' + String(t), source: String(s), target: String(t) });
          used.add(k);
        }
      }
      // Close the loop (last -> first)
      if (nodes.length >= 2) {
        var sLast = nodes[nodes.length - 1].id; var tFirst = nodes[0].id;
        var kLoop = makeKey(sLast, tFirst);
        if (!used.has(kLoop)) {
          edges.push({ id: String(sLast) + '-' + String(tFirst), source: String(sLast), target: String(tFirst) });
          used.add(kLoop);
        }
      }
      // Random edges ~ N/2
      var targetRandom = Math.floor(nodes.length / 2);
      var added = 0, guard = 0, guardMax = targetRandom * 10 + 20;
      while (added < targetRandom && guard < guardMax) {
        var a = Math.floor(Math.random() * nodes.length);
        var b = Math.floor(Math.random() * nodes.length);
        guard++;
        if (a === b) continue;
        var sa = nodes[a].id, sb = nodes[b].id;
        var key = makeKey(sa, sb);
        if (used.has(key)) continue;
        edges.push({ id: 'r-' + String(sa) + '-' + String(sb), source: String(sa), target: String(sb) });
        used.add(key);
        added++;
      }
      dataObj.edges = edges;
    }
  }

  function getSiblingJson(selector, containerId) {
    var nodes = document.querySelectorAll(selector + '[data-for="' + containerId + '"]');
    if (!nodes || !nodes.length) return null;
    try {
      return JSON.parse(nodes[0].textContent || '{}');
    } catch (e) {
      console.warn('WP Network Graph: invalid JSON in', selector, 'for', containerId, e);
      return {};
    }
  }

  function findDataSrc(containerId) {
    var el = document.querySelector('.wpng-graph-src[data-for="' + containerId + '"]');
    return el ? el.getAttribute('data-src') : null;
  }

  // Debug overlay removed in production

  function init(container) {
    if (typeof cytoscape === 'undefined') {
      console.error('WP Network Graph: Cytoscape.js is not loaded.');
      return;
    }

  var id = container.id;
  var data = getSiblingJson('script.wpng-graph-data', id) || {};
  var options = getSiblingJson('script.wpng-graph-options', id) || {};
  // If data.edges are missing/empty, synthesize edges
  ensureEdgesPresent(data);
  // Control whether to persist/restore positions; default false per user request
  var persistPositions = options.persistPositions === true;
    var dataSrc = findDataSrc(id);

  var elements = [];

  // Expect data like { nodes: [{ id, label, url, size }], edges: [{ source, target }] }
    // We'll normalize sizes to a narrow range so variety is reduced.
  // Theme and colors (define early so we can use defaults while building elements)
  var theme = (options.theme || 'light').toLowerCase();
  var bg = theme === 'dark' ? '#0f1115' : '#ffffff';
  var nodeColor = theme === 'dark' ? '#e6edf3' : '#111827';
  // Accent comes from shortcode options. Edges and node borders use the same color as accent by default.
  var accent = options.accent || '#3b82f6';
  var edgeColor = accent;
  // Box styling (container border/background) can be overridden via shortcode options
  var boxColor = options.boxColor || accent; // border color of the box
  var boxBackground = options.boxBackground; // optional background override
  var boxBorderWidth = typeof options.boxBorderWidth === 'number' ? options.boxBorderWidth : null;

  var rect = container.getBoundingClientRect();
    var W = Math.max(200, rect.width || 600);
    var H = Math.max(200, rect.height || 400);
    
    // Dimensions computed from container
    
    // Use percentage-based margins to ensure proper distribution
    var marginLeft = W * 0.08;   // 8% from left
    var marginRight = W * 0.08;  // 8% from right  
    var marginTop = H * 0.1;     // 10% from top
    var marginBottom = H * 0.1;  // 10% from bottom
    var rawSizes = [];
    if (Array.isArray(data.nodes)) {
      data.nodes.forEach(function (n) { rawSizes.push(typeof n.size === 'number' ? n.size : 24); });
    }
    var sMin = Math.min.apply(null, rawSizes.length ? rawSizes : [24]);
    var sMax = Math.max.apply(null, rawSizes.length ? rawSizes : [24]);
    var rangeMin = (typeof options.sizeRangeMin === 'number') ? options.sizeRangeMin : 14; // acceptable small
    var rangeMax = (typeof options.sizeRangeMax === 'number') ? options.sizeRangeMax : 20; // cap big non-active size
    function normalizeSize(v) {
      if (sMax === sMin) return Math.round((rangeMin + rangeMax) / 2);
      var t = (v - sMin) / (sMax - sMin);
      return Math.round(rangeMin + t * (rangeMax - rangeMin));
    }

    if (Array.isArray(data.nodes)) {
      var nCount = data.nodes.length;

      // Calculate the safe drawing area
      var safeLeft = marginLeft;
      var safeRight = W - marginRight;
      var safeTop = marginTop;
      var safeBottom = H - marginBottom;
      var safeWidth = safeRight - safeLeft;
      var safeHeight = safeBottom - safeTop;

  // Safe area computed from margins

      // Grid based on node size, cell = 3x max node radius
      var activeSize = typeof options.activeSize === 'number' ? options.activeSize : 26;
      var maxNodeRadius = Math.max(rangeMax, activeSize) / 2;
      var cellSize = maxNodeRadius * 6;
      var cols = Math.max(1, Math.floor(safeWidth / cellSize));
      var rows = Math.max(1, Math.floor(safeHeight / cellSize));
      var totalCells = cols * rows;

  // Grid based on node size: cells sized to avoid collisions

      if (totalCells < nCount) {
  // Not enough cells for all nodes; some may overlap
      }

      // Generate all available cell center positions
      var availableCells = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var centerX = safeLeft + cellSize * (c + 0.5);
          var centerY = safeTop + cellSize * (r + 0.5);
          availableCells.push({ x: centerX, y: centerY, col: c, row: r });
        }
      }

      // Shuffle available cells for random distribution
      for (var k = availableCells.length - 1; k > 0; k--) {
        var j = Math.floor(Math.random() * (k + 1));
        var tmp = availableCells[k];
        availableCells[k] = availableCells[j];
        availableCells[j] = tmp;
      }

      // Place each node at a randomly selected cell center
      data.nodes.forEach(function (n, idx) {
        var baseSize = normalizeSize(typeof n.size === 'number' ? n.size : 24);

        var chosen = availableCells[idx % availableCells.length];
        // If nodes > cells, wrap around (may share a cell)
        var x = chosen.x;
        var y = chosen.y;
  // Node placed at grid center

  elements.push({ data: { id: String(n.id), label: n.label || String(n.id), url: n.url || null, color: (n.color || nodeColor), size: baseSize, baseSize: baseSize }, position: { x: x, y: y } });
      });
    }
    if (Array.isArray(data.edges)) {
      data.edges.forEach(function (e) {
        elements.push({ data: { id: (e.id || (String(e.source) + '-' + String(e.target))), source: String(e.source), target: String(e.target) } });
      });
    }

  var hadInlineData = Array.isArray(data.nodes) && data.nodes.length > 0;

    var layoutConfig = { 
      name: 'preset', // Use exact positions we provided, no physics
      animate: false,  // No animation needed since positions are final
      fit: false       // Don't auto-fit, keep our exact coordinates
    };

    // Force container to have explicit dimensions for Cytoscape
    container.style.width = W + 'px';
    container.style.height = H + 'px';
    container.style.position = 'relative';
  // Container explicit size set

    var cyOptions = {
      container: container,
      elements: elements,
      // Restore default pixel ratio for sharp rendering
      motionBlur: false,
      textureOnViewport: false,
      hideEdgesOnViewport: false,
      hideLabelsOnViewport: false,
      zoomingEnabled: false, // disable zoom in/out
      userZoomingEnabled: false,
        panningEnabled: false,
        userPanningEnabled: false,
        boxSelectionEnabled: false,
        autoungrabify: true, // prevent dragging nodes
        minZoom: 1,
        maxZoom: 1,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'border-width': 1,
            'border-color': edgeColor,
            'width': 'data(size)',
            'height': 'data(size)',
            'label': 'data(label)',
            'color': theme === 'dark' ? '#e6edf3' : '#111827',
            'font-size': 12,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-margin-y': -18,
            'text-outline-color': bg,
            'text-outline-width': 2,
            'overlay-padding': 4,
            'z-index': 10
          }
        },
        {
          selector: 'node.active',
          style: {
            'background-color': accent,
            'color': theme === 'dark' ? '#0b1220' : '#f9fafb',
            'text-outline-color': accent,
            'text-outline-width': 3
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': edgeColor,
            'opacity': 0.7
          }
        }
      ],
      layout: layoutConfig
    };
    var cy = cytoscape(cyOptions);
    // Apply container visual overrides from options
    try {
      container.style.borderColor = boxColor;
      if (boxBackground) container.style.background = boxBackground;
      if (boxBorderWidth !== null) container.style.borderWidth = boxBorderWidth + 'px';
    } catch(e) { /* ignore */ }
  // Add legend overlay
  addLegend(container, theme, options);

    // Verify canvas sizing immediately after initialization
    setTimeout(function() {
      var canvas = container.querySelector('canvas');
      if (canvas) {
        // Force canvas actual dimensions to match container exactly (fixes device pixel ratio issues)
        if (canvas.width !== W || canvas.height !== H) {
          canvas.width = W;
          canvas.height = H;
        }
        
        // Force canvas style to match container if different
        if (canvas.style.width !== W + 'px' || canvas.style.height !== H + 'px') {
          canvas.style.width = W + 'px';
          canvas.style.height = H + 'px';
        }
        
        // Trigger Cytoscape resize to recalculate coordinates
        cy.resize();
      }
    }, 100);

    function renderFrom(dataObj) {
      // Ensure edges exist for fetched data as well
      ensureEdgesPresent(dataObj);
      elements = [];
      if (Array.isArray(dataObj.nodes)) {
        // Recompute normalization for loaded data
        var rs = [];
        dataObj.nodes.forEach(function(n){ rs.push(typeof n.size === 'number' ? n.size : 24); });
        var mn = Math.min.apply(null, rs.length ? rs : [24]);
        var mx = Math.max.apply(null, rs.length ? rs : [24]);

        // Compute safe area and grid for this data
        var rect2 = container.getBoundingClientRect();
        var W2 = Math.max(200, rect2.width || 600);
        var H2 = Math.max(200, rect2.height || 400);
        var safeLeft2 = W2 * 0.08;
        var safeRight2 = W2 - W2 * 0.08;
        var safeTop2 = H2 * 0.10;
        var safeBottom2 = H2 - H2 * 0.10;
        var safeWidth2 = safeRight2 - safeLeft2;
        var safeHeight2 = safeBottom2 - safeTop2;

        var activeSize2 = typeof options.activeSize === 'number' ? options.activeSize : 26;
        var maxNodeRadius2 = Math.max(rangeMax, activeSize2) / 2;
        var cellSize2 = maxNodeRadius2 * 3;
        var cols2 = Math.max(1, Math.floor(safeWidth2 / cellSize2));
        var rows2 = Math.max(1, Math.floor(safeHeight2 / cellSize2));

        var centers2 = [];
        for (var r2 = 0; r2 < rows2; r2++) {
          for (var c2 = 0; c2 < cols2; c2++) {
            centers2.push({
              x: safeLeft2 + cellSize2 * (c2 + 0.5),
              y: safeTop2 + cellSize2 * (r2 + 0.5)
            });
          }
        }
        // Shuffle
        for (var p2 = centers2.length - 1; p2 > 0; p2--) {
          var q2 = Math.floor(Math.random() * (p2 + 1));
          var tmp2 = centers2[p2]; centers2[p2] = centers2[q2]; centers2[q2] = tmp2;
        }

        dataObj.nodes.forEach(function (n, idx2) {
          var baseSize2 = (mx === mn) ? Math.round((rangeMin + rangeMax)/2) : Math.round(rangeMin + (((typeof n.size==='number'? n.size:24) - mn) / (mx - mn)) * (rangeMax - rangeMin));
          var chosen2 = centers2[idx2 % centers2.length] || { x: safeLeft2 + safeWidth2/2, y: safeTop2 + safeHeight2/2 };
          elements.push({ data: { id: String(n.id), label: n.label || String(n.id), url: n.url || null, color: (n.color || nodeColor), size: baseSize2, baseSize: baseSize2 }, position: { x: chosen2.x, y: chosen2.y } });
        });
      }
      if (Array.isArray(dataObj.edges)) {
        dataObj.edges.forEach(function (e) {
          elements.push({ data: { id: (e.id || (String(e.source) + '-' + String(e.target))), source: String(e.source), target: String(e.target) } });
        });
      }
      cy.json({ elements: elements });
      setTimeout(function(){ cy.layout(layoutConfig).run(); }, 50);
      // No fitLater needed - preset layout keeps exact positions
    }

    // Resize handling
    function fitLater() {
      if (!cy || cy._destroyed) return;
      // Ensure container has explicit dimensions
      var rect = container.getBoundingClientRect();
      var newW = Math.max(200, rect.width || 600);
      var newH = Math.max(200, rect.height || 400);
      container.style.width = newW + 'px';
      container.style.height = newH + 'px';
  // No logging in production
      
      // Force canvas to exact dimensions before resize
      var canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.width = newW;
        canvas.height = newH;
        canvas.style.width = newW + 'px';
        canvas.style.height = newH + 'px';
      }
      
      cy.resize();
      // Don't call cy.fit() - it repositions our carefully placed nodes
      
      // Skip verbose logging
    }
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function () { setTimeout(fitLater, 50); });
      ro.observe(container);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', function () { setTimeout(fitLater, 50); });
      setTimeout(fitLater, 50);
    }

  // Click behavior: center clicked node, enlarge, animate 2s, then redirect
  var animateDuration = typeof options.animateDurationMs === 'number' ? options.animateDurationMs : 2000;
  var redirectDelay = typeof options.redirectDelayMs === 'number' ? options.redirectDelayMs : 2100;
    var activeSize = typeof options.activeSize === 'number' ? options.activeSize : 26; // clicked node size
  var othersMaxSize = Math.min(rangeMax, activeSize - 6); // ensure always < active
  if (isNaN(othersMaxSize) || othersMaxSize < rangeMin) { othersMaxSize = rangeMin; }
    var jitter = typeof options.jitter === 'number' ? options.jitter : 40; // px offset for subtle movement
    var persistKey = 'wpng-pos-' + id;
    var redirectEnabled = options.redirectEnabled !== false; // default true unless explicitly false

    // Load persisted positions only if enabled via options
    var positionsRestored = false;
    if (persistPositions) {
      try {
        var saved = localStorage.getItem(persistKey);
        if (saved) {
          var positions = JSON.parse(saved);
          Object.keys(positions).forEach(function(nid){
            var nd = cy.getElementById(nid);
            if (nd && nd.nonempty && typeof nd.nonempty === 'function' ? nd.nonempty() : nd.length > 0) {
              nd.position(positions[nid]);
            }
          });
          // Don't call cy.fit() - keep restored positions exactly as saved
          positionsRestored = true;
        }
      } catch (e) { /* ignore */ }
    } else {
      // Ensure old, potentially bad positions do not interfere
      try { localStorage.removeItem(persistKey); } catch(e) { /* ignore */ }
    }
    var activeAnim;

    cy.on('tap', 'node', function (evt) {
      var node = evt.target;
      var url = node.data('url');

      // cancel existing animation/timeout
      if (activeAnim && activeAnim.stop) activeAnim.stop();
      if (cy._redirectTimeout) {
        clearTimeout(cy._redirectTimeout);
        cy._redirectTimeout = null;
      }

      cy.elements().removeClass('active');
      node.addClass('active');

      // Enlarge selected node in place (no centering)
      var originalSize = node.data('size') || node.data('baseSize') || Math.round((rangeMin+rangeMax)/2);
      var targetSize = activeSize;

      // Lock node during animation and animate size only
      node.lock();
  activeAnim = node.animate({ style: { width: targetSize, height: targetSize } }, { duration: animateDuration, easing: 'ease-in-out' });

      // Move other nodes with collision avoidance and canvas bounds
      var others = cy.nodes().not(node);
      var viewport = cy.extent();
      var clickedPos = node.position();
      var maxNodeSize = Math.max(activeSize, rangeMax);
      var minSep = 2 * maxNodeSize; // minimum separation distance
      var planned = [];

      function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
      function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

      others.forEach(function (n) {
        var p = n.position();
        var sizeNow = n.data('size') || n.data('baseSize') || rangeMax;
        var targetOther = Math.min(sizeNow, othersMaxSize);
        var nodeRadius = targetOther / 2 + 15; // node radius plus small buffer
        
        // Use the same safe area as initial positioning
        var containerRect = container.getBoundingClientRect();
        var containerW = Math.max(200, containerRect.width || 600);
        var containerH = Math.max(200, containerRect.height || 400);
        var safeMarginLeft = containerW * 0.08;
        var safeMarginRight = containerW * 0.08;
        var safeMarginTop = containerH * 0.1;
        var safeMarginBottom = containerH * 0.1;
        
        var minX = viewport.x1 + safeMarginLeft + nodeRadius;
        var minY = viewport.y1 + safeMarginTop + nodeRadius;
        var maxX = viewport.x2 - safeMarginRight - nodeRadius;
        var maxY = viewport.y2 - safeMarginBottom - nodeRadius;

        var angle = Math.random() * Math.PI * 2;
        var r = (Math.random() * 0.6 + 0.4) * jitter;
        var nx = clamp(p.x + Math.cos(angle) * r, minX, maxX);
        var ny = clamp(p.y + Math.sin(angle) * r, minY, maxY);

        // Collision avoidance with multiple attempts
        var attempts = 0;
        function tooClose(x, y) {
          if (dist({x: x, y: y}, clickedPos) < minSep) return true;
          for (var i = 0; i < planned.length; i++) {
            if (dist({x: x, y: y}, planned[i]) < minSep) return true;
          }
          return false;
        }

        while (attempts < 15 && tooClose(nx, ny)) {
          angle = Math.random() * Math.PI * 2;
          r = (Math.random() * 0.6 + 0.4) * jitter;
          nx = clamp(p.x + Math.cos(angle) * r, minX, maxX);
          ny = clamp(p.y + Math.sin(angle) * r, minY, maxY);
          attempts++;
        }
        
        planned.push({x: nx, y: ny});
  n.animate({ position: { x: nx, y: ny }, style: { width: targetOther, height: targetOther } }, { duration: animateDuration, easing: 'ease-in-out' });
      });

      // After animation, unlock and redirect if url
      cy._redirectTimeout = setTimeout(function () {
        node.unlock();
        node.data('size', originalSize); // restore size for next time
        node.removeClass('active');
        if (url && redirectEnabled) {
          // Persist positions before leave
          try {
            var pos = {};
            cy.nodes().forEach(function(n){ pos[n.id()] = n.position(); });
            localStorage.setItem(persistKey, JSON.stringify(pos));
          } catch(e) { /* ignore */ }
          if (options.openInNewTab) {
            window.open(url, '_blank', 'noopener');
          } else {
            window.location.href = url;
          }
        }
      }, redirectDelay);
    });

    // First data render: inline or fetch
    if (positionsRestored) {
      // Keep restored positions; no layout or fitting needed
  // Positions restored from localStorage; keeping exact coordinates
    } else if (hadInlineData) {
      renderFrom(data);
    } else if (dataSrc) {
      // Fetch external data. Be lenient: if response isn't pure JSON (e.g., wrapped in shortcode/text),
      // try to extract the first {...} block and parse it.
      fetch(dataSrc, { credentials: 'omit' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (text) {
          var trimmed = (text || '').trim();
          try { return JSON.parse(trimmed); } catch (e) {
            // Attempt to extract JSON object substring
            var first = trimmed.indexOf('{');
            var last = trimmed.lastIndexOf('}');
            if (first !== -1 && last !== -1 && last > first) {
              var slice = trimmed.slice(first, last + 1);
              try { return JSON.parse(slice); } catch (e2) { /* fall through */ }
            }
            throw new SyntaxError('Could not parse JSON from data-src; starts with: ' + trimmed.slice(0, 40));
          }
        })
        .then(function (json) { renderFrom(json); })
        .catch(function (err) {
          console.error('WP Network Graph: failed to fetch data from', dataSrc, err);
        });
    } else {
      console.info('WP Network Graph: No inline data and no data-src found. Nothing to render.');
    }
  }

  // Initialize when DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    var containers = document.querySelectorAll('.wpng-graph');
    containers.forEach(init);
  });
})();
