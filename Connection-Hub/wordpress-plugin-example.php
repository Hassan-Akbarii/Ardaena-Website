<?php
/**
 * Plugin Name: Connection Hub Network Visualization
 * Plugin URI: https://ardaena.com
 * Description: Interactive network visualization for professional connections from Microsoft SharePoint List
 * Version: 1.0.0
 * Author: Ardaena
 * Author URI: https://ardaena.com
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class ConnectionHubPlugin {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Register shortcode
        add_shortcode('connection_hub', array($this, 'render_shortcode'));
        
        // Register scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }
    
    public function enqueue_scripts() {
        // Only enqueue on pages using the shortcode
        if (!is_singular() || !has_shortcode(get_post()->post_content, 'connection_hub')) {
            return;
        }
        
        // D3.js Library
        wp_enqueue_script(
            'd3js',
            'https://d3js.org/d3.v7.min.js',
            array(),
            '7.0',
            true
        );
        
        // Connection Hub Scripts
        wp_enqueue_script(
            'connection-hub-sharepoint',
            plugin_dir_url(__FILE__) . 'assets/js/sharepoint-api.js',
            array(),
            '1.0.0',
            true
        );
        
        wp_enqueue_script(
            'connection-hub-graph',
            plugin_dir_url(__FILE__) . 'assets/js/graph.js',
            array('d3js'),
            '1.0.0',
            true
        );
        
        wp_enqueue_script(
            'connection-hub-app',
            plugin_dir_url(__FILE__) . 'assets/js/app.js',
            array('connection-hub-graph', 'connection-hub-sharepoint'),
            '1.0.0',
            true
        );
        
        // Styles
        wp_enqueue_style(
            'connection-hub-style',
            plugin_dir_url(__FILE__) . 'assets/css/style.css',
            array(),
            '1.0.0'
        );
    }
    
    public function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'height' => '800px',
            'connector' => 'relatedTo'
        ), $atts);
        
        ob_start();
        ?>
        <div class="connection-hub-wrapper" style="height: <?php echo esc_attr($atts['height']); ?>;">
            <div class="container" style="height: 100%;">
                <!-- Header Section -->
                <header class="header">
                    <h1>Connection Hub</h1>
                    <p class="subtitle">Professional Network Visualization</p>
                </header>

                <!-- Control Panel -->
                <div class="control-panel">
                    <div class="control-group">
                        <label for="connector-select">Select Connector Category:</label>
                        <select id="connector-select" class="connector-selector">
                            <option value="relatedTo" <?php selected($atts['connector'], 'relatedTo'); ?>>Related To</option>
                            <option value="jobPosition" <?php selected($atts['connector'], 'jobPosition'); ?>>Job Position</option>
                            <option value="keywords" <?php selected($atts['connector'], 'keywords'); ?>>Key Words</option>
                        </select>
                    </div>
                    
                    <div class="control-group">
                        <button id="refresh-btn" class="btn btn-primary">Refresh Data</button>
                        <button id="reset-zoom-btn" class="btn btn-secondary">Reset View</button>
                    </div>
                </div>

                <!-- Graph Canvas -->
                <div id="graph-container" class="graph-container">
                    <svg id="network-graph"></svg>
                    <div id="loading" class="loading">Loading connections...</div>
                </div>

                <!-- Data Modal -->
                <div id="data-modal" class="modal">
                    <div class="modal-content">
                        <span class="close-btn">&times;</span>
                        <h2 id="modal-name">Person Name</h2>
                        
                        <div class="modal-body">
                            <div class="data-section">
                                <h3>Contact Information</h3>
                                <div class="data-item">
                                    <strong>Firm:</strong>
                                    <span id="modal-firm">-</span>
                                </div>
                                <div class="data-item">
                                    <strong>Job Position:</strong>
                                    <span id="modal-position">-</span>
                                </div>
                                <div class="data-item">
                                    <strong>Website:</strong>
                                    <a id="modal-website" href="#" target="_blank">-</a>
                                </div>
                                <div class="data-item">
                                    <strong>LinkedIn:</strong>
                                    <a id="modal-linkedin" href="#" target="_blank">View Profile</a>
                                </div>
                            </div>

                            <div class="data-section">
                                <h3>Connection Details</h3>
                                <div class="data-item">
                                    <strong>Related To:</strong>
                                    <span id="modal-related">-</span>
                                </div>
                                <div class="data-item">
                                    <strong>Key Words:</strong>
                                    <span id="modal-keywords">-</span>
                                </div>
                                <div class="data-item">
                                    <strong>Last Contact:</strong>
                                    <span id="modal-lastcontact">-</span>
                                </div>
                            </div>

                            <div class="data-section" id="notes-section">
                                <h3>Notes</h3>
                                <p id="modal-notes">-</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

// Initialize the plugin
ConnectionHubPlugin::get_instance();

/**
 * Usage in WordPress:
 * 
 * Basic:
 * [connection_hub]
 * 
 * With custom height:
 * [connection_hub height="600px"]
 * 
 * With default connector:
 * [connection_hub connector="keywords"]
 */
