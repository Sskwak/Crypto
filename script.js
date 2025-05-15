// WASM 초기화 함수
async function initWasm() {
    try {
        const go = new Go();
        const result = await fetch('main.wasm');
        const buffer = await result.arrayBuffer();
        const obj = await WebAssembly.instantiate(buffer, go.importObject);
        go.run(obj.instance);
        console.log('WASM initialized successfully');
        // WASM 함수 등록 확인
        console.log('pemToHexArray 함수 확인:', !!window.pemToHexArray);
        console.log('hexArrayToPem 함수 확인:', !!window.hexArrayToPem);
        console.log('sha256Go 함수 확인:', !!window.hexStringToSha256Array);
    } catch (err) {
        console.error('Failed to initialize WASM:', err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // WASM 초기화
    await initWasm();

    // 탭 전환을 위한 요소들 선택
    const navLinks = document.querySelectorAll('nav a');
    const toolContainers = document.querySelectorAll('.tool-container');

    // 탭 전환 함수
    function switchTab(targetId) {
        // 모든 탭과 컨테이너의 active 클래스 제거
        navLinks.forEach(link => link.classList.remove('active'));
        toolContainers.forEach(container => container.classList.remove('active'));

        // 선택된 탭과 컨테이너에 active 클래스 추가
        const selectedTab = document.querySelector(`nav a[href="#${targetId}"]`);
        const selectedContainer = document.getElementById(targetId);

        if (selectedTab && selectedContainer) {
            selectedTab.classList.add('active');
            selectedContainer.classList.add('active');
        }
    }

    // 각 탭에 클릭 이벤트 리스너 추가
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            switchTab(targetId);
            window.location.hash = targetId;
        });
    });

    // PEM to HEX 변환 버튼 이벤트 리스너
    const convertButton = document.getElementById('convertButton');
    const pemInput = document.getElementById('pemInput');
    const resultDiv = document.getElementById('result');

    convertButton?.addEventListener('click', () => {
        const pemText = pemInput.value;
        if (window.pemToHexArray) {
            try {
                const cArrayResult = window.pemToHexArray(pemText);
                resultDiv.textContent = cArrayResult;
            } catch (err) {
                resultDiv.textContent = `Error: ${err.message}`;
            }
        } else {
            resultDiv.textContent = "WASM 함수가 아직 로드되지 않았습니다.";
        }
    });

    // HEX to PEM 변환 버튼 이벤트 리스너
    const convertToPemButton = document.getElementById('convertToPem');
    const hexInput = document.getElementById('hexInput');
    const pemResultDiv = document.getElementById('pemResult');

    convertToPemButton?.addEventListener('click', () => {
        const hexText = hexInput.value;
        if (window.hexArrayToPem) {
            try {
                // 기본적으로 CERTIFICATE 타입으로 설정하지만, 필요에 따라 다른 타입을 사용할 수 있습니다.
                const pemResult = window.hexArrayToPem(hexText, "CERTIFICATE");
                pemResultDiv.textContent = pemResult;
            } catch (err) {
                pemResultDiv.textContent = `Error: ${err.message}`;
            }
        } else {
            pemResultDiv.textContent = "HEX to PEM WASM 함수가 아직 로드되지 않았습니다.";
        }
    });

    // SHA256 해시 생성 버튼 이벤트 리스너
    const generateSha256Button = document.getElementById('generateSha256');
    const sha256Input = document.getElementById('sha256Input');
    const sha256ResultDiv = document.getElementById('sha256Result');

    generateSha256Button?.addEventListener('click', () => {
        const inputText = sha256Input.value;
        if (window.sha256Go) {
            try {
                const sha256Result = window.hexStringToSha256Array(inputText);
                sha256ResultDiv.textContent = sha256Result;
            } catch (err) {
                sha256ResultDiv.textContent = `Error: ${err.message}`;
            }
        } else {
            sha256ResultDiv.textContent = "SHA256 WASM 함수가 아직 로드되지 않았습니다.";
        }
    });

    // 페이지 로드 시 초기 탭 설정
    const initialTab = window.location.hash ? window.location.hash.substring(1) : 'pemtohex';
    switchTab(initialTab);
});