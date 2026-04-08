importScripts('engine_v2.js');

Module.onRuntimeInitialized = function() {
    Module.ccall('init_engine', 'null', [], []);
    postMessage({ type: 'ready' });
};

// Funzione di supporto per chiamare il C++
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
            let res = wasmCall('calcola', 'number', 
                ['array','array','array','number','number','number','number'],
                [msg.board, msg.reserve, msg.special, msg.player, msg.max_depth, msg.is_beta, msg.rotN]
            );
            let eval_score = wasmCall('get_eval', 'number', [], []);
            
            postMessage({
                type: 'mossa',
                result: res,
                eval_score: eval_score,
                _callbackId: msg._callbackId
            });
        }
    } catch (err) {
        console.error("Errore di comunicazione C++:", err);
    }
};