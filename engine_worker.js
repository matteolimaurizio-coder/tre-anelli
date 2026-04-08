importScripts('engine_v5.js');

Module.onRuntimeInitialized = function() {
    Module.ccall('init_engine', 'null', [], []);
    postMessage({ type: 'ready' });
};

function wasmCall(funcName, returnType, argTypes, args) {
    return Module.ccall(funcName, returnType, argTypes, args);
}

self.onmessage = function(e) {
    let msg = e.data;
    try {
        if (msg.type === 'set_time') {
            wasmCall('set_time', 'null', ['number'], [msg.ms]);
        } 
        else if (msg.type === 'set_ordering') {
            wasmCall('set_ordering', 'null', ['number','number','number','number'], [msg.cap, msg.win, msg.rot, msg.place]);
        } 
        else if (msg.type === 'set_flags') {
            wasmCall('set_flags', 'null', ['number','number','number','number'], [msg.pvs?1:0, msg.nmp?1:0, msg.lmr?1:0, msg.fut?1:0]);
        } 
        else if (msg.type === 'calcola') {
            // Decodifica la modalità per il C++: 0 = Orig, 1 = Beta Con Centro, 2 = Beta Senza Centro
            let engine_mode = msg.is_beta ? (msg.is_nocenter ? 2 : 1) : 0;

            let res = wasmCall('calcola', 'number', 
                ['array','array','array','number','number','number','number'],
                [msg.board, msg.reserve, msg.special, msg.player, msg.max_depth, engine_mode, msg.rotN]
            );
            
            let eval_score = wasmCall('get_eval', 'number', [], []);
            let static_eval = wasmCall('get_static_eval', 'number', 
                ['array','array','array','number','number'],
                [msg.board, msg.reserve, msg.special, msg.player, engine_mode]
            );
            
            if (msg.player === 2) {
                eval_score = -eval_score;
                static_eval = -static_eval;
            }
            
            postMessage({
                type: 'mossa',
                result: res,
                eval_score: eval_score / 10,
                static_score: static_eval / 10,
                _callbackId: msg._callbackId
            });
        }
    } catch (err) {
        console.error("Errore di comunicazione C++:", err);
    }
};