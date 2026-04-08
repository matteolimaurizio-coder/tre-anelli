'use strict';

let isReady = false;

var Module = {
    onRuntimeInitialized: function () {
        isReady = true;
        postMessage({ type: 'ready' });
    },
    print:    function(text) { console.log('[C++]', text); },
    printErr: function(text) { console.warn('[C++]', text); }
};

try {
    importScripts('engine_v2.js');
} catch(e) {
    postMessage({ type:'error', message: 'Impossibile caricare engine.js: ' + e.message });
}

function wasmCall(name, retType, argTypes, args) {
    return Module.ccall(name, retType, argTypes, args);
}

self.onmessage = function(e) {
    const msg = e.data;

    if (!isReady) {
        if (msg.type === 'calcola') setTimeout(() => self.onmessage(e), 100);
        return;
    }

    switch (msg.type) {
        case 'set_time':
            wasmCall('set_time_limit_wasm', null, ['number'], [msg.ms | 0]);
            break;

        case 'set_ordering':
            wasmCall('set_ordering_wasm', null,
                ['number','number','number','number'],
                [msg.cap|0, msg.win|0, msg.rot|0, msg.place|0]
            );
            break;

        case 'calcola':
            const { board, reserve, special, player, max_depth, is_beta, rotN, _callbackId } = msg;
            const t0 = performance.now();

            // Usiamo il 'array' magico di Emscripten (sicuro al 100%)
            let result = wasmCall('calcola_mossa_wasm', 'number',
                ['array','array','array','number','number','number','number'],
                [board, reserve, special, player | 0, max_depth | 0, is_beta | 0, rotN | 0]);

            let eval_score = wasmCall('get_last_eval', 'number', [], []);
            let depth      = wasmCall('get_last_depth', 'number', [], []);
            let nodes      = wasmCall('get_node_count_wasm', 'number', [], []);
            let tt_hits    = wasmCall('get_tt_hits_wasm', 'number', [], []);

            const time_ms = Math.round(performance.now() - t0);

            postMessage({
                type: 'mossa', result, eval_score, depth, nodes, tt_hits, time_ms, _callbackId
            });
            break;
    }
};