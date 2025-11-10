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

        // Select SVG and clear all contents
        this.svg = d3.select(`#${this.containerId}`)
            .attr('width', this.width)
            .attr('height', this.height);
        
        // Remove all existing children
        this.svg.selectAll('*').remove();

        // Create a group for zoom/pan
        this.g = this.svg.append('g');

        // Setup zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);
        
        // Add click handler to SVG background for deselect
        this.svg.on('click', (event) => {
            // Only trigger if clicking on SVG itself (not on nodes)
            if (event.target === this.svg.node() || event.target.tagName === 'g') {
                if (this.onBackgroundClick) {
                    this.onBackgroundClick();
                }
            }
        });

        // Initialize force simulation
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(60));
        
        // Store node positions to prevent re-layout
        this.nodePositions = new Map();
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
        
        // Define profile pictures for main connector nodes (Related To category)
        const mainNodeImages = {
            'Hassan Akbari': 'https://media.licdn.com/dms/image/v2/D4D03AQFhyNyncM8j5g/profile-displayphoto-shrink_800_800/B4DZaxcNrqHQAc-/0/1746733688899?e=1764201600&v=beta&t=Xs0S_umdKW5SqqYWp8iOXylPZlrrFADG53RmfIhTes0',
            'Ahmed Sattar': 'https://media.licdn.com/dms/image/v2/D4D03AQH4ImLvBPXDbg/profile-displayphoto-crop_800_800/B4DZeSmMuCHAAM-/0/1750511178893?e=1764201600&v=beta&t=bJdrIxL5YkS1SaXJAyL5COtOpLvONo5qsWMxHUBSQrg',
            'Farrokh Razh': 'https://media.licdn.com/dms/image/v2/D4D03AQEof5CfWMMdbw/profile-displayphoto-crop_800_800/B4DZpjB4hGJMAI-/0/1762598031166?e=1764201600&v=beta&t=SH1NGYQcV7yxX_EJaK7rlyVj9Tk9snNXuqS37q4WNRE',
            'Amirhossein Sattari': 'https://media.licdn.com/dms/image/v2/D4D03AQHWIA_BVIbzXQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1703150218913?e=1764201600&v=beta&t=7fuLUXVO15xnxrH3zJxqyHpq2ieVd3dMHbiASMNBY50',
            'Mahdi Fard': 'https://media.licdn.com/dms/image/v2/D4D03AQHwovUK1o3CNw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1732604567640?e=1764201600&v=beta&t=D1wHiKIZuOsj5QqhNFk8628s68NwO9nMnqfn_WXuWIk',
            'Atefeh Shahrashoob': 'https://media.licdn.com/dms/image/v2/D4D03AQHod6SzGap33Q/profile-displayphoto-crop_800_800/B4DZmev9QnG8AI-/0/1759304997939?e=1764201600&v=beta&t=t646_tCTQrILIge5CoDT9l93tclISX6Z8zj23ib1Vko'
        };
        
        mainNodes.forEach(mainNode => {
            // Generate initials for main nodes too
            const initials = mainNode
                .split(' ')
                .filter(word => word.length > 0)
                .map(word => word[0].toUpperCase())
                .slice(0, 2)
                .join('');
                
            const node = {
                id: `main-${nodeId}`,
                label: mainNode,
                type: 'main',
                size: 40,
                profilePicture: mainNodeImages[mainNode] || '',
                initials: initials
            };
            nodes.push(node);
            nodeMap.set(mainNode, node.id);
            nodeId++;
        });

        // Create person nodes and links
        data.forEach(person => {
            // Generate initials from name
            const initials = person.Name
                ? person.Name.split(' ')
                    .filter(word => word.length > 0)
                    .map(word => word[0].toUpperCase())
                    .slice(0, 2)
                    .join('')
                : '?';
            
            const personNode = {
                id: `person-${nodeId}`,
                label: person.Name,
                type: 'person',
                size: 25,
                data: person,
                initials: initials
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
    render(data, connectorType, onNodeClick, onBackgroundClick) {
        // Store callbacks
        this.onBackgroundClick = onBackgroundClick;
        
        // Stop any existing simulation
        if (this.simulation) {
            this.simulation.stop();
        }
        
        // Save current zoom transform before clearing
        const currentTransform = d3.zoomTransform(this.svg.node());
        
        // Clear ALL SVG contents and reinitialize
        this.svg.selectAll('*').remove();
        
        // Recreate the zoom group
        this.g = this.svg.append('g');
        
        // Apply the saved transform to the new group
        this.g.attr('transform', currentTransform);
        
        // Reapply zoom behavior to the fresh SVG
        this.svg.call(this.zoom);
        
        // Add click handler to SVG background for deselect
        this.svg.on('click', (event) => {
            // Only trigger if clicking on SVG itself (not on nodes)
            if (event.target === this.svg.node() || event.target.tagName === 'g') {
                if (this.onBackgroundClick) {
                    this.onBackgroundClick();
                }
            }
        });

        // Process data
        const { nodes, links } = this.processData(data, connectorType);
        
        // Restore saved positions if they exist
        nodes.forEach(node => {
            const savedPos = this.nodePositions.get(node.id);
            if (savedPos) {
                node.x = savedPos.x;
                node.y = savedPos.y;
                node.fx = savedPos.x; // Fix position
                node.fy = savedPos.y;
            }
        });

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

        // Create nodes (removed drag behavior)
        const node = this.g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', d => `node ${d.type}-node`);

        // Add visual elements to nodes
        node.each(function(d) {
            const g = d3.select(this);
            
            // Check if node has a profile picture (person nodes or main nodes with profilePicture)
            const hasProfilePicture = (d.type === 'person' && d.data && d.data['Profile Picture']) || 
                                    (d.type === 'main' && d.profilePicture);
            const pictureUrl = d.type === 'person' ? d.data['Profile Picture'] : d.profilePicture;
            
            if (hasProfilePicture) {
                // Add profile picture if available
                g.append('clipPath')
                    .attr('id', `clip-${d.id}`)
                    .append('circle')
                    .attr('r', d.size);
                
                g.append('circle')
                    .attr('r', d.size)
                    .attr('fill', '#e0e0e0')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 3);
                
                g.append('image')
                    .attr('xlink:href', pictureUrl)
                    .attr('x', -d.size)
                    .attr('y', -d.size)
                    .attr('width', d.size * 2)
                    .attr('height', d.size * 2)
                    .attr('clip-path', `url(#clip-${d.id})`)
                    .style('cursor', 'pointer')
                    .on('error', function() {
                        // Fallback to initials if image fails to load
                        d3.select(this).remove();
                        const circle = g.select('circle');
                        circle.attr('fill', d.type === 'main' ? '#4CAF50' : '#2196F3');
                        
                        g.append('text')
                            .text(d.initials || '?')
                            .attr('text-anchor', 'middle')
                            .attr('dy', '0.35em')
                            .attr('fill', '#fff')
                            .attr('font-size', `${d.size * 0.6}px`)
                            .attr('font-weight', 'bold')
                            .style('pointer-events', 'none');
                    });
            } else {
                // No picture - show initials or colored circle
                g.append('circle')
                    .attr('r', d.size)
                    .attr('fill', d.type === 'main' ? '#4CAF50' : '#2196F3')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 3)
                    .style('cursor', 'pointer');
                
                if (d.type === 'person' && d.initials) {
                    g.append('text')
                        .text(d.initials)
                        .attr('text-anchor', 'middle')
                        .attr('dy', '0.35em')
                        .attr('fill', '#fff')
                        .attr('font-size', `${d.size * 0.6}px`)
                        .attr('font-weight', 'bold')
                        .style('pointer-events', 'none');
                }
            }
        });

        // Add labels below nodes
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
            event.stopPropagation(); // Prevent background click
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

        // If we have saved positions, restore them and render immediately
        const hasSavedPositions = nodes.some(n => this.nodePositions.has(n.id));
        if (hasSavedPositions) {
            console.log('Restoring saved positions for', nodes.length, 'nodes');
            // Position all elements immediately without simulation
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('transform', d => `translate(${d.x},${d.y})`);
                
            // Don't run simulation at all for saved positions
            console.log('Nodes positioned using saved coordinates');
        } else {
            console.log('No saved positions, running simulation for initial layout');
            // Run simulation for initial layout, then stop and save positions
            this.simulation.alpha(1).restart();
            
            // Stop after layout stabilizes and save positions
            setTimeout(() => {
                this.simulation.stop();
                nodes.forEach(node => {
                    this.nodePositions.set(node.id, { x: node.x, y: node.y });
                });
                console.log('Saved positions for', nodes.length, 'nodes');
            }, 3000); // Wait 3 seconds for layout to stabilize
        }
    }

    destroy() {
        if (this.simulation) {
            this.simulation.stop();
        }
    }
}
