const http = require('http');

function checkOllama() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:11434/api/version', (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Ollama is running');
                resolve(true);
            } else {
                console.error('❌ Ollama returned unexpected status:', res.statusCode);
                reject(new Error(`Ollama returned status ${res.statusCode}`));
            }
        });

        req.on('error', (error) => {
            if (error.code === 'ECONNREFUSED') {
                console.error('❌ Ollama is not running. Please start Ollama first:');
                console.error('   ollama serve');
                process.exit(1);
            } else {
                console.error('❌ Error checking Ollama:', error);
                reject(error);
            }
        });

        req.end();
    });
}

// Export as Jest global setup
module.exports = async () => {
    try {
        await checkOllama();
    } catch (error) {
        process.exit(1);
    }
};
