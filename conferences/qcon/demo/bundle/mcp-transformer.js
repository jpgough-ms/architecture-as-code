export default class McpTransformer {
    registerTemplateHelpers() {
        return {};
    }

    /**
     * Exposes values for:
     *  {{ mcp-server-image }}
     *  {{ mcp-server-port }}
     *  {{ reports-api-image }}
     *  {{ reports-api-port }}
     *  {{ secret-api-image }}
     *  {{ secret-api-port }}
     *
     * Accepts raw CALM object, JSON string, or { originalJson: ... } wrapper.
     * @param {object|string} calmJson
     * @returns {{ document: {
     *   'mcp-server-image'?: string;
     *   'mcp-server-port'?: number;
     *   'reports-api-image'?: string;
     *   'reports-api-port'?: number;
     *   'secret-api-image'?: string;
     *   'secret-api-port'?: number;
     * }}}
     */
    getTransformedModel(calmJson) {
        const data = this._normalizeModel(calmJson);

        const mcpServerImage = this._ifaceValueForNode(data, 'mcp-server', 'mcp-server-image', 'image');
        const mcpServerPort  = this._coercePort(this._ifaceValueForNode(data, 'mcp-server', 'mcp-server-port', 'port'));

        const reportsApiImage = this._ifaceValueForNode(data, 'reports-api', 'reports-api-image', 'image');
        const reportsApiPort  = this._coercePort(this._ifaceValueForNode(data, 'reports-api', 'reports-api-port', 'port'));

        const secretApiImage  = this._ifaceValueForNode(data, 'secret-api', 'secret-api-image', 'image');
        const secretApiPort   = this._coercePort(this._ifaceValueForNode(data, 'secret-api', 'secret-api-port', 'port'));

        return {
            document: {
                'mcp-server-image': mcpServerImage,
                'mcp-server-port': mcpServerPort,
                'reports-api-image': reportsApiImage,   // <-- added back
                'reports-api-port': reportsApiPort,
                'secret-api-image': secretApiImage,
                'secret-api-port': secretApiPort,
            },
        };
    }

    // --- helpers ---

    _normalizeModel(input) {
        if (!input) return {};
        let obj = input;

        if (typeof obj === 'string') {
            try { obj = JSON.parse(obj); } catch { return {}; }
        }

        if (obj && obj.originalJson) return obj.originalJson;
        return obj || {};
    }

    /**
     * Prefer: node(unique-id=nodeId) -> interface(unique-id=ifaceId & has key)
     * Fallbacks:
     *  - any interface on that node with the key
     *  - any node having an interface with unique-id = ifaceId & key
     */
    _ifaceValueForNode(data, nodeId, ifaceId, key) {
        const nodes = Array.isArray(data.nodes) ? data.nodes : [];

        const node = nodes.find(n => n && n['unique-id'] === nodeId);
        if (node && Array.isArray(node.interfaces)) {
            const exact = node.interfaces.find(i => i && i['unique-id'] === ifaceId && Object.prototype.hasOwnProperty.call(i, key));
            if (exact) return exact[key];

            const anyOnNode = node.interfaces.find(i => i && Object.prototype.hasOwnProperty.call(i, key));
            if (anyOnNode) return anyOnNode[key];
        }

        for (const n of nodes) {
            for (const iface of n.interfaces || []) {
                if (iface && iface['unique-id'] === ifaceId && Object.prototype.hasOwnProperty.call(iface, key)) {
                    return iface[key];
                }
            }
        }

        return undefined;
    }

    _coercePort(v) {
        if (v == null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    }
}
