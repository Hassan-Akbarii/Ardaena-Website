/**
 * Graph Visualization Module
 * Handles the D3.js force-directed graph visualization
 */

class NetworkGraph {
    constructor(containerId) {
        this.containerId = containerId;
        this.svg = null;
        this.g = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.width = 0;
        this.height = 0;
        this.zoom = null;
        
        this.init();
    }

    init() {
        // Get container dimensions
        const container = document.getElementById(this.containerId);
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        // Create SVG
        this.svg = d3.select(`#${this.containerId}`)
            .attr('width', this.width)
            .attr('height', this.height);

        // Create a group for zoom/pan
        this.g = this.svg.append('g');

        // Setup zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);

        // Initialize force simulation
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(60));
    }

    resetZoom() {
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity);
    }

    /**
     * Process data and create graph structure
     * @param {Array} data - Array of person objects from SharePoint
     * @param {String} connectorType - Type of connector (relatedTo, jobPosition, keywords)
     */
    processData(data, connectorType) {
        const nodes = [];
        const links = [];
        const mainNodes = new Set();
        const nodeMap = new Map();

        // Determine which field to use as connector
        let connectorField;
        switch(connectorType) {
            case 'relatedTo':
                connectorField = 'Related to';
                break;
            case 'jobPosition':
                connectorField = 'Job position';
                break;
            case 'keywords':
                connectorField = 'Key words';
                break;
            default:
                connectorField = 'Related to';
        }

        // First pass: collect all unique main nodes
        data.forEach(person => {
            const connectorValue = person[connectorField];
            if (connectorValue) {
                // Handle multiple keywords separated by comma
                if (connectorType === 'keywords' && connectorValue.includes(',')) {
                    connectorValue.split(',').forEach(kw => mainNodes.add(kw.trim()));
                } else {
                    mainNodes.add(connectorValue);
                }
            }
        });

        // Create main nodes (connectors)
        let nodeId = 0;
        mainNodes.forEach(mainNode => {
            const node = {
                id: `main-${nodeId}`,
                label: mainNode,
                type: 'main',
                size: 40
            };
            nodes.push(node);
            nodeMap.set(mainNode, node.id);
            nodeId++;
        });

        // Create person nodes and links
        data.forEach(person => {
            const personNode = {
                id: `person-${nodeId}`,
                label: person.Name,
                type: 'person',
                size: 25,
                data: person
            };
            nodes.push(personNode);
            nodeId++;

            // Create links to main nodes
            const connectorValue = person[connectorField];
            if (connectorValue) {
                if (connectorType === 'keywords' && connectorValue.includes(',')) {
                    // Link to multiple keyword nodes
                    connectorValue.split(',').forEach(kw => {
                        const mainNodeId = nodeMap.get(kw.trim());
                        if (mainNodeId) {
                            links.push({
                                source: mainNodeId,
                                target: personNode.id
                            });
                        }
                    });
                } else {
                    // Link to single main node
                    const mainNodeId = nodeMap.get(connectorValue);
                    if (mainNodeId) {
                        links.push({
                            source: mainNodeId,
                            target: personNode.id
                        });
                    }
                }
            }
        });

        this.nodes = nodes;
        this.links = links;
        return { nodes, links };
    }

    /**
     * Render the graph
     */
    render(data, connectorType, onNodeClick) {
        // Clear existing graph
        this.g.selectAll('*').remove();

        // Process data
        const { nodes, links } = this.processData(data, connectorType);

        // Create links
        const link = this.g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2);

        // Create nodes
        const node = this.g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', d => `node ${d.type}-node`)
            .call(d3.drag()
                .on('start', (event, d) => this.dragStarted(event, d))
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', (event, d) => this.dragEnded(event, d)));

        // Add circles to nodes
        node.append('circle')
            .attr('r', d => d.size)
            .attr('fill', d => d.type === 'main' ? '#4CAF50' : '#2196F3')
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .style('cursor', 'pointer');

        // Add labels to nodes
        node.append('text')
            .text(d => d.label)
            .attr('text-anchor', 'middle')
            .attr('dy', d => d.size + 15)
            .attr('fill', '#333')
            .attr('font-size', '12px')
            .attr('font-weight', d => d.type === 'main' ? 'bold' : 'normal')
            .style('pointer-events', 'none');

        // Add click handler
        node.on('click', (event, d) => {
            if (d.type === 'person' && onNodeClick) {
                onNodeClick(d.data);
            }
        });

        // Update simulation
        this.simulation
            .nodes(nodes)
            .on('tick', () => {
                link
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);

                node
                    .attr('transform', d => `translate(${d.x},${d.y})`);
            });

        this.simulation.force('link')
            .links(links);

        this.simulation.alpha(1).restart();
    }

    // Drag functions
    dragStarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    dragEnded(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    destroy() {
        if (this.simulation) {
            this.simulation.stop();
        }
    }
}
