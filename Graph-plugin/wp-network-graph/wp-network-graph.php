<?php
/**
 * Plugin Name: WP Network Graph (Shortcode)
 * Description: Adds a shortcode [network_graph] to render an interactive graph network using Cytoscape.js with click-to-center and delayed redirect.
 * Version: 1.0.0
 * Author: You
 * License: MIT
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class WP_Network_Graph_Shortcode {
    public function __construct() {
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
        add_shortcode('network_graph', [$this, 'render_shortcode']);
        // Allow JSON uploads for administrators so data files can be uploaded to Media Library
        add_filter('upload_mimes', [$this, 'allow_json_uploads']);
    }

    /**
     * Permit .json uploads (application/json) for site administrators.
     * Some security plugins may restrict this; this filter ensures admins can upload
     * JSON data files used by the shortcode. If a security layer still blocks it,
     * you can rename the file to .txt and it will still be fetched and parsed.
     */
    public function allow_json_uploads($mimes) {
        if (current_user_can('manage_options')) {
            $mimes['json'] = 'application/json';
        }
        return $mimes;
    }

    public function register_assets() {
        // Cytoscape from jsDelivr
        wp_register_script(
            'cytoscape',
            'https://cdn.jsdelivr.net/npm/cytoscape@3.28.1/dist/cytoscape.min.js',
            [],
            '3.28.1',
            true
        );


        // Our script and styles
        $plugin_url = plugin_dir_url(__FILE__);
        $plugin_path = plugin_dir_path(__FILE__);
        $js_ver = @filemtime($plugin_path . 'assets/js/graph.js') ?: '1.0.0';
        $css_ver = @filemtime($plugin_path . 'assets/css/style.css') ?: '1.0.0';

        wp_register_script(
            'wpng-graph',
            $plugin_url . 'assets/js/graph.js',
            ['cytoscape'],
            $js_ver,
            true
        );

        wp_register_style(
            'wpng-style',
            $plugin_url . 'assets/css/style.css',
            [],
            $css_ver
        );
    }

    /**
     * Shortcode handler
     * Attributes:
     *  - id: unique id for container (optional)
     *  - height: container height (default 480px)
    *  - options: JSON string of options (optional)
    *  - src: URL of JSON file containing {nodes, edges} (optional). If provided, script tag with data-src will be added and JS will fetch it.
     * Content: JSON describing nodes and edges
     */
    public function render_shortcode($atts = [], $content = null) {
        $atts = shortcode_atts([
            'id' => 'wpng-' . wp_generate_uuid4(),
            'height' => '480px',
            'options' => '{}',
            'src' => '',
            // Optional convenience attribute to define nodes inline without JSON content.
            // Format: label|url|#hex; label2|url2|#hex; ... (url/color optional)
            'nodes' => ''
        ], $atts, 'network_graph');

        // Enqueue assets
        wp_enqueue_script('cytoscape');
        wp_enqueue_script('wpng-graph');
        wp_enqueue_style('wpng-style');

        $container_id = esc_attr($atts['id']);
        $height = esc_attr($atts['height']);

        // Clean content and ensure valid JSON in HTML
        $data_json = trim(do_shortcode($content ?? ''));

        // If no JSON content provided, allow building a minimal nodes JSON from the 'nodes' attribute
        if ($data_json === '') {
            $nodes_attr = trim((string) $atts['nodes']);
            if ($nodes_attr !== '') {
                $nodes = [];
                $parts = array_filter(array_map('trim', explode(';', $nodes_attr)));
                $i = 0;
                foreach ($parts as $entry) {
                    $fields = array_map('trim', explode('|', $entry));
                    if (!isset($fields[0]) || $fields[0] === '') continue;
                    $label = sanitize_text_field($fields[0]);
                    $url = isset($fields[1]) ? esc_url_raw($fields[1]) : '';
                    $color = isset($fields[2]) ? sanitize_text_field($fields[2]) : '';
                    $nodes[] = [
                        'id' => (string) ($i + 1),
                        'label' => $label,
                        'url' => $url,
                        'color' => $color
                    ];
                    $i++;
                }
                $data_json = wp_json_encode([ 'nodes' => $nodes, 'edges' => [] ]);
            }
        }
        if ($data_json === '') {
            $data_json = '{}';
        }

        $options_json = $atts['options'];
        if (!is_string($options_json) || $options_json === '') {
            $options_json = '{}';
        }

        ob_start();
                ?>
        <div class="wpng-graph-wrapper">
            <div id="<?php echo $container_id; ?>" class="wpng-graph" style="height: <?php echo $height; ?>"></div>
            <script type="application/json" class="wpng-graph-data" data-for="<?php echo $container_id; ?>"><?php echo wp_kses_post($data_json); ?></script>
            <script type="application/json" class="wpng-graph-options" data-for="<?php echo $container_id; ?>"><?php echo wp_kses_post($options_json); ?></script>
                        <?php if (!empty($atts['src'])): ?>
                            <span class="wpng-graph-src" data-for="<?php echo $container_id; ?>" data-src="<?php echo esc_url($atts['src']); ?>"></span>
                        <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
}

new WP_Network_Graph_Shortcode();
